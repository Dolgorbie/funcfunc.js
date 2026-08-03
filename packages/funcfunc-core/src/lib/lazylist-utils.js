import { toUInt } from "./asfunc";
import { car, cdr, cons, isPair, lcons, listOf, nil } from "./list";

// creation ================

export { listOf as llistOf } from "./list";

export function llrepeat(count, value) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return llrepeatInf(value);
  }
  return _llrepeatFinite(toUInt(count), value);
}

export function llrepeatInf(value) {
  return lcons(value, () => llrepeatInf(value));
}

function _llrepeatFinite(count, value) {
  if (count === 0) {
    return nil;
  }
  return lcons(value, () => _llrepeatFinite(count - 1, value));
}

export function lliota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return lliotaInf(start, step);
  }
  return _lliotaFinite(0, toUInt(count), +start, +step);
}

export function lliotaInf(start, step) {
  return _lliotaInfImpl(0, +start, +step);
}

function _lliotaInfImpl(i, start, step) {
  return lcons(i * step + start, () => _lliotaInfImpl(i + 1, start, step));
}

function _lliotaFinite(i, count, start, step) {
  if (i === count) {
    return nil;
  }
  return lcons(i * step + start, () => _lliotaFinite(i + 1, count, start, step));
}

export function iterableToLazyList(iterable) {
  const iter = iterable[Symbol.iterator]();

  function _loop() {
    const res = iter.next();
    if (res.done) {
      return nil;
    }
    return lcons(res.value, _loop);
  }

  return _loop();
}

export function llunfold(gen, seed, tailGen = void 0) {
  const res = gen(seed);
  const { value, done } = res;
  if (done) {
    return tailGen === void 0 ? nil : tailGen(seed);
  }
  return lcons(value, () => llunfold(gen, "seed" in res ? res.seed : value, tailGen));
}

// splicing ================

export function lltake(count, list) {
  if (count === 0 || !isPair(list)) {
    return nil;
  }
  return lcons(car(list), () => lltake(count - 1, cdr(list)));
}

export { ldrop as lldrop } from "./list";

// composition ================

export function llflat(listOfList) {
  if (!isPair(listOfList)) {
    return nil;
  }

  return llconcat2(car(listOfList), () => llflat(cdr(listOfList)));
}

export function llconcat(list0, ...lists) {
  switch (lists.length) {
    case 0: return list0;
    case 1: return llconcat2(list0, () => lists[0]);
    default: return llconcat2(list0, () => _llconcatN(0, lists));
  }
}

export function llconcat2(list0, thunk) {
  if (!isPair(list0)) {
    return thunk();
  }
  return lcons(car(list0), () => llconcat2(cdr(list0), thunk));
}

function _llconcatN(offset, lists) {
  if (offset === lists.length) {
    return nil;
  }
  return llconcat2(lists[offset], () => _llconcatN(offset + 1, lists));
}

export function llzip(list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return _llzip1(list0);
    }
    case 1: {
      return _llzip2(list0, lists[0]);
    }
    default: {
      return _llzipN(list0, lists);
    }
  }
}

function _llzip1(list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return lcons(listOf(car(list0)), () => _llzip1(cdr(list0)));
}

function _llzip2(list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return lcons(listOf(car(list0), car(list1)), () => _llzip2(cdr(list0), cdr(list1)));
}

function _llzipN(list0, lists) {
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

  return lcons(elem, () => {
    const next0 = cdr(list0);
    const nexts = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      nexts[i] = cdr(lists[i]);
    }
    return _llzipN(next0, nexts);
  });
}

// filtering ================

export function llfilter(pred, list) {
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      return lcons(x, () => llfilter(pred, cdr(tmp)));
    }
  }
  return nil;
}

export function lltakeWhile(pred, list) {
  if (!isPair(list)) {
    return nil;
  }
  const x = car(list);
  if (pred(x)) {
    return lcons(x, () => lltakeWhile(pred, cdr(list)));
  }
  return nil;
}

export function llunique(list) {
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
    return lcons(x, () => loop(cdr(list)));
  }

  return loop(list);
}

export {
  ldropWhile as lldropWhile,
  lfindTail as llfindTail
} from "./list";

// mapping ================

export function llmap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return llmap1(proc, list0);
    }
    case 1: {
      return llmap2(proc, list0, lists[0]);
    }
    default: {
      return _llmapN(proc, list0, lists);
    }
  }
}

export function llmap1(proc, list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return lcons(proc(car(list0)), () => llmap1(proc, cdr(list0)));
}

export function llmap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return lcons(proc(car(list0), car(list1)), () => llmap2(proc, cdr(list0), cdr(list1)));
}

function _llmapN(proc, list0, lists) {
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

  return lcons(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _llmapN(proc, rest0, rests);
  });
}

export function llflatMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return llflatMap1(proc, list0);
    }
    case 1: {
      return llflatMap2(proc, list0, lists[0]);
    }
    default: {
      return _llflatMapN(proc, list0, lists);
    }
  }
}

export function llflatMap1(proc, list0) {
  if (!isPair(list0)) {
    return nil;
  }
  return llconcat2(proc(car(list0)), () => llflatMap1(proc, cdr(list0)));
}

export function llflatMap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }
  return llconcat2(proc(car(list0), car(list1)), () => llflatMap2(proc, cdr(list0), cdr(list1)));
}

function _llflatMapN(proc, list0, lists) {
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

  return llconcat2(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _llflatMapN(proc, rest0, rests);
  });
}
