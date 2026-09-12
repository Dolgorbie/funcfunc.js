import { ado, sleep } from "../richasync";
import { atom, effect, swap } from "./sigtree";

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

export function queryEffect(targetNode, { proc, depNodes, refresh, ...adoOpts }) {
  const eff = effect((...deps) => {
    const abortCtrl = new AbortController();

    const loop = async () => {
      try {
        const promise = ado(async (params) => proc({ ...params, args: deps }), { ...adoOpts, signal: abortCtrl.signal });
        swap(targetNode, (prev) => ({ ...prev, status: "pending", promise }));

        const value = await promise;
        if (!abortCtrl.signal.aborted) {
          swap(targetNode, (prev) => ({ ...prev, status: "fulfilled", value, reason: void 0 }));
        }

        if (refresh != null && !abortCtrl.signal.aborted) {
          await sleep(refresh.interval ?? 60000, { signal: abortCtrl.signal });
          await loop();
        }
      } catch (reason) {
        if (!abortCtrl.signal.aborted) {
          swap(targetNode, (prev) => ({ ...prev, status: "rejected", value: void 0, reason }));
        }

        if (refresh?.onError != null && !abortCtrl.signal.aborted) {
          await sleep(refresh.onError, { signal: abortCtrl.signal });
          await loop();
        }
      }
    };

    loop();

    return () => {
      abortCtrl.abort();
      swap(targetNode, (prev) => ({ ...prev, status: "rejected", value: void 0, reason: abortCtrl.signal.reason }));
    };
  }, ...depNodes);

  return eff;
}
