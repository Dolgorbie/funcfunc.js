import { Queue } from "./queue";

const _resolve = Promise.resolve;

const _eoc = Symbol("end of chan");

export function isEndOfChan(value) {
  return value === _eoc;
}


export class Chan {
  constructor({ bufferCapacity, signal } = {}) {
    this._bufferCapacity = bufferCapacity === void 0 ? bufferCapacity : Math.max(0, bufferCapacity | 0);
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

  push(value) {
    if (this._closed) {
      throw Error("chan closed");
    }

    const { _popContQueue } = this;

    while (_popContQueue.size > 0) {
      const [isActive, resolve] = _popContQueue.pop();
      if (isActive()) {
        resolve(value);
        return _resolve();
      }
    }

    const { _bufferCapacity, _bufferQueue } = this;

    if (_bufferCapacity === void 0 || _bufferQueue.size < _bufferCapacity) {
      _bufferQueue.add(value);
      return _resolve();
    }

    return new Promise((resolve, reject) => {
      this._pushContQueue.add([value, resolve, reject]);
    });
  }

  pop() {
    if (this._closed) {
      return _resolve(_eoc);
    }

    const { _bufferQueue } = this;

    if (_bufferQueue.size > 0) {
      const value = _bufferQueue.pop();
      return _resolve(value);
    }

    const { _pushContQueue } = this;

    if (_pushContQueue.size > 0) {
      const [value, resolve] = _pushContQueue.pop();

      resolve();
      return _resolve(value);
    }

    return new Promise((resolve) => {
      const { _popContQueue } = this;

      while (_popContQueue.size > 0) {
        const [isActive] = _popContQueue.peek();
        if (isActive()) {
          break;
        }
        _popContQueue.pop();
      }

      _popContQueue.add([_constantTrue, resolve]);
    });
  }

  get isClosed() {
    return this._closed;
  }

  close() {
    if (this._closed) {
      return;
    }

    this._bufferQueue.clear();

    this._pushContQueue.forEach(([, , reject]) => reject(Error("chan closed")));
    this._popContQueue.forEach(([isActive, resolve]) => isActive() && resolve(_eoc));
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

      if (chan._closed) {
        return _resolve({ value: _eoc, chan });
      }

      const { _bufferQueue } = chan;

      if (_bufferQueue.size > 0) {
        const value = _bufferQueue.pop();
        return _resolve({ value, chan });
      }

      const { _pushContQueue } = chan;

      if (_pushContQueue.size > 0) {
        const [value, resolve] = _pushContQueue.pop();

        resolve();
        return _resolve({ value, chan });
      }
    }

    return await new Promise((resolve) => {
      let isResolved = false;

      function isActive() {
        return !isResolved;
      }

      function createResolve(chan) {
        return (value) => {
          if (isResolved) {
            throw Error("alts chans conflict");
          }
          isResolved = true;
          resolve({ value, chan });
        };
      }

      for (let i = 0; i < length; ++i) {
        const chan = chans[i];
        const { _popContQueue } = chan;

        while (_popContQueue.size > 0) {
          const [isActive] = _popContQueue.peek();
          if (isActive()) {
            break;
          }
          _popContQueue.pop();
        }
        chan._popContQueue.add([isActive, createResolve(chan)]);
      }
    });
  }


  static fromPromise(promise, options = {}) {
    const chan = new Chan(options);

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

function _constantTrue() {
  return true;
}

function _removeAbortEventListenter(chan) {
  chan._signal.removeEventListener("abort", chan.close);
}
