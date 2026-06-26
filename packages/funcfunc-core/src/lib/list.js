// core ================

import { toUInt } from "./asfunc";

const _nil = {
  [Symbol.iterator]() {
    return new _ListIter(this);
  }
}

export function nil() {
  return _nil;
}

export function isNil(x) {
  return x === _nil;
}

export class Pair {
  constructor(car, cdr, lazy) {
    this._car = car;
    this._cdr = cdr;
    this._lazy = lazy;
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

    return { value: void 0, done: true };
  }

  return(value) {
    this._list = _nil;
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
  return new Pair(x, y, false);
}

export function lcons(x, thunk) {
  return new Pair(x, thunk, true);
}

export function car(pair) {
  return pair._car;
}

export function cdr(pair) {
  const { _cdr, _lazy } = pair;
  if (_lazy) {
    const v = _cdr();
    pair._cdr = v;
    pair._lazy = false;
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

export function xat(index, list) {
  return at(list, index);
}

export function length(list) {
  let count = 0;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    count += 1;
  }
  return count;
}

// creation ================

export function listOf(...values) {
  const { length } = values;
  let result = _nil;
  for (let i = length - 1; i >= 0; --i) {
    result = cons(values[i], result);
  }
  return result;
}

export function repeat(count, value) {
  const n = toUInt(count);
  let result = _nil;
  for (let i = 0; i < n; ++i) {
    result = cons(value, result);
  }
  return result;
}

export function iota(count, start = 0, step = 1) {
  const n = toUInt(count);
  const a0 = +start;
  const d = +step;

  let result = _nil;
  for (let i = n - 1; i >= 0; --i) {
    result = cons(d * i + a0, result);
  }

  return result;
}

// splicing ================

export function take(count, list) {
  const n = toUInt(count);
  let tmp = list;
  let result = _nil;
  for (let i = 0; i < n; ++i) {
    if (tmp === _nil) {
      return list;
    }
    if (!isPair(tmp)) {
      return reverseI(result);
    }
    result = cons(car(tmp), result);
    tmp = cdr(tmp);
  }
  return tmp === _nil ? list : reverseI(result);
}

export function takeI(count, list) {
  const n = toUInt(count);

  if (n === 0) {
    return _nil;
  }

  let tmp = list;
  for (let i = 0; i < n - 1; ++i) {
    if (!isPair(tmp)) {
      return list;
    }
    tmp = cdr(tmp);
  }
  if (isPair(tmp)) {
    setCdr(tmp, _nil);
  }
  return list;
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

export function takeRight(count, list) {
  return reverseI(takeI(count, reverse(list)));
}

export function takeRightI(count, list) {
  return reverseI(takeI(count, reverseI(list)));
}

export function dropRight(count, list) {
  return reverseI(drop(count, reverse(list)));
}

export function dropRightI(count, list) {
  return reverseI(drop(count, reverseI(list)));
}

// composition ================

export function flat(listOfList) {
  let result = _nil;
  for (let tmp = listOfList; isPair(tmp); tmp = cdr(tmp)) {
    result = reverse(car(tmp), result);
  }
  return reverseI(result);
}

export function flatI(listOfList) {
  let acc = _nil;
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
  const nLists = lists.length;
  if (nLists === 0) {
    return list0;
  }

  let acc = lists[nLists - 1];
  for (let i = nLists - 2; i >= 0; --i) {
    acc = reverseI(reverse(lists[i]), acc);
  }

  return reverseI(reverse(list0), acc);
}

export function concatI(list0, ...lists) {
  const nLists = lists.length;
  if (nLists === 0) {
    return list0;
  }

  let acc = list0;
  let i;
  for (i = 0; i < nLists; ++i) {
    if (isPair(acc)) {
      break;
    }
    acc = lists[i];
  }

  const result = acc;

  for (; i < nLists; ++i) {
    acc = lastPair(acc);
    setCdr(acc, lists[i]);
  }

  return result;
}

export function zip(list0, ...lists) {
  const nLists = lists.length;
  const tmps = [...lists];
  const values = new Array(nLists + 1);
  let result = _nil;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 1] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    result = cons(listOf(...values), result);
  }
  return reverseI(result);
}

export function entries(list0, ...lists) {
  const nLists = lists.length;
  const tmps = [...lists];
  const values = new Array(nLists + 2);
  let index = 0;
  let result = _nil;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = index;
    values[1] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 2] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    result = cons(listOf(...values), result);
    index += 1;
  }
  return reverseI(result);
}

