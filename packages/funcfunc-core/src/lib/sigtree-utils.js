import { atom, effect, reset, swap } from "./sigtree";

export function autoPromiseAtom(promise) {
  const res = atom({
    status: "pending",
    value: void 0,
    reason: void 0,
    promise,
  });

  promise
    .then((value) => {
      return swap(res, (prev) => ({ ...prev, status: "fulfilled", value }));
    })
    .catch((reason) => {
      return swap(res, (prev) => ({ ...prev, status: "rejected", reason }));
    });

  return res;
}

export function queryEffect(targetNode, { proc, depNodes, refreshTime, retry }) {
  const eff = effect((...deps) => {
    const abortCtrl = new AbortController();
    let promise;
    let timeoutId;

    const refresh = async (remainingRetry) => {
      try {
        if (abortCtrl.signal.aborted) {
          return;
        }
        promise = proc({ values: deps, signal: abortCtrl.signal });

        if (abortCtrl.signal.aborted) {
          return;
        }
        reset(targetNode, { status: "pending", value: void 0, reason: void 0, promise });

        const value = await promise
        if (abortCtrl.signal.aborted) {
          return;
        }
        reset(targetNode, { status: "fulfilled", value, reason: void 0, promise });

        if (refreshTime != null && !abortCtrl.signal.aborted) {
          timeoutId = setTimeout(refresh, refreshTime, retry);
        }
      } catch (reason) {
        if (!abortCtrl.signal.aborted) {
          reset(targetNode, { status: "rejected", value: void 0, reason, promise });
          if (remainingRetry != null && remainingRetry > 0) {
            refresh(remainingRetry - 1);
          } else if (refreshTime != null && !abortCtrl.signal.aborted) {
            timeoutId = setTimeout(refresh, refreshTime, retry);
          }
        }
      }
    };

    refresh(retry);

    return () => {
      abortCtrl.abort();
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
      reset(targetNode, { status: "aborted", value: void 0, reason: void 0, promise });
    };
  }, ...depNodes);

  return eff;
}
