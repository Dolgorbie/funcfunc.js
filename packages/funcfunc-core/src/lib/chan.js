import { Queue } from "./queue";

const _resolve = Promise.resolve;

const _eoc = Symbol("end of chan");

export function isEndOfChan(value) {
  return value === _eoc;
}

export class Chan {
  constructor({ signal }) {
    this._pushContQueue = new Queue();
    this._popContQueue = new Queue();

    this._closed = false;
    this._closeCallbackSet = new Set();

    this._signal = void 0;
    this._signalEventListener = () => this.close();

    if (signal !== void 0) {
      this._signal = signal;
      signal.addEventListener("abort", this._signalEventListener);
    }
  }

  push(value) {
    if (this._closed) {
      throw Error("chann closed");
    }

    const { _popContQueue } = this;

    if (_popContQueue.size > 0) {
      const popCont = _popContQueue.pop();
      const [resolve] = popCont;

      resolve(value);
      return _resolve(value);
    }

    return new Promise((resolve, reject) => {
      this._pushContQueue.add([value, resolve, reject]);
    });
  }

  pop() {
    if (this._closed) {
      return _resolve(_eoc);
    }

    const { _pushContQueue } = this;

    if (_pushContQueue.size > 0) {
      const pushCont = _pushContQueue.pop();
      const [value, resolve] = pushCont;

      resolve(value);
      return _resolve(value);
    }

    return new Promise((resolve, reject) => {
      this._popContQueue.add([resolve, reject]);
    });
  }

  addCloseCallback(callback) {
    this._closeCallbackSet.add(callback);
  }

  removeCloseCallback(callback) {
    this._closeCallbackSet.delete(callback);
  }

  close() {
    this._closed = true;

    this._pushContQueue.forEach(([, , reject]) => reject(Error("chann closed")));
    this._popContQueue.forEach(([resolve]) => resolve(_eoc));
    this._pushContQueue.clear();
    this._popContQueue.clear();

    if (this._signal !== void 0) {
      this._signal.removeEventListener("abort", this._signalEventListener);
    }

    this._closeCallbackSet.forEach((callback) => callback(this));
  }

  static async alts(...chans) {
    const { length } = chans;
    const offset = Math.random() * length | 0
    for (let i = 0; i < length; ++i) {
      const c = chans[(i + offset) % length];
      if (c._pushContQueue.size > 0) {
        const pushCont = c._pushContQueue.pop();

        const [value, resolve] = pushCont;
        resolve(value);
        return _resolve(value);
      }
    }

    return await new Promise((resolve, reject) => {
      function _continueResolve(value) {
        _deleteFromAllChansOf(chans, popCont);
        return resolve(value);
      }

      function _continueReject(error) {
        _deleteFromAllChansOf(chans, popCont);
        return reject(error);
      }

      const popCont = [_continueResolve, _continueReject];

      for (const c of chans) {
        c._popContQueue.add(popCont);
      }
    });
  }


  static fromPromise(promise, options = {}) {
    const chan = new Chan(options);

    (async () => {
      try {
        await chan.push({ success: true, value: await promise, error: void 0 });
      } catch (error) {
        await chan.push({ success: false, value: void 0, error });
      } finally {
        chan.close();
      }
    })();

    return chan;
  }
}

function _deleteFromAllChansOf(chans, obj) {
  for (const c of chans) {
    c._popContQueue.delete(obj);
  }
}
