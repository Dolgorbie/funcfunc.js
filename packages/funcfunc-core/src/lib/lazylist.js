import { toUInt } from "./asfunc";
import { constant } from "./core";
import { car, cdr, cons, isPair, lcons, listOf } from "./list";

// creation ================

export { listOf as llistOf } from "./list";

export function lrepeat(count, value) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return lrepeatInf(value);
  }
  return _lrepeatFinite(toUInt(count), value);
}

export function lrepeatInf(value) {
  return lcons(value, () => lrepeatInf(value));
}

function _lrepeatFinite(count, value) {
  if (count === 0) {
    return null;
  }
  return lcons(value, () => _lrepeatFinite(count - 1, value));
}

export function liota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return liotaInf(start, step);
  }
  return _liotaFinite(toUInt(count), +start, +step);
}

export function liotaInf(start, step) {
  const _start = +start;
  const _step = +step;

  function _loop(i) {
    return lcons(i * _step + _start, () => _loop(i + 1));
  }

  return _loop(0);
}

function _liotaFinite(count, start, step) {
  function _loop(i) {
    if (i === count) {
      return null;
    }
    return lcons(i * step + start, () => _loop(i + 1));
  }

  return _loop(0);
}

export function iterableToLazyList(iterable) {
  const iter = iterable[Symbol.iterator]();

  function _loop() {
    const res = iter.next();
    if (res.done) {
      return null;
    }
    return lcons(res.value, _loop);
  }

  return _loop();
}

// splicing ================

export function ltake(count, list) {
  if (count === 0 || !isPair(list)) {
    return null;
  }
  return lcons(car(list), () => ltake(count - 1, cdr(list)));
}

export { drop as ldrop } from "./list";

// composition ================

export function lflat(listOfList) {
  if (!isPair(listOfList)) {
    return null;
  }

  return lconcat2Lazy(car(listOfList), () => lflat(cdr(listOfList)));
}

export function lconcat(list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return list0;
    }
    case 1: {
      return lconcat2(list0, lists[0]);
    }
    default: {
      return lconcat2Lazy(list0, () => lconcat(...lists));
    }
  }
}

export function lconcat2(list0, list1) {
  return lconcat2Lazy(list0, constant(list1));
}

export function lconcat2Lazy(list0, thunk) {
  if (!isPair(list0)) {
    return thunk();
  }
  return lcons(car(list0), () => lconcat2Lazy(cdr(list0), thunk));
}

export function lzip(list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return _lzip1(list0);
    }
    case 1: {
      return _lzip2(list0, lists[0]);
    }
    default: {
      return _lzipN(list0, lists);
    }
  }
}

function _lzip1(list0) {
  if (!isPair(list0)) {
    return null;
  }
  return lcons(listOf(car(list0)), () => _lzip1(cdr(list0)));
}

function _lzip2(list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return null;
  }
  return lcons(listOf(car(list0), car(list1)), () => _lzip2(cdr(list0), cdr(list1)));
}

function _lzipN(list0, lists) {
  const nLists = lists.length;
  let elem = null;
  for (let i = nLists - 1; i >= 0; --i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return null;
    }
    elem = cons(car(listI), elem);
  }

  if (!isPair(list0)) {
    return null;
  }
  elem = cons(car(list0), elem);

  return lcons(elem, () => {
    const next0 = cdr(list0);
    const nexts = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      nexts[i] = cdr(lists[i]);
    }
    return _lzipN(next0, nexts);
  });
}

// filtering ================

export function lfilter(pred, list) {
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      return lcons(x, () => lfilter(pred, cdr(tmp)));
    }
  }
  return null;
}

export function ltakeWhile(pred, list) {
  if (!isPair(list)) {
    return null;
  }
  const x = car(list);
  if (pred(x)) {
    return lcons(x, () => ltakeWhile(pred, cdr(list)));
  }
  return null;
}

export function lunique(list) {
  if (!isPair(list)) {
    return null;
  }

  const cache = new Set();

  function loop(list) {
    if (!isPair(list)) {
      return null;
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
  dropWhile as ldropWhile,
  findTail as lfindTail
} from "./list";

// mapping ================

export function lmap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lmap1(proc, list0);
    }
    case 1: {
      return lmap2(proc, list0, lists[0]);
    }
    default: {
      return _lmapN(proc, list0, lists);
    }
  }
}

export function lmap1(proc, list0) {
  if (!isPair(list0)) {
    return null;
  }
  return lcons(proc(car(list0)), () => lmap1(proc, cdr(list0)));
}

export function lmap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return null;
  }
  return lcons(proc(car(list0), car(list1)), () => lmap2(proc, cdr(list0), cdr(list1)));
}

function _lmapN(proc, list0, lists) {
  if (!isPair(list0)) {
    return null;
  }

  const value0 = car(list0);

  const nLists = lists.length;
  const values = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return null;
    }
    values[i] = car(listI);
  }

  return lcons(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _lmapN(proc, rest0, rests);
  });
}

export function lflatMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lflatMap1(proc, list0);
    }
    case 1: {
      return lflatMap2(proc, list0, lists[0]);
    }
    default: {
      return _lflatMapN(proc, list0, lists);
    }
  }
}

export function lflatMap1(proc, list0) {
  if (!isPair(list0)) {
    return null;
  }
  return lconcat2Lazy(proc(car(list0)), () => lflatMap1(proc, cdr(list0)));
}

export function lflatMap2(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return null;
  }
  return lconcat2Lazy(proc(car(list0), car(list1)), () => lflatMap2(proc, cdr(list0), cdr(list1)));
}

function _lflatMapN(proc, list0, lists) {
  if (!isPair(list0)) {
    return null;
  }

  const value0 = car(list0);

  const nLists = lists.length;
  const values = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const listI = lists[i];
    if (!isPair(listI)) {
      return null;
    }
    values[i] = car(listI);
  }

  return lconcat2Lazy(proc(value0, ...values), () => {
    const rest0 = cdr(list0);
    const rests = new Array(nLists);
    for (let i = 0; i < nLists; ++i) {
      rests[i] = cdr(lists[i]);
    }
    return _lflatMapN(proc, rest0, rests);
  });
}
