import { Queue } from "./queue";

const _resolve = Promise.resolve;

const _eoc = Symbol("end of chan");

export function isEndOfChan(value) {
  return value === _eoc;
}

export function Closable(Base = void 0) {
  return class Closable extends Base {
    constructor(options) {
      super(options);

      const { abortSignal } = options;

      this._closed = false;
      this._cleanupSet = new Set();
      this._signal = abortSignal;

      if (abortSignal != null) {
        this.close = this.close.bind(this);
        abortSignal.addEventListener("abort", this.close);
      }
    }

    get isClosed() {
      return this._closed;
    }

    close() {
      if (this._closed) {
        return;
      }

      if (this._signal != null) {
        this._signal.removeEventListener("abort", this.close);
      }

      this._cleanupSet.forEach((callback) => callback(this));
    }

    _addCleanup(callback) {
      this._cleanupSet.add(callback);
    }

    _deleteCleanup(callback) {
      this._cleanupSet.delete(callback);
    }
  }
}

export class Chan extends Closable() {
  constructor(options) {
    super(options);
    this._pushContQueue = new Queue();
    this._popContQueue = new Queue();
    this._addCleanup(this._cleanup.bind(this));
  }

  push(value) {
    if (this.isClosed) {
      throw Error("chan closed");
    }

    const { _popContQueue } = this;

    if (_popContQueue.size > 0) {
      const resolve = _popContQueue.pop();

      resolve(value);
      return _resolve(value);
    }

    return new Promise((resolve, reject) => {
      this._pushContQueue.add([value, resolve, reject]);
    });
  }

  pop() {
    if (this.isClosed) {
      return _resolve(_eoc);
    }

    const { _pushContQueue } = this;

    if (_pushContQueue.size > 0) {
      const pushCont = _pushContQueue.pop();
      const [value, resolve] = pushCont;

      resolve(value);
      return _resolve(value);
    }

    return new Promise((resolve) => {
      this._popContQueue.add(resolve);
    });
  }

  _cleanup() {
    this._pushContQueue.forEach(([, , reject]) => reject(Error("chan closed")));
    this._popContQueue.forEach((resolve) => resolve(_eoc));
    this._pushContQueue.clear();
    this._popContQueue.clear();
  }

  static async alts(...chans) {
    const { length } = chans;
    const offset = Math.random() * length | 0
    for (let i = 0; i < length; ++i) {
      const chan = chans[(i + offset) % length];

      if (chan.isClosed) {
        return _resolve({ value: _eoc, chan });
      }

      const { _pushContQueue } = chan;
      if (_pushContQueue.size > 0) {
        const pushCont = _pushContQueue.pop();

        const [value, resolve] = pushCont;
        resolve(value);
        return _resolve({ value, chan });
      }
    }

    return await new Promise((resolve) => {
      const resolves = new Array(length);
      for (let i = 0; i < length; ++i) {
        const chan = chans[i];
        resolves[i] = (value) => {
          for (let j = 0; j < length; ++j) {
            chans[j]._popContQueue.delete(resolves[j]);
          }
          resolve({ value, chan });
        };
      }

      for (let i = 0; i < length; ++i) {
        chans[i]._popContQueue.add(resolves[i]);
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
