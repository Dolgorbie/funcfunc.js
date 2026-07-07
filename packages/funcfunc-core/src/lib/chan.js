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

export function tryPush(chan, value) {
  return chan.tryPush(value);
}

export function xtryPush(value, chan) {
  return chan.tryPush(value);
}

export function tryPop(chan) {
  return chan.tryPop();
}

export function push(chan, value) {
  return chan.push(value);
}

export function xpush(value, chan) {
  return chan.push(value);
}

export function pop(chan, signal = void 0) {
  return chan.pop(signal);
}

export function xpop(signal, chan) {
  return chan.pop(signal);
}

export class Chan {
  constructor({ bufferCapacity, signal } = {}) {
    this._bufferCapacity = undefMap1(pipe(toUInt, pa1(Math.max, 0)), bufferCapacity);
    this._bufferQueue = new Queue();

    this._pushContQueue = new Queue();
    this._popContQueue = new Queue();

    this._closed = false;
    this._customCleanupSet = new Set();
    this._signal = signal;

    if (signal != null) {
      this.close = this.close.bind(this);
      signal.addEventListener("abort", this.close);
      this._customCleanupSet.add(_removeAbortEventListenter);
    }
  }

  tryPush(value) {
    if (this._closed) {
      throw Error("chan closed");
    }

    const { _popContQueue } = this;
    if (_popContQueue.size > 0) {
      const resolve = _popContQueue.pop();
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

  async push(value) {
    const success = this.tryPush(value);
    if (success) {
      return;
    }

    return new Promise((resolve, reject) => {
      this._pushContQueue.add([value, resolve, reject]);
    });
  }

  tryPop() {
    const { _bufferQueue } = this;
    if (_bufferQueue.size > 0) {
      const value = _bufferQueue.pop();

      const { _pushContQueue } = this;
      if (_pushContQueue.size > 0) {
        const [value, resolve] = _pushContQueue.pop();
        _bufferQueue.add(value);
        resolve();
      }

      return { value, success: true };
    }

    if (this._closed) {
      return { value: _eoc, success: true };
    }

    const { _pushContQueue } = this;
    if (_pushContQueue.size > 0) {
      const [value, resolve] = _pushContQueue.pop();
      resolve();
      return { value, success: true };
    }

    return { value: void 0, success: false };
  }

  async pop(signal = void 0) {
    if (signal === void 0) {
      const res = this.tryPop();
      if (res.success) {
        return res.value;
      }

      return new Promise((resolve) => {
        this._popContQueue.add(resolve);
      });
    }

    if (signal.aborted) {
      throw signal.reason;
    }

    const res = this.tryPop();
    if (res.success) {
      return res.value;
    }

    return new Promise((resolve, reject) => {
      const { _popContQueue } = this;
      function _cancel() {
        _popContQueue.remove(_cleanAndResolve);
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
      _popContQueue.add(_cleanAndResolve);
    });
  }

  get isClosed() {
    return this._closed;
  }

  close() {
    if (this._closed) {
      return;
    }

    this._pushContQueue.forEach(([, , reject]) => reject(Error("chan closed")));
    this._popContQueue.forEach((resolve) => resolve(_eoc));
    this._pushContQueue.clear();
    this._popContQueue.clear();

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

      const res = chan.tryPop();
      if (res.success) {
        return { value: res.value, chan };
      }
    }

    const abortCtrl = new AbortController();
    const { signal } = abortCtrl;

    return Promise.any(map1(async (chan) => {
      const value = await chan.pop(signal);
      abortCtrl.abort(Error("selected another chan by `alts`."));
      return { value, chan };
    }, chans));
  }


  static fromPromise(promise, signal = void 0) {
    const chan = new Chan({ bufferCapacity: 0, signal });

    (async () => {
      try {
        await chan.push({ success: true, value: await promise, error: void 0 });
      } catch (error) {
        try {
          await chan.push({ success: false, value: void 0, error });
        } catch (e) {
          console.error("failed to push the error-result to chan:", chan, "which error is:", error, e);
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
