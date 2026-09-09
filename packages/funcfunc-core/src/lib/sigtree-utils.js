import { atom, swap } from "./sigtree";

export function autoPromiseAtom(aproc, ...args) {
  const promise = aproc(...args);
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
