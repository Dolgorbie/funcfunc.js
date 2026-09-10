import { forEach1 } from "./sequence/array-utils";
import { gfilter } from "./sequence/iterator-utils";

export function ado(func, { retry, timeout, signal: exSignal }) {
  const run = (retryCount) => {
    const abortCtrl = new AbortController();
    const { signal: inSignal } = abortCtrl;

    return _withSignals([exSignal, inSignal], async (signal) => {
      let timeoutId;

      try {
        if (timeout != null) {
          timeoutId = setTimeout(() => abortCtrl.abort(), timeout);
        }

        return await func({ signal });
      } catch (error) {
        if (signal.aborted || retryCount === 0 || !retry?.requires?.(error)) {
          throw error;
        }
        await _sleep(retry.interval ?? 4, signal);
        return await run(retryCount - 1);
      } finally {
        if (timeoutId != null) {
          clearTimeout(timeoutId);
        }
      }
    });

  };

  return run(retry?.count ?? 0);

}

async function _withSignals(signals, proc) {
  const sigArray = [...gfilter((s) => s != null, signals)];
  forEach1(s => s.throwIfAborted(), sigArray);

  const abortCtrl = new AbortController();
  const { signal } = abortCtrl;

  const handleAbort = (event) => {
    abortCtrl.abort(event.target.reason);
  };

  const cleanup = () => {
    forEach1((s) => s.removeEventListener("abort", handleAbort), sigArray);
    signal.removeEventListener("abort", cleanup);
  };

  try {
    signal.addEventListener("abort", cleanup, { once: true });
    forEach1((s) => s.addEventListener("abort", handleAbort, { once: true }), sigArray);
    return await proc(signal);
  } finally {
    cleanup();
  }
}

function _sleep(msec, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleTimeout = () => {
      if (signal != null) {
        signal.removeEventListener("abort", handleAbort);
      }
      resolve();
    };

    const handleAbort = (event) => {
      clearTimeout(timeoutId);
      reject(event.target.reason);
    };

    const timeoutId = setTimeout(handleTimeout, msec);

    if (signal != null) {
      signal.addEventListener("abort", handleAbort, { once: true });
    }
  });
}
