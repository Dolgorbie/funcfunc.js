import { delayForce } from "../delay";
import { car, cdr, isPair } from "./list";

export function delayReduceRight(proc, delayedInit, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return delayReduceRight1(proc, delayedInit, list0);
    }
    case 1: {
      return delayReduceRight2(proc, delayedInit, list0, lists[0]);
    }
    default: {
      return _delayReduceRightN(proc, delayedInit, list0, lists);
    }
  }
}

export function delayReduceRight1(proc, delayedInit, list0) {
  return delayForce(() => {
    if (!isPair(list0)) {
      return delayedInit;
    }
    return proc(delayReduceRight1(proc, delayedInit, cdr(list0)), car(list0));
  });
}

export function delayReduceRight2(proc, delayedInit, list0, list1) {
  return delayForce(() => {
    if (!isPair(list0) || !isPair(list1)) {
      return delayedInit;
    }
    return proc(delayReduceRight2(proc, delayedInit, cdr(list0), cdr(list1)), car(list0), car(list1));
  });
}

function _delayReduceRightN(proc, delayedInit, list0, lists) {
  return delayForce(() => {
    if (!isPair(list0)) {
      return delayedInit;
    }

    const value0 = car(list0);
    const rest0 = cdr(list0);

    const nLists = lists.length;

    const values = new Array(nLists);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        return delayedInit;
      }

      values[i] = car(tmpI);
      rests[i] = cdr(tmpI);
    }

    return proc(_delayReduceRightN(proc, delayedInit, rest0, rests), value0, ...values);
  });
}
