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

export function sleep(msec, { signal }) {
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

    const timeoutId = setTimeout(_doOnPostpone, 4, resolve, proc, args, signal, handleAbort);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function _doOnPostpone(resolve, proc, args, signal, handleAbort) {
  signal?.removeEventListener("abort", handleAbort);
  resolve(proc(...args));
}
