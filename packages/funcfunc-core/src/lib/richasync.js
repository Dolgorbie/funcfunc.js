import { DStackQueue } from "./queue/double-stack-queue";
import { RingQueue } from "./queue/ring-queue";
import { forEach1 } from "./sequence/array-utils";
import { gfilter } from "./sequence/iterator-utils";

export function ado(func, { retry, timeout, signal: exSignal }) {
  const run = (retryCount) => {
    const abortCtrl = new AbortController();
    const { signal: inSignal } = abortCtrl;

    return withAnySignals([exSignal, inSignal], async ({ signal }) => {
      let timeoutAbortCtrl;

      try {
        if (timeout != null) {
          (async () => {
            timeoutAbortCtrl = new AbortController();
            await sleep(timeout, { signal: timeoutAbortCtrl.signal });
            abortCtrl.abort();
          })();
        }

        return await func({ signal });
      } catch (error) {
        if (signal.aborted || retryCount === 0 || !retry?.requires?.(error)) {
          throw error;
        }
        await sleep(retry.interval ?? 4, { signal });
        return await run(retryCount - 1);
      } finally {
        if (timeoutAbortCtrl != null) {
          timeoutAbortCtrl.abort();
        }
      }
    });

  };

  return run(retry?.count ?? 0);
}

export async function withAnySignals(signals, proc) {
  const sigArray = [...gfilter((s) => s != null, signals)];
  forEach1(s => s.throwIfAborted(), sigArray);

  const abortCtrl = new AbortController();
  const { signal } = abortCtrl;

  const handleAbort = (event) => {
    abortCtrl.abort(event.target.reason);
  };

  try {
    forEach1((s) => s.addEventListener("abort", handleAbort, { once: true }), sigArray);
    return await proc({ signal });
  } finally {
    forEach1((s) => s.removeEventListener("abort", handleAbort), sigArray);
  }
}

export function sleep(delay, { signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleAbort = (event) => {
      clearTimeout(timeoutId);
      reject(event.target.reason);
    };

    const timeoutId = setTimeout(_handleSleepTimeout, delay, resolve, handleAbort);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function _handleSleepTimeout(resolve, signal, handleAbort) {
  signal?.removeEventListener("abort", handleAbort);
  resolve();
}

export function clocks(interval, { limits, signal }) {
  return new _ClocksAsyncIter(interval, limits, signal);
}

class _ClocksAsyncIter {
  _resolverQueue = new DStackQueue();
  _dateQueue = null;
  _signal = null;
  _done = false;
  _intervalId = void 0;

  constructor(interval, limits, signal) {
    this._dateQueue = limits != null && Number.isFinite(limits) ? new RingQueue(limits, true) : new DStackQueue();
    this._signal = signal;
    this._done = signal != null && signal.aborted;

    if (!this._done) {
      this._intervalId = setInterval(this._handleInterval, interval);
    }

    signal?.addEventListener("abort", this._handleAbort, { once: true });
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  next() {
    if (this._done) {
      return Promise.resolve({ value: void 0, done: true });
    }

    const { _resolverQueue, _dateQueue } = this;

    return new Promise((resolve) => {
      if (_dateQueue.size > 0) {
        resolve({ value: _dateQueue.pop(), done: false });
        return;
      }
      _resolverQueue.push(resolve);
    });
  }

  return(value) {
    this._signal?.removeEventListener("abort", this._handleAbort);
    this._handleAbort();
    return Promise.resolve({ value, done: true });
  }

  _handleInterval = () => {
    const { _resolverQueue, _dateQueue } = this;
    if (_resolverQueue.size > 0) {
      const resolve = _resolverQueue.pop();
      resolve({ value: new Date(), done: false });
      return;
    }
    _dateQueue.push(new Date());
  }

  _handleAbort = () => {
    clearInterval(this._intervalId);
    this._done = true;
    const { _resolverQueue, _dateQueue } = this;
    while (_resolverQueue.size > 0) {
      const resolve = _resolverQueue.pop();
      resolve({ value: void 0, done: true });
    }
    while (_dateQueue.size > 0) {
      _dateQueue.pop();
    }
  }
}

export function postpone(proc, { args = [], signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleAbort = (event) => {
      clearTimeout(timeoutId);
      reject(event.target.reason);
    };

    const timeoutId = setTimeout(_handlePostponeTimeout, 4, resolve, proc, args, signal, handleAbort);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function _handlePostponeTimeout(resolve, proc, args, signal, handleAbort) {
  signal?.removeEventListener("abort", handleAbort);
  resolve(proc(...args));
}
