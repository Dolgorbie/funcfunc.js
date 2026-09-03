import { asyncAttempt, fail, isSuccess } from "../failable";
import { DStackQueue } from "../queue/double-stack-queue";
import { every1, map1 } from "../sequence/array-utils";

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

export async function alts(chans) {
  const { length } = chans;

  const offset = Math.random() * length | 0
  let countEOC = 0;
  for (let i = 0; i < length; ++i) {
    const chan = chans[(i + offset) % length];

    const value = chan.tryTake();
    if (isSuccess(value)) {
      if (isEndOfChan(value)) {
        countEOC += 1;
      } else {
        return { value, chan };
      }
    }
  }

  if (countEOC === length) {
    return { value: _eoc, chan: void 0 };
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
        return { value: _eoc, chan: void 0 };
      }
    }
    throw error;
  }
}

export class Chan {
  _postContQueue = new DStackQueue();
  _takeContQueue = new DStackQueue();

  _isClosed = false;
  _closeHooks = new Set();

  _bufferQueue = null;

  constructor({ bufferQueue } = {}) {
    this._bufferQueue = bufferQueue;
  }

  tryPost(value) {
    if (this._isClosed) {
      throw new ClosedChanError(this, value, "chan was already closed.");
    }

    const { _takeContQueue } = this;
    if (_takeContQueue.size > 0) {
      const resolve = _takeContQueue.pop();
      resolve(value);
      return true;
    }

    const { _bufferQueue } = this;
    if (_bufferQueue != null) {
      return _bufferQueue.push(value);
    }
    return false;
  }

  async post(value, signal = void 0) {
    if (signal !== void 0 && signal.aborted) {
      throw signal.reason;
    }

    const success = this.tryPost(value);
    if (success) {
      return void 0;
    }

    const { _postContQueue } = this;

    if (signal === void 0) {
      return await new Promise((resolve, reject) => {
        _postContQueue.push({ _value: value, _resolve: resolve, _reject: reject });
      });
    }

    return await new Promise((resolve, reject) => {
      if (signal.aborted) {
        throw signal.reason;
      }

      const _cancel = () => {
        _postContQueue.delete(postContQueueItem);
        signal.removeEventListener("abort", _cancel);
        reject(signal.reason);
      }

      const _customResolve = () => {
        signal.removeEventListener("abort", _cancel);
        resolve();
      }

      const _customReject = (reason) => {
        signal.removeEventListener("abort", _cancel);
        reject(reason);
      }

      const postContQueueItem = { _value: value, _resolve: _customResolve, _reject: _customReject };
      signal.addEventListener("abort", _cancel, { once: true });
      _postContQueue.push(postContQueueItem);
    });
  }

  tryTake() {
    const { _bufferQueue } = this;
    if (_bufferQueue != null && _bufferQueue.size > 0) {
      const value = _bufferQueue.pop();

      const { _postContQueue } = this;
      if (_postContQueue.size > 0) {
        const { _value: nextValue, _resolve } = _postContQueue.pop();
        _bufferQueue.push(nextValue);
        _resolve();
      }

      return value;
    }

    if (this._isClosed) {
      return _eoc;
    }

    const { _postContQueue } = this;
    if (_postContQueue.size > 0) {
      const { _value, _resolve } = _postContQueue.pop();
      _resolve();
      return _value;
    }

    return fail();
  }

  async take(signal = void 0) {
    if (signal !== void 0 && signal.aborted) {
      throw signal.reason;
    }

    const value = this.tryTake();
    if (isSuccess(value)) {
      return value;
    }

    const { _takeContQueue } = this;

    if (signal === void 0) {
      return await new Promise((resolve) => {
        _takeContQueue.push(resolve);
      });
    }

    return await new Promise((resolve, reject) => {
      if (signal.aborted) {
        throw signal.reason;
      }

      const _cancel = () => {
        _takeContQueue.delete(_customResolve);
        signal.removeEventListener("abort", _cancel);
        reject(signal.reason);
      }

      const _customResolve = (value) => {
        signal.removeEventListener("abort", _cancel);
        resolve(value);
      }

      signal.addEventListener("abort", _cancel, { once: true });
      _takeContQueue.add(_customResolve);
    });
  }

  get closed() {
    return this._isClosed;
  }

  close() {
    if (this._isClosed) {
      return;
    }

    this._isClosed = true;

    const { _postContQueue, _takeContQueue } = this;

    while (_postContQueue.size > 0) {
      const { _reject } = _postContQueue.pop();
      _reject(new ClosedChanError(this, "closed"));
    }

    while (_takeContQueue.size > 0) {
      const resolve = _takeContQueue.pop();
      resolve(_eoc);
    }

    this._closeHooks.forEach((callback) => {
      try {
        callback(this)
      } catch (error) {
        console.error("exeption thrown while chan is cleaning up", error);
      }
    });
    this._closeHooks.clear();
  }

  addCloseHook(callback) {
    this._closeHooks.add(callback);
  }

  deleteCloseHook(callback) {
    this._closeHooks.delete(callback);
  }

  async *toAsyncIter() {
    for (; ;) {
      const value = await this.take();
      if (isEndOfChan(value)) {
        return;
      }
      yield value;
    }
  }

  static fromPromise(promise, onRejectChan = void 0) {
    const chan = new Chan();
    const rejected = onRejectChan ?? new Chan();

    (async () => {
      try {
        await chan.post(await asyncAttempt(promise));
      } catch (error) {
        console.error("failed to post the error-result to chan:", chan, "which error is:", error);
        rejected.tryPost(error);
      } finally {
        chan.close();
        if (onRejectChan == null) {
          rejected.close();
        }
      }
    })();

    return { chan, rejected };
  }

  static fromAsyncIter(asyncIter, onRejectChan = void 0, options = void 0) {
    const chan = new Chan(options);
    const rejected = onRejectChan ?? new Chan();

    (async () => {
      try {
        for await (const value of asyncIter) {
          await chan.post(value);
        }
      } catch (error) {
        console.error("failed to post the error-result to chan:", chan, "which error is:", error);
        rejected.tryPost(error);
      } finally {
        chan.close();
        if (onRejectChan == null) {
          rejected.close();
        }
      }
    })();

    return { chan, rejected };
  }

  static fromProducer(builder, options = {}) {
    const chan = new Chan(options);

    const _post = async (value, signal = void 0) => {
      return await chan.post(value, signal);
    };

    const _close = () => {
      chan.close();
    };

    const cleanup = builder(_post, _close);
    if (cleanup != null) {
      if (chan.closed) {
        cleanup(chan);
      } else {
        chan.addCloseHook(cleanup);
      }
    }

    return chan;
  }
}

export class ChanError extends Error {
  constructor(chan, ...args) {
    super(...args);
    this.chan = chan;
  }
}

export class ClosedChanError extends ChanError {
  constructor(...args) {
    super(...args);
  }
}
