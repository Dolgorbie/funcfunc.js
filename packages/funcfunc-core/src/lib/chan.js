const _resolve = Promise.resolve;

const _eoc = Symbol("end of chan");

export function isEndOfChan(value) {
  return value === _eoc;
}

export class Chan {
  constructor({ signal }) {
    this._closed = false;
    this._senders = new Set();
    this._receivers = new Set();

    const close = () => this.close(signal, close);
    signal.addEventListener("abort", close);
  }

  push(value) {
    if (this._closed) {
      throw Error("chann closed");
    }

    const { _receivers } = this;

    if (_receivers.size > 0) {
      const recv = _receivers.values().next().value;
      _receivers.delete(recv);

      const [resolve] = recv;
      resolve(value);
      return _resolve();
    }
    return new Promise((resolve, reject) => {
      this._senders.add([value, resolve, reject]);
    });
  }

  pop() {
    const { _senders } = this;

    if (_senders.size > 0) {
      const send = _senders.values().next().value;
      _senders.delete(send);

      const [value, resolve] = send;
      resolve();
      return _resolve(value);
    }

    return new Promise((resolve, reject) => {
      this._receivers.add([resolve, reject]);
    });
  }

  close(signal, listener) {
    this._closed = true;
    this._senders.forEach(([, , reject]) => reject(Error("chann closed")));
    this._receivers.forEach(([, reject]) => reject(Error("chann closed")));
    this._senders.clear();
    this._receivers.clear();
    this._push = _throwClosedError;
    this._pop = _throwClosedError;
    signal.removeEventListener("abort", listener);
  }

  static async alts(...channs) {
    const { length } = channs;
    const offset = Math.random() * length | 0
    for (let i = 0; i < length; ++i) {
      const c = channs[(i + offset) % length];
      if (c._senders.size > 0) {
        const send = c._senders.values().next().value;
        c._senders.delete(send);

        const [value, resolve] = send;
        resolve();
        return _resolve(value);
      }
    }

    let recv;
    try {
      return await new Promise((resolve, reject) => {
        recv = [resolve, reject];
        for (const c of channs) {
          c._receivers.add(recv);
        }
      });
    } finally {
      for (const c of channs) {
        c._receivers.delete(recv);
      }
    }
  }


  static fromPromise(promise) {
    const c = chan();
    (async () => {
      try {
        const value = await promise;
        push(c, value);
      } finally {
        close(c);
      }
    })();
    return c;
  }
}

function _throwClosedError() {
  throw Error("chann closed");
}