// filtering ================

export function reverseFilter(pred, list) {
  let result = _nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      result = cons(x, result);
    }
  }
  return result;
}

export function filter(pred, list) {
  return reverseI(reverseFilter(pred, list));
}

export function filterI(pred, list) {
  let result;
  for (result = list; isPair(result); result = cdr(result)) {
    if (pred(car(result))) {
      break;
    }
  }

  if (!isPair(result)) {
    return _nil;
  }

  let accepted = result;
  for (let tmp = cdr(accepted); isPair(tmp); tmp = cdr(tmp)) {
    if (pred(car(tmp))) {
      setCdr(accepted, tmp);
      accepted = tmp;
    }
  }

  setCdr(accepted, _nil);
  return result;
}

export function findTail(pred, list) {
  for (let result = list; isPair(result); result = cdr(result)) {
    if (pred(car(result))) {
      return result;
    }
  }
  return _nil;
}

export function reverseTakeWhile(pred, list) {
  let result = _nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (!pred(x)) {
      break;
    }
    result = cons(x, result);
  }
  return result;
}

export function takeWhile(pred, list) {
  return reverseI(reverseTakeWhile(pred, list));
}

export function takeWhileI(pred, list) {
  if (!isPair(list) || !pred(car(list))) {
    return _nil;
  }

  let accepted = list;
  for (let tmp = cdr(list); isPair(tmp); tmp = cdr(tmp)) {
    if (!pred(car(tmp))) {
      break;
    }
    accepted = tmp;
  }
  setCdr(accepted, _nil);
  return list;
}

export function dropWhile(pred, list) {
  for (let result = list; isPair(result); result = cdr(result)) {
    if (!pred(car(result))) {
      return result;
    }
  }
  return _nil;
}

export function unique(list) {
  const cache = new Set();
  let result = _nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (cache.has(x)) {
      continue;
    }
    cache.add(x);
    result = cons(x, result);
  }
  return reverseI(result);
}

// mapping ================

export function map(proc, list0, ...lists) {
  return reverseI(reverseMap(proc, list0, ...lists));
}

export function map1(proc, list0) {
  return reverseI(reverseMap1(proc, list0));
}

export function map2(proc, list0, list1) {
  return reverseI(reverseMap2(proc, list0, list1));
}

export function reverseMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return reverseMap1(proc, list0);
    }
    case 1: {
      return reverseMap2(proc, list0, lists[0]);
    }
    default: {
      return _reverseMapN(proc, list0, lists);
    }
  }
}

export function reverseMap1(proc, list0) {
  let result = _nil;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = cons(proc(car(tmp)), result);
  }
  return result;
}

export function reverseMap2(proc, list0, list1) {
  let result = _nil;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = cons(proc(car(tmp0), car(tmp1)), result);
  }
  return result;
}

function _reverseMapN(proc, list0, lists) {
  const nLists = lists.length;

  let result = _nil;
  const tmps = [...lists];
  const values = new Array(nLists + 1);
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 1] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    result = cons(proc(...values), result);
  }
  return result;
}

export function mapI(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return map1I(proc, list0);
    }
    case 1: {
      return map2I(proc, list0, lists[0]);
    }
    default: {
      return _mapNI(proc, list0, lists);
    }
  }
}

export function map1I(proc, list0) {
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    setCar(tmp, proc(car(tmp)));
  }
  return list0;
}

