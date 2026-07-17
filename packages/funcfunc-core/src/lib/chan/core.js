import { every1, map1 } from "../arrays";
import { toUInt } from "../asfunc";
import { promiseFailable } from "../failable";
import { undefMap1 } from "../nullable";
import { InfQueue } from "../queue/inf-queue";

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
  if (length === 0) {
    throw Error("expects at least a chan, but got none");
  }

  const offset = Math.random() * length | 0
  let countEOC = 0;
  for (let i = 0; i < length; ++i) {
    const chan = chans[(i + offset) % length];

    const res = chan.tryTake();
    if (res.success) {
      const { value } = res;
      if (isEndOfChan(value)) {
        countEOC += 1;
      } else {
        return { value: res.value, chan };
      }
    }
  }

  if (countEOC === length) {
    return { value: _eoc, chan: chans[0] };
  }

  const abortCtrl = new AbortController();
  const { signal } = abortCtrl;

  try {
    return await Promise.any(map1(async (chan) => {
      const value = await chan.take(signal);
      if (isEndOfChan(value)) {
        throw chan;
      }
      abortCtrl.abort(Error("selected another chan by `alts`."));
      return { value, chan };
    }, chans));
  } catch (error) {
    if (error instanceof AggregateError) {
      const { errors: contents } = error;
      if (every1(isChan, contents)) {
        return { value: _eoc, chan: chans[0] };
      }
    }
    throw error;
  }
}

export class Chan {
  constructor({ capacity, signal } = {}) {
    this._bufferCapacity = undefMap1(toUInt, capacity);
    this._bufferQueue = new InfQueue();

    this._postContQueue = new InfQueue();
    this._takeContQueue = new InfQueue();

    this._isClosed = false;
    this._afterCloseHooks = new Set();
    this._signal = signal;

    if (signal != null) {
      this.close = this.close.bind(this);
      signal.addEventListener("abort", this.close, { once: true });
      this._afterCloseHooks.add(_removeAbortEventListener);
    }
  }

  tryPost(value) {
    if (this._isClosed) {
      throw new ClosedPostError(this, value, "chan was already closed.");
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
      throw new PostError(this, value, "already aborted.", { cause: signal.reason });
    }

    const success = this.tryPost(value);
    if (success) {
      return;
    }

    return new Promise((resolve, reject) => {
      const _cancel = () => {
        _postContQueue.delete(postContQueueItem);
        signal.removeEventListener("abort", _cancel);
        reject(new PostError(this, value, "aborted.", { cause: signal.reason }));
      }

      const _cleanAndResolve = () => {
        signal.removeEventListener("abort", _cancel);
        resolve();
      }

      const _cleanAndReject = (reason) => {
        signal.removeEventListener("abort", _cancel);
        reject(new PostError(this, value, "rejected.", { cause: reason }));
      }

      if (signal !== void 0 && signal.aborted) {
        reject(new PostError(this, value, "aborted.", { cause: signal.reason }));
        return;
      }

      const { _postContQueue } = this;
      let postContQueueItem;

      if (signal !== void 0) {
        postContQueueItem = [value, _cleanAndResolve, _cleanAndReject];
        signal.addEventListener("abort", _cancel, { once: true });
      } else {
        postContQueueItem = [value, resolve, reject];
      }

      _postContQueue.add(postContQueueItem);
    });
  }

  tryTake() {
    const { _bufferQueue } = this;
    if (_bufferQueue.size > 0) {
      const value = _bufferQueue.pop();

      const { _postContQueue } = this;
      if (_postContQueue.size > 0) {
        const [nextValue, resolve] = _postContQueue.pop();
        _bufferQueue.add(nextValue);
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
      throw new TakeError(this, "already aborted.", { cause: signal.reason });
    }

    const res = this.tryTake();
    if (res.success) {
      return res.value;
    }

    return new Promise((resolve, reject) => {
      const _cancel = () => {
        _takeContQueue.delete(_cleanAndResolve);
        signal.removeEventListener("abort", _cancel);
        reject(new TakeError(this, "aborted.", { cause: signal.reason }));
      }

      const _cleanAndResolve = (value) => {
        signal.removeEventListener("abort", _cancel);
        resolve(value);
      }

      if (signal !== void 0 && signal.aborted) {
        reject(new TakeError(this, "aborted.", { cause: signal.reason }));
        return;
      }

      const { _takeContQueue } = this;

      if (signal !== void 0) {
        signal.addEventListener("abort", _cancel, { once: true });
        _takeContQueue.add(_cleanAndResolve);
        return;
      }

      _takeContQueue.add(resolve);
    });
  }

  get closed() {
    return this._isClosed;
  }

  close() {
    if (this._isClosed) {
      return;
    }

    this._postContQueue.forEach(([value, , reject]) => reject(new ClosedPostError(this, value, "closed")));
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
        await chan.post(await promiseFailable(promise));
      } catch (error) {
        console.error("failed to post the error-result to chan:", chan, "which error is:", error);
      } finally {
        chan.close();
      }
    })();

    return chan;
  }
}

export class ChanError extends Error {
  constructor(chan, ...args) {
    super(...args);
    this.chan = chan;
  }
}

export class PostError extends ChanError {
  constructor(chan, value, ...args) {
    super(chan, ...args);
    this.value = value;
  }
}

export class ClosedPostError extends PostError {
  constructor(...args) {
    super(...args);
  }
}

export class TakeError extends ChanError {
  constructor(chan, ...args) {
    super(chan, ...args);
  }
}

function _removeAbortEventListener(chan) {
  chan._signal.removeEventListener("abort", chan.close);
}
