// core ================

import { toUInt } from "./asfunc";
import { force, isDlayed } from "./delay";

export class Pair {
  constructor(car, cdr) {
    this._car = car;
    this._cdr = cdr;
  }

  [Symbol.iterator]() {
    return new _ListIter(this);
  }
}

class _ListIter extends Iterator {
  constructor(list) {
    super();
    this._list = list;
  }

  next() {
    const { _list } = this;

    if (isPair(_list)) {
      this._list = cdr(_list);
      return { value: car(_list), done: false };
    }

    return { value: _list, done: true };
  }

  return(value) {
    this._list = null;
    return { value, done: true };
  }
}

class _IListIter extends Iterator {
  constructor(list) {
    super();
    this._list = list;
    this._done = false;
  }

  next() {
    const { _list } = this;

    if (isPair(_list)) {
      this._list = cdr(_list);
      return { value: car(_list), done: false };
    }

    if (this._done) {
      return { value: void 0, done: true };
    }

    this._done = true;
    this._list = void 0;
    return { value: _list, done: false };
  }

  return(value) {
    this._done = true;
    this._list = void 0;
    return { value, done: true };
  }
}

export function isPair(x) {
  return x instanceof Pair;
}

export function cons(x, y) {
  return new Pair(x, y);
}

export function car(pair) {
  return pair._car;
}

export function cdr(pair) {
  const { _cdr } = pair;
  if (isDlayed(_cdr)) {
    const v = force(_cdr);
    pair._cdr = v;
    return v;
  }
  return _cdr;
}

export function setCar(pair, value) {
  return pair._car = value;
}

export function setCdr(pair, value) {
  return pair._cdr = value;
}

export function lastPair(pair) {
  let p = pair;
  while (isPair(cdr(p))) {
    p = cdr(p);
  }
  return p;
}

export function iter(list) {
  return new _ListIter(list);
}

export function improperIter(improperList) {
  return new _IListIter(improperList);
}

export function at(list, index) {
  let acc = list;
  for (let i = 0; i < index; ++i) {
    if (!isPair(acc)) {
      return void 0;
    }
    acc = cdr(acc);
  }
  return isPair(acc) ? car(acc) : void 0;
}

// creation ================

export function listOf(...values) {
  const { length } = values;
  let result = null;
  for (let i = length - 1; i >= 0; --i) {
    result = cons(values[i], result);
  }
  return result;
}

export function repeat(count, value) {
  const n = toUInt(count);
  let result = null;
  for (let i = 0; i < n; ++i) {
    result = cons(value, result);
  }
  return result;
}

export function iota(count, start = 0, step = 1) {
  const n = toUInt(count);
  const a0 = +start;
  const d = +step;

  let result = null;
  for (let i = n - 1; i >= 0; --i) {
    result = cons(d * i + a0, result);
  }

  return result;
}

// splicing ================

export function take(count, list) {
  const n = toUInt(count);
  let tmp = list;
  let result = null;
  for (let i = 0; i < n; ++i) {
    if (tmp === null) {
      return list;
    }
    if (!isPair(tmp)) {
      return reverseI(result);
    }
    result = cons(car(tmp), result);
    tmp = cdr(tmp);
  }
  return tmp === null ? list : reverseI(result);
}

export function drop(count, list) {
  const n = toUInt(count);
  let result = list;
  for (let i = 0; i < n; ++i) {
    if (!isPair(result)) {
      return result;
    }
    result = cdr(result);
  }
  return result;
}

// composition ================

export function flat(listOfList) {
  let result = null;
  for (let tmp = listOfList; isPair(tmp); tmp = cdr(tmp)) {
    result = reverse(car(tmp), result);
  }
  return reverseI(result);
}

export function flatI(listOfList) {
  let acc = null;
  let tmp;
  for (tmp = listOfList; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (isPair(x)) {
      acc = x;
      break;
    }
  }

  if (!isPair(acc)) {
    return acc;
  }

  let result = acc;
  for (; isPair(tmp); tmp = cdr(tmp)) {
    acc = lastPair(acc);
    setCdr(acc, car(tmp));
  }

  return result;
}

export function concat(list0, ...lists) {
  const nlists = lists.length;
  if (nlists === 0) {
    return list0;
  }

  let acc = lists[nlists - 1];
  for (let i = nlists - 2; i >= 0; --i) {
    acc = reverseI(reverse(lists[i]), acc);
  }

  return reverseI(reverse(list0), acc);
}

export function concatI(list0, ...lists) {
  const nlists = lists.length;
  if (nlists === 0) {
    return list0;
  }

  let acc = list0;
  let i;
  for (i = 0; i < nlists; ++i) {
    if (isPair(acc)) {
      break;
    }
    acc = lists[i];
  }

  const result = acc;

  for (; i < nlists; ++i) {
    acc = lastPair(acc);
    setCdr(acc, lists[i]);
  }

  return result;
}

export function zip(list0, ...lists) {
  const nlists = lists.length;
  const cars = new Array(nlists + 1);
  let result = null;
  Outer: for (let l0 = list0; isPair(l0); l0 = cdr(l0)) {
    cars[0] = car(l0);
    for (let i = 0; i < nlists; ++i) {
      const li = lists[i];
      if (!isPair(li)) {
        break Outer;
      }
      cars[i + 1] = car(li);
    }
    result = cons(listOf(...cars), result);
  }
  return reverseI(result);
}

export function entries(list0, ...lists) {
  const nlists = lists.length;
  const cars = new Array(nlists + 2);
  let index = 0;
  let result = null;
  Outer: for (let l0 = list0; isPair(l0); l0 = cdr(l0)) {
    cars[0] = index;
    cars[1] = car(l0);
    for (let i = 0; i < nlists; ++i) {
      const li = lists[i];
      if (!isPair(li)) {
        break Outer;
      }
      cars[i + 1] = car(li);
    }
    result = cons(listOf(...cars), result);
    index += 1;
  }
  return reverseI(result);
}

// filtering ================

export function filter(pred, list) {
  let result = null;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      result = cons(x, result);
    }
  }
  return reverseI(result);
}


// misc ================

export function reverse(list, last = null) {
  let acc = last;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    acc = cons(car(tmp), acc);
  }
  return acc;
}

export function reverseI(list, last = null) {
  let acc = last;
  let tmp = list;

  while (isPair(tmp)) {
    const next = cdr(tmp);
    setCdr(tmp, acc);
    acc = tmp;
    tmp = next;
  }

  return acc;
}