export function map2I(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return _nil;
  }

  let last;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    setCar(tmp0, proc(car(tmp0), car(tmp1)));
    last = tmp0;
  }
  setCdr(last, _nil);
  return list0;
}

function _mapNI(proc, list0, lists) {
  if (!isPair(list0)) {
    return _nil;
  }

  const nLists = lists.length;

  for (let i = 0; i < nLists; ++i) {
    if (!isPair(lists[i])) {
      return _nil;
    }
  }

  let last;
  const values = new Array(nLists);

  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    const value0 = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i] = car(tmpI);
      lists[i] = cdr(tmpI);
    }
    setCar(tmp0, proc(value0, ...values));
    last = tmp0;
  }

  setCdr(last, _nil);
  return list0;
}

export function flatMap(proc, list0, ...lists) {
  return reverseI(reverseFlatMap(proc, list0, ...lists));
}

export function flatMap1(proc, list0) {
  return reverseI(reverseFlatMap1(proc, list0));
}

export function flatMap2(proc, list0, list1) {
  return reverseI(reverseFlatMap2(proc, list0, list1));
}

export function reverseFlatMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return reverseFlatMap1(proc, list0);
    }
    case 1: {
      return reverseFlatMap2(proc, list0, lists[0]);
    }
    default: {
      return _reverseFlatMapN(proc, list0, lists);
    }
  }
}

export function reverseFlatMap1(proc, list0) {
  let result = _nil;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = reverse(proc(car(tmp)), result);
  }
  return result;
}

export function reverseFlatMap2(proc, list0, list1) {
  let result = _nil;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = reverse(proc(car(tmp0), car(tmp1)), result);
  }
  return result;
}

function _reverseFlatMapN(proc, list0, lists) {
  const nLists = lists.length;

  let result = _nil;
  const tmps = [...lists];
  const values = new Array(nLists + 1);
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 1] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    result = reverse(proc(...values), result);
  }
  return result;
}

export function flatMapI(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return flatMap1I(proc, list0);
    }
    case 1: {
      return flatMap2I(proc, list0, lists[0]);
    }
    default: {
      return _flatMapNI(proc, list0, lists);
    }
  }
}

export function flatMap1I(proc, list0) {
  let result = _nil;
  let last;

  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    const res = proc(car(tmp));
    if (!isPair(result)) {
      if (isPair(res)) {
        last = result = res;
      }
      continue;
    }
    last = lastPair(last);
    setCdr(last, res);
  }
  return result;
}

export function flatMap2I(proc, list0, list1) {
  let result = _nil;
  let last;

  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    const res = proc(car(tmp0), car(tmp1));
    if (!isPair(result)) {
      if (isPair(res)) {
        last = result = res;
      }
      continue;
    }
    last = lastPair(last);
    setCdr(last, res);
  }
  return result;
}

function _flatMapNI(proc, list0, lists) {
  const nLists = lists.length;
  let result = _nil;
  let last;
  const values = new Array(nLists);

  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    const value0 = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i] = car(tmpI);
      lists[i] = cdr(tmpI);
    }

    const res = proc(value0, ...values);
    if (!isPair(result)) {
      if (isPair(res)) {
        last = result = res;
      }
      continue;
    }
    last = lastPair(last);
    setCdr(last, res);
  }
  return result;
}

// reduction ================

export function reduce(proc, init, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return reduce1(proc, init, list0);
    }
    case 1: {
      return reduce2(proc, init, list0, lists[0]);
    }
    default: {
      return _reduceN(proc, init, list0, lists);
    }
  }
}

export function reduce1(proc, init, list0) {
  let acc = init;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    acc = proc(acc, car(tmp));
  }
  return acc;
}

export function reduce2(proc, init, list0, list1) {
  let acc = init;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    acc = proc(acc, car(tmp0), car(tmp1));
  }
  return acc;
}

function _reduceN(proc, init, list0, lists) {
  const nLists = lists.length;

  let acc = init;
  const tmps = [...lists];
  const values = new Array(nLists + 1);
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 1] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    acc = proc(acc, ...values);
  }
  return acc;
}

