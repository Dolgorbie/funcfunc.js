import { map1 } from "./arrays";
import { toUInt } from "./asfunc";
import { car, cdr, cons, drop, isPair, lcons, listOf } from "./list";

// creation ================

export function llistOf(...values) {
  return listOf(...values);
}

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

export function ldrop(count, list) {
  return drop(count, list);
}

// composition ================

export function lflat(listOfList) {
  if (!isPair(listOfList)) {
    return null;
  }

  const xs0 = car(listOfList);
  if (!isPair(xs0)) {
    return lflat(cdr(listOfList));
  }

  return lcons(car(xs0), () => lflat(cons(cdr(xs0), cdr(listOfList))));
}

export function lconcat(list0, ...lists) {
  if (!isPair(list0)) {
    return lconcat(...lists);
  }
  return lcons(car(list0), () => lconcat(cdr(list0), ...lists));
}

export function lzip(list0, ...lists) {
  if (lists.length === 0) {
    return null;
  }
  return _lzipN(list0, lists);
}

function _lzipN(list0, lists) {
  const nlists = lists.length;
  let elem = null;
  for (let i = nlists - 1; i > 0; --i) {
    const li = lists[i];
    if (!isPair(li)) {
      return null;
    }
    elem = cons(car(li), elem);
  }

  if (!isPair(list0)) {
    return null;
  }
  elem = cons(car(list0), elem);

  return lcons(elem, () => _lzipN(cdr(list0), map1(cdr, lists)));
}

// filtering ================

export function lmap1(proc, list0) {
  if (isPair(list0)) {
    return lcons(proc(car(list0)), () => lmap1(proc, cdr(list0)));
  }
  return null;
}
