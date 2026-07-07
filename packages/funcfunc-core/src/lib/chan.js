import { map1 } from "./arrays";
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

export class Chan {
  constructor({ bufferCapacity, signal } = {}) {
    this._bufferCapacity = undefMap1(pipe(toUInt, pa1(Math.max, 0)), bufferCapacity);
    this._bufferQueue = new Queue();

    this._postContQueue = new Queue();
    this._takeContQueue = new Queue();

    this._closed = false;
    this._customCleanupSet = new Set();
    this._signal = signal;

    if (signal != null) {
      this.close = this.close.bind(this);
      signal.addEventListener("abort", this.close);
      this._customCleanupSet.add(_removeAbortEventListenter);
    }
  }

  tryPost(value) {
    if (this._closed) {
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

  async post(value) {
    const success = this.tryPost(value);
    if (success) {
      return;
    }

    return new Promise((resolve, reject) => {
      this._postContQueue.add([value, resolve, reject]);
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

    if (this._closed) {
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
    if (signal === void 0) {
      const res = this.tryTake();
      if (res.success) {
        return res.value;
      }

      return new Promise((resolve) => {
        this._takeContQueue.add(resolve);
      });
    }

    if (signal.aborted) {
      throw signal.reason;
    }

    const res = this.tryTake();
    if (res.success) {
      return res.value;
    }

    return new Promise((resolve, reject) => {
      const { _takeContQueue } = this;
      function _cancel() {
        _takeContQueue.remove(_cleanAndResolve);
        signal.removeEventListener("abort", _cancel);
        reject(signal.reason);
      }

      function _cleanAndResolve(value) {
        signal.removeEventListener("abort", _cancel);
        resolve(value);
      }

      if (signal.aborted) {
        reject(signal.reason);
        return;
      }

      signal.addEventListener("abort", _cancel);
      _takeContQueue.add(_cleanAndResolve);
    });
  }

  get isClosed() {
    return this._closed;
  }

  close() {
    if (this._closed) {
      return;
    }

    this._postContQueue.forEach(([, , reject]) => reject(Error("chan closed")));
    this._takeContQueue.forEach((resolve) => resolve(_eoc));
    this._postContQueue.clear();
    this._takeContQueue.clear();

    this._customCleanupSet.forEach((callback) => callback(this));

    this._closed = true;
  }

  addCleanup(callback) {
    this._customCleanupSet.add(callback);
  }

  deleteCleanup(callback) {
    this._customCleanupSet.delete(callback);
  }

  static async alts(...chans) {
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


  static fromPromise(promise, signal = void 0) {
    const chan = new Chan({ bufferCapacity: 0, signal });

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
