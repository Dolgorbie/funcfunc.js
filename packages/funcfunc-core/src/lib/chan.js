import { every1, map1 } from "./arrays";
import { toUInt } from "./asfunc";
import { pa1, pipe } from "./core";
import { undefMap1 } from "./nullable";
import { Queue } from "./queue";

const _eoc = Symbol("end of chan");

export function isEndOfChan(value) {
  return value === _eoc;
}

export function isChan(obj) {
  return obj instanceof Chan;
}

export function tryPost(chan, value) {
  return chan.tryPost(value);
}

export function xtryPost(value, chan) {
  return chan.tryPost(value);
}

export function tryTake(chan) {
  return chan.tryTake();
}

export function post(chan, value) {
  return chan.post(value);
}

export function xpost(value, chan) {
  return chan.post(value);
}

export function take(chan, signal = void 0) {
  return chan.take(signal);
}

export function xtake(signal, chan) {
  return chan.take(signal);
}

export async function alts(...chans) {
  const { length } = chans;
  const offset = Math.random() * length | 0
  for (let i = 0; i < length; ++i) {
    const chan = chans[(i + offset) % length];

    const res = chan.tryTake();
    if (res.success) {
      return { value: res.value, chan };
    }
  }

  const abortCtrl = new AbortController();
  const { signal } = abortCtrl;

  return Promise.any(map1(async (chan) => {
    const value = await chan.take(signal);
    abortCtrl.abort(Error("selected another chan by `alts`."));
    return { value, chan };
  }, chans));
}

export function merge(outChan, ...inChans) {
  (async () => {
    const abortTakeController = new AbortController();
    const { signal: abortTakeSignal } = abortTakeController;
    try {
      for (; ;) {
        const posted = await Promise.allSettled(map1(async (chan) => {
          const value = await chan.take(abortTakeSignal);
          if (isEndOfChan(value)) {
            return false;
          }
          await outChan.post({ value, chan });
          return true;
        }, inChans));

        if (every1(({ status, value }) => status === "rejected" || !value, posted)) {
          return;
        }
      }
    } catch (error) {
      abortTakeController.abort(error);
    } finally {
      outChan.close();
    }
  })();
}

export class Chan {
  constructor({ capacity, signal } = {}) {
    this._bufferCapacity = undefMap1(pipe(toUInt, pa1(Math.max, 0)), capacity);
    this._bufferQueue = new Queue();

    this._postContQueue = new Queue();
    this._takeContQueue = new Queue();

    this._isClosed = false;
    this._afterCloseHooks = new Set();
    this._signal = signal;

    if (signal != null) {
      this.close = this.close.bind(this);
      signal.addEventListener("abort", this.close, { once: true });
      this._afterCloseHooks.add(_removeAbortEventListenter);
    }
  }

  tryPost(value) {
    if (this._isClosed) {
      throw Error("chan closed");
    }

    const { _takeContQueue } = this;
    if (_takeContQueue.size > 0) {
      const resolve = _takeContQueue.pop();
      resolve(value);
      return true;
    }

    const { _bufferCapacity, _bufferQueue } = this;
    if (_bufferCapacity === void 0 || _bufferQueue.size < _bufferCapacity) {
      _bufferQueue.add(value);
      return true;
    }

    return false;
  }

  async post(value, signal = void 0) {
    if (signal !== void 0 && signal.aborted) {
      throw signal.reason;
    }

    const success = this.tryPost(value);
    if (success) {
      return;
    }

    return new Promise((resolve, reject) => {
      function _cancel() {
        _postContQueue.delete(_cleanAndResolve);
        signal.removeEventListener("abort", _cancel);
        reject(signal.reason);
      }

      function _cleanAndResolve() {
        signal.removeEventListener("abort", _cancel);
        resolve();
      }

      function _cleanAndReject(reason) {
        signal.removeEventListener("abort", _cancel);
        reject(reason);
      }

      if (signal !== void 0 && signal.aborted) {
        reject(signal.reason);
        return;
      }

      const { _postContQueue } = this;

      if (signal === void 0) {
        _postContQueue.add([value, resolve, reject]);
        return;
      }

      signal.addEventListener("abort", _cancel);
      _postContQueue.add([value, _cleanAndResolve, _cleanAndReject]);
    });
  }

  tryTake() {
    const { _bufferQueue } = this;
    if (_bufferQueue.size > 0) {
      const value = _bufferQueue.pop();

      const { _postContQueue } = this;
      if (_postContQueue.size > 0) {
        const [value, resolve] = _postContQueue.pop();
        _bufferQueue.add(value);
        resolve();
      }

      return { value, success: true };
    }

    if (this._isClosed) {
      return { value: _eoc, success: true };
    }

    const { _postContQueue } = this;
    if (_postContQueue.size > 0) {
      const [value, resolve] = _postContQueue.pop();
      resolve();
      return { value, success: true };
    }

    return { value: void 0, success: false };
  }

  async take(signal = void 0) {
    if (signal !== void 0 && signal.aborted) {
      throw signal.reason;
    }

    const res = this.tryTake();
    if (res.success) {
      return res.value;
    }

    return new Promise((resolve, reject) => {
      function _cancel() {
        _takeContQueue.delete(_cleanAndResolve);
        signal.removeEventListener("abort", _cancel);
        reject(signal.reason);
      }

      function _cleanAndResolve(value) {
        signal.removeEventListener("abort", _cancel);
        resolve(value);
      }

      if (signal !== void 0 && signal.aborted) {
        reject(signal.reason);
        return;
      }

      const { _takeContQueue } = this;

      if (signal === void 0) {
        _takeContQueue.add(resolve);
        return;
      }

      signal.addEventListener("abort", _cancel);
      _takeContQueue.add(_cleanAndResolve);
    });
  }

  get closed() {
    return this._isClosed;
  }

  close() {
    if (this._isClosed) {
      return;
    }

    this._postContQueue.forEach(([, , reject]) => reject(Error("chan closed")));
    this._takeContQueue.forEach((resolve) => resolve(_eoc));
    this._postContQueue.clear();
    this._takeContQueue.clear();

    this._isClosed = true;

    this._afterCloseHooks.forEach((callback) => callback(this));
  }

  addCloseHook(callback) {
    this._afterCloseHooks.add(callback);
  }

  deleteCloseHook(callback) {
    this._afterCloseHooks.delete(callback);
  }

  static fromPromise(promise, signal = void 0) {
    const chan = new Chan({ capacity: 0, signal });

    (async () => {
      try {
        await chan.post({ success: true, value: await promise, error: void 0 });
      } catch (error) {
        try {
          await chan.post({ success: false, value: void 0, error });
        } catch (e) {
          console.error("failed to post the error-result to chan:", chan, "which error is:", error, e);
        }
      } finally {
        chan.close();
      }
    })();

    return chan;
  }
}

function _removeAbortEventListenter(chan) {
  chan._signal.removeEventListener("abort", chan.close);
}
