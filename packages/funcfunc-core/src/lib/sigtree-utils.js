import { ado } from "./richasync";
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

export function queryEffect(targetNode, { proc, depNodes, refreshTime, ...asyncPolicy }) {
  const eff = effect((...deps) => {
    const abortCtrl = new AbortController();
    let promise;
    let timeoutId;
    let signal;

    const refresh = async () => {
      try {
        promise = ado((opts) => {
          signal = opts.signal;
          return proc({ ...opts, args: deps });
        }, asyncPolicy);

        swap(targetNode, (prev) => ({ ...prev, status: "pending", promise }))
        const value = await promise;
        swap(targetNode, (prev) => ({ ...prev, status: "fulfilled", value, reason: void 0 }));
      } catch (reason) {
        if (signal.aborted) {
          swap(targetNode, (prev) => ({ ...prev, status: "aborted", value: void 0, reason }));
          return;
        }
        swap(targetNode, (prev) => ({ ...prev, status: "raised", value: void 0, reason }));
      } finally {
        if (refreshTime != null) {
          timeoutId = setTimeout(refresh, refreshTime);
        }
      }
    };

    const handleAbort = (event) => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
      reset(targetNode, { status: "aborted", value: void 0, reason: event.target.reason, promise });
    };

    refresh();

    return () => {
      abortCtrl.abort();
    };
  }, ...depNodes);

  return eff;
}
