import { toUInt } from "../asfunc";
import { car, cdr, cons, isPair, listOf, nil, zcons } from "./list";

// creation ================

export { listOf as zlistOf } from "./list";

export function zrepeat(count, value) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return zrepeatInf(value);
  }
  return _zrepeatFinite(toUInt(count), value);
}

export function zrepeatInf(value) {
  return zcons(value, () => zrepeatInf(value));
}

function _zrepeatFinite(count, value) {
  if (count === 0) {
    return nil;
  }
  return zcons(value, () => _zrepeatFinite(count - 1, value));
}

export function ziota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return ziotaInf(start, step);
  }
  return _ziotaFinite(0, toUInt(count), +start, +step);
}

export function ziotaInf(start, step) {
  return _ziotaInfImpl(0, +start, +step);
}

function _ziotaInfImpl(i, start, step) {
  return zcons(i * step + start, () => _ziotaInfImpl(i + 1, start, step));
}

function _ziotaFinite(i, count, start, step) {
  if (i === count) {
    return nil;
  }
  return zcons(i * step + start, () => _ziotaFinite(i + 1, count, start, step));
}

export function iterableToLazyList(iterable) {
  const iter = iterable[Symbol.iterator]();

  function _loop() {
    const res = iter.next();
    if (res.done) {
      return nil;
    }
    return zcons(res.value, _loop);
  }

  return _loop();
}

export function zunfold(gen, seed, tailGen = void 0) {
  const res = gen(seed);
  const { value, done } = res;
  if (done) {
    return tailGen === void 0 ? nil : tailGen(seed);
  }
  return zcons(value, () => zunfold(gen, "seed" in res ? res.seed : value, tailGen));
}

// splicing ================

export function ztake(count, list) {
  if (count === 0 || !isPair(list)) {
    return nil;
  }
  return zcons(car(list), () => ztake(count - 1, cdr(list)));
}

export { ldrop as zdrop } from "./list";

// composition ================

export function zflat(listOfList) {
  if (!isPair(listOfList)) {
    return nil;
  }

  return zconcat2(car(listOfList), () => zflat(cdr(listOfList)));
}

export function zconcat(list0, ...lists) {
  switch (lists.length) {
    case 0: return list0;
    case 1: return zconcat2(list0, () => lists[0]);
    default: return zconcat2(list0, () => _zconcatN(0, lists));
  }
}

export function zconcat2(list0, thunk) {
  if (!isPair(list0)) {
    return thunk();
  }
  return zcons(car(list0), () => zconcat2(cdr(list0), thunk));
}

function _zconcatN(offset, lists) {
  if (offset === lists.length) {
    return nil;
  }
  return zconcat2(lists[offset], () => _zconcatN(offset + 1, lists));
}

export function zzip(list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return _zzip1(list0);
    }
    case 1: {
      return _zzip2(list0, lists[0]);
    }
    default: {
      return _zzipN(list0, lists);
    }
  }
}

function _zzip1(list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return zcons(listOf(car(list0)), () => _zzip1(cdr(list0)));
}

function _zzip2(list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return zcons(listOf(car(list0), car(list1)), () => _zzip2(cdr(list0), cdr(list1)));
}

function _zzipN(list0, lists) {
  const nLists = lists.length;
  let elem = nil;
  for (let i = nLists - 1; i >= 0; --i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return nil;
    }
    elem = cons(car(listI), elem);
  }

  if (!isPair(list0)) {
    return nil;
  }
  elem = cons(car(list0), elem);

  return zcons(elem, () => {
    const next0 = cdr(list0);
    const nexts = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      nexts[i] = cdr(lists[i]);
    }
    return _zzipN(next0, nexts);
  });
}

// filtering ================

export function zfilter(pred, list) {
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      return zcons(x, () => zfilter(pred, cdr(tmp)));
    }
  }
  return nil;
}

export function ztakeWhile(pred, list) {
  if (!isPair(list)) {
    return nil;
  }
  const x = car(list);
  if (pred(x)) {
    return zcons(x, () => ztakeWhile(pred, cdr(list)));
  }
  return nil;
}

export function zunique(list) {
  if (!isPair(list)) {
    return nil;
  }

  const cache = new Set();

  function loop(list) {
    if (!isPair(list)) {
      return nil;
    }
    const x = car(list);
    if (cache.has(x)) {
      return loop(cdr(list));
    }
    cache.add(x);
    return zcons(x, () => loop(cdr(list)));
  }

  return loop(list);
}

export {
  ldropWhile as zdropWhile,
  lfindTail as zfindTail
} from "./list";

// mapping ================

export function zmap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return zmap1(proc, list0);
    }
    case 1: {
      return zmap2(proc, list0, lists[0]);
    }
    default: {
      return _zmapN(proc, list0, lists);
    }
  }
}

export function zmap1(proc, list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return zcons(proc(car(list0)), () => zmap1(proc, cdr(list0)));
}

export function zmap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return zcons(proc(car(list0), car(list1)), () => zmap2(proc, cdr(list0), cdr(list1)));
}

function _zmapN(proc, list0, lists) {
  if (!isPair(list0)) {
    return nil;
  }

  const value0 = car(list0);

  const nLists = lists.length;
  const values = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return nil;
    }
    values[i] = car(listI);
  }

  return zcons(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _zmapN(proc, rest0, rests);
  });
}

export function zflatMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return zflatMap1(proc, list0);
    }
    case 1: {
      return zflatMap2(proc, list0, lists[0]);
    }
    default: {
      return _zflatMapN(proc, list0, lists);
    }
  }
}

export function zflatMap1(proc, list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return zconcat2(proc(car(list0)), () => zflatMap1(proc, cdr(list0)));
}

export function zflatMap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return zconcat2(proc(car(list0), car(list1)), () => zflatMap2(proc, cdr(list0), cdr(list1)));
}

function _zflatMapN(proc, list0, lists) {
  if (!isPair(list0)) {
    return nil;
  }

  const value0 = car(list0);

  const nLists = lists.length;
  const values = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return nil;
    }
    values[i] = car(listI);
  }

  return zconcat2(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _zflatMapN(proc, rest0, rests);
  });
}