export function reduceRight(proc, init, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return reduceRight1(proc, init, list0);
    }
    case 1: {
      return reduceRight2(proc, init, list0, lists[0]);
    }
    default: {
      return _reduceRightN(proc, init, list0, lists);
    }
  }
}

export function reduceRight1(proc, init, list0) {
  if (isPair(list0)) {
    return proc(reduceRight1(proc, init, cdr(list0)), car(list0));
  }
  return init;
}

export function reduceRight2(proc, init, list0, list1) {
  if (isPair(list0) && isPair(list1)) {
    return proc(reduceRight2(proc, init, cdr(list0), cdr(list1)), car(list0), car(list1));
  }
  return init;
}

function _reduceRightN(proc, init, list0, lists) {
  const nLists = lists.length;

  if (!isPair(list0)) {
    return init;
  }

  const values = new Array(nLists + 1);
  values[0] = car(list0);

  const rest0 = cdr(list0);
  const rests = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const tmp = lists[i];
    if (!isPair(tmp)) {
      return init;
    }
    values[i + 1] = car(tmp);
    rests[i] = cdr(tmp);
  }

  return proc(_reduceRightN(proc, init, rest0, rests), ...values);
}

export function forEach(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return forEach1(proc, list0);
    }
    case 1: {
      return forEach2(proc, list0, lists[0]);
    }
    default: {
      return _forEachN(proc, list0, lists);
    }
  }
}

export function forEach1(proc, list0) {
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    proc(car(tmp));
  }
}

export function forEach2(proc, list0, list1) {
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    proc(car(tmp0), car(tmp1));
  }
}

function _forEachN(proc, list0, lists) {
  const nLists = lists.length;

  const tmps = [...lists];
  const values = new Array(nLists + 1);

  for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = tmps[i];
      if (!isPair(tmpI)) {
        return;
      }
      values[i + 1] = car(tmpI);
      tmps[i] = cdr(tmpI);
    }
    proc(...values);
  }
}

export function every(pred, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return every1(pred, list0);
    }
    case 1: {
      return every2(pred, list0, lists[0]);
    }
    default: {
      return _everyN(pred, list0, lists);
    }
  }
}

export function every1(pred, list0) {
  let result = true;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = pred(car(tmp));
    if (!result) {
      break;
    }
  }
  return result;
}

export function every2(pred, list0, list1) {
  let result = true;

  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = pred(car(tmp0), car(tmp1));
    if (!result) {
      break;
    }
  }
  return result;
}

function _everyN(pred, list0, lists) {
  const nLists = lists.length;
  const values = new Array(nLists);

  let result = true;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    const value0 = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i] = car(tmpI);
      lists[i] = cdr(tmpI);
    }

    result = pred(value0, ...values);
    if (!result) {
      break;
    }
  }
  return result;
}

export function some(pred, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return some1(pred, list0);
    }
    case 1: {
      return some2(pred, list0, lists[0]);
    }
    default: {
      return _someN(pred, list0, lists);
    }
  }
}

export function some1(pred, list0) {
  let result = false;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = pred(car(tmp));
    if (result) {
      break;
    }
  }
  return result;
}

export function some2(pred, list0, list1) {
  let result = false;

  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = pred(car(tmp0), car(tmp1));
    if (result) {
      break;
    }
  }
  return result;
}

function _someN(pred, list0, lists) {
  const nLists = lists.length;
  const values = new Array(nLists);

  let result = false;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    const value0 = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i] = car(tmpI);
      lists[i] = cdr(tmpI);
    }

    result = pred(value0, ...values);
    if (result) {
      break;
    }
  }
  return result;
}

export function join(sep, list) {
  const acc = [];
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    acc.push(car(tmp));
  }
  return acc.join(sep);
}

// misc ================

export function reverse(list, last = _nil) {
  let acc = last;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    acc = cons(car(tmp), acc);
  }
  return acc;
}

export function reverseI(list, last = _nil) {
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
