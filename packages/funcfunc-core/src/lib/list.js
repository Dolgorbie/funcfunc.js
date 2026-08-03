import { toUInt } from "./asfunc";

// core ================

const nil = {
  [Symbol.iterator]() {
    return new _ListIter(this);
  }
}

export function isNil(x) {
  return x === nil;
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
      const value = car(_list);
      this._list = cdr(_list);
      return { value, done: false };
    }

    return { value: void 0, done: true };
  }

  return(value) {
    this._list = nil;
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
      const value = car(_list);
      this._list = cdr(_list);
      return { value, done: false };
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
  pair._lazy = false;
  return pair._cdr = value;
}

export function lastPair(pair) {
  while (isPair(cdr(pair))) {
    pair = cdr(pair);
  }
  return pair;
}

export function iter(list) {
  return new _ListIter(list);
}

export function improperIter(improperList) {
  return new _IListIter(improperList);
}

export function at(list, index) {
  for (let i = 0; i < index; ++i) {
    if (!isPair(list)) {
      return void 0;
    }
    list = cdr(list);
  }
  return isPair(list) ? car(list) : void 0;
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

export function arrayToList(array) {
  const { length } = array;
  let result = nil;
  for (let i = length - 1; i >= 0; --i) {
    result = cons(array[i], result);
  }
  return result;
}

export function listOf(...values) {
  return arrayToList(values);
}

export function lrepeat(count, value) {
  count = toUInt(count);
  let result = nil;
  for (let i = 0; i < count; ++i) {
    result = cons(value, result);
  }
  return result;
}

export function liota(count, start = 0, step = 1) {
  count = toUInt(count);
  start = +start;
  step = +step;

  let result = nil;
  for (let i = count - 1; i >= 0; --i) {
    result = cons(step * i + start, result);
  }

  return result;
}

export function lunfold(gen, seed, tailGen = void 0) {
  let acc = nil;
  let res;
  while ((res = gen(seed)), !res.done) {
    const { value } = res;
    acc = cons(value, acc);
    seed = "seed" in res ? res.seed : value;
  }
  return lreverseI(acc, tailGen === void 0 ? nil : tailGen(seed));
}

export function lunfoldRight(gen, seed, tail = nil) {
  let res;
  while ((res = gen(seed)), !res.done) {
    const { value } = res;
    tail = cons(value, tail);
    seed = "seed" in res ? res.seed : value;
  }
  return tail;
}

// splicing ================

export function ltake(count, list) {
  count = toUInt(count);
  let tmp = list;
  let result = nil;
  for (let i = 0; i < count; ++i) {
    if (tmp === nil) {
      return list;
    }
    if (!isPair(tmp)) {
      return lreverseI(result);
    }
    result = cons(car(tmp), result);
    tmp = cdr(tmp);
  }
  return tmp === nil ? list : lreverseI(result);
}

export function ltakeI(count, list) {
  count = toUInt(count);

  if (count === 0) {
    return nil;
  }

  let tmp = list;
  for (let i = 0; i < count - 1; ++i) {
    if (!isPair(tmp)) {
      return list;
    }
    tmp = cdr(tmp);
  }
  if (isPair(tmp)) {
    setCdr(tmp, nil);
  }
  return list;
}

export function ldrop(count, list) {
  count = toUInt(count);
  for (let i = 0; i < count; ++i) {
    if (!isPair(list)) {
      return list;
    }
    list = cdr(list);
  }
  return list;
}

export function ltakeRight(count, list) {
  return lreverseI(ltakeI(count, lreverse(list)));
}

export function ltakeRightI(count, list) {
  return lreverseI(ltakeI(count, lreverseI(list)));
}

export function ldropRight(count, list) {
  return lreverseI(ldrop(count, lreverse(list)));
}

export function ldropRightI(count, list) {
  return lreverseI(ldrop(count, lreverseI(list)));
}

// composition ================

export function lflat(listOfList) {
  let result = nil;
  for (let tmp = listOfList; isPair(tmp); tmp = cdr(tmp)) {
    result = lreverse(car(tmp), result);
  }
  return lreverseI(result);
}

export function lflatI(lists) {
  let acc = nil;
  let tmp;
  for (tmp = lists; isPair(tmp); tmp = cdr(tmp)) {
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

export function lconcat(list0, ...lists) {
  const nLists = lists.length;
  if (nLists === 0) {
    return list0;
  }

  let acc = lists[nLists - 1];
  for (let i = nLists - 2; i >= 0; --i) {
    acc = lreverseI(lreverse(lists[i]), acc);
  }

  return lreverseI(lreverse(list0), acc);
}

export function lconcatI(list0, ...lists) {
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

export function lzip(list0, ...lists) {
  const nLists = lists.length;
  const values = new Array(nLists + 1);
  let result = nil;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 1] = car(tmpI);
      lists[i] = cdr(tmpI);
    }
    result = cons(listOf(...values), result);
  }
  return lreverseI(result);
}

export function lentries(list0, ...lists) {
  const nLists = lists.length;
  const values = new Array(nLists + 2);
  let index = 0;
  let result = nil;
  Outer: for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    values[0] = index;
    values[1] = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        break Outer;
      }
      values[i + 2] = car(tmpI);
      lists[i] = cdr(tmpI);
    }
    result = cons(listOf(...values), result);
    index += 1;
  }
  return lreverseI(result);
}

// filtering ================

export function lreverseFilter(pred, list) {
  let result = nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (pred(x)) {
      result = cons(x, result);
    }
  }
  return result;
}

export function lfilter(pred, list) {
  return lreverseI(lreverseFilter(pred, list));
}

export function lfilterI(pred, list) {
  let result;
  for (result = list; isPair(result); result = cdr(result)) {
    if (pred(car(result))) {
      break;
    }
  }

  if (!isPair(result)) {
    return nil;
  }

  let accepted = result;
  for (let tmp = cdr(accepted); isPair(tmp); tmp = cdr(tmp)) {
    if (pred(car(tmp))) {
      setCdr(accepted, tmp);
      accepted = tmp;
    }
  }

  setCdr(accepted, nil);
  return result;
}

export function lfindTail(pred, list) {
  for (let result = list; isPair(result); result = cdr(result)) {
    if (pred(car(result))) {
      return result;
    }
  }
  return nil;
}

export function lreverseTakeWhile(pred, list) {
  let result = nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (!pred(x)) {
      break;
    }
    result = cons(x, result);
  }
  return result;
}

export function ltakeWhile(pred, list) {
  return lreverseI(lreverseTakeWhile(pred, list));
}

export function ltakeWhileI(pred, list) {
  if (!isPair(list) || !pred(car(list))) {
    return nil;
  }

  let accepted = list;
  for (let tmp = cdr(list); isPair(tmp); tmp = cdr(tmp)) {
    if (!pred(car(tmp))) {
      break;
    }
    accepted = tmp;
  }
  setCdr(accepted, nil);
  return list;
}

export function ldropWhile(pred, list) {
  for (let result = list; isPair(result); result = cdr(result)) {
    if (!pred(car(result))) {
      return result;
    }
  }
  return nil;
}

export function lremove(target, list) {
  let head = nil;
  let tail;
  for (tail = list; isPair(tail); tail = cdr(tail)) {
    const x = car(tail);
    if (Object.is(x, target)) {
      break;
    }
    head = cons(x, head);
  }

  if (isPair(tail)) {
    return lreverseI(head, cdr(tail));
  }

  return lreverseI(head);
}

export function lremoveI(target, list) {
  if (!isPair(list)) {
    return list;
  }

  if (Object.is(car(list), target)) {
    return cdr(list);
  }

  let tmp = list;
  for (let cursor = cdr(list); isPair(cursor); cursor = cdr(cursor)) {
    const x = car(cursor);
    if (Object.is(x, target)) {
      setCdr(tmp, cdr(cursor));
      continue;
    }
    tmp = cursor;
  }
  return list;
}

export function lunique(list) {
  const appeared = new Set();
  let result = nil;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    const x = car(tmp);
    if (appeared.has(x)) {
      continue;
    }
    appeared.add(x);
    result = cons(x, result);
  }
  return lreverseI(result);
}

// mapping ================

export function lmap(proc, list0, ...lists) {
  return lreverseI(lreverseMap(proc, list0, ...lists));
}

export function lmap1(proc, list0) {
  return lreverseI(lreverseMap1(proc, list0));
}

export function lmap2(proc, list0, list1) {
  return lreverseI(lreverseMap2(proc, list0, list1));
}

export function lreverseMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lreverseMap1(proc, list0);
    }
    case 1: {
      return lreverseMap2(proc, list0, lists[0]);
    }
    default: {
      return _lreverseMapN(proc, list0, lists);
    }
  }
}

export function lreverseMap1(proc, list0) {
  let result = nil;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = cons(proc(car(tmp)), result);
  }
  return result;
}

export function lreverseMap2(proc, list0, list1) {
  let result = nil;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = cons(proc(car(tmp0), car(tmp1)), result);
  }
  return result;
}

function _lreverseMapN(proc, list0, lists) {
  const nLists = lists.length;

  let result = nil;
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
    result = cons(proc(value0, ...values), result);
  }
  return result;
}

export function lmapI(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lmap1I(proc, list0);
    }
    case 1: {
      return lmap2I(proc, list0, lists[0]);
    }
    default: {
      return _lmapNI(proc, list0, lists);
    }
  }
}

export function lmap1I(proc, list0) {
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    setCar(tmp, proc(car(tmp)));
  }
  return list0;
}

export function lmap2I(proc, list0, list1) {
  if (!isPair(list0) || !isPair(list1)) {
    return nil;
  }

  let last;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    setCar(tmp0, proc(car(tmp0), car(tmp1)));
    last = tmp0;
  }
  setCdr(last, nil);
  return list0;
}

function _lmapNI(proc, list0, lists) {
  if (!isPair(list0)) {
    return nil;
  }

  const nLists = lists.length;

  for (let i = 0; i < nLists; ++i) {
    if (!isPair(lists[i])) {
      return nil;
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

  setCdr(last, nil);
  return list0;
}

export function lflatMap(proc, list0, ...lists) {
  return lreverseI(lreverseFlatMap(proc, list0, ...lists));
}

export function lflatMap1(proc, list0) {
  return lreverseI(lreverseFlatMap1(proc, list0));
}

export function lflatMap2(proc, list0, list1) {
  return lreverseI(lreverseFlatMap2(proc, list0, list1));
}

export function lreverseFlatMap(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lreverseFlatMap1(proc, list0);
    }
    case 1: {
      return lreverseFlatMap2(proc, list0, lists[0]);
    }
    default: {
      return _lreverseFlatMapN(proc, list0, lists);
    }
  }
}

export function lreverseFlatMap1(proc, list0) {
  let result = nil;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = lreverse(proc(car(tmp)), result);
  }
  return result;
}

export function lreverseFlatMap2(proc, list0, list1) {
  let result = nil;
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = lreverse(proc(car(tmp0), car(tmp1)), result);
  }
  return result;
}

function _lreverseFlatMapN(proc, list0, lists) {
  const nLists = lists.length;

  let result = nil;
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
    result = lreverse(proc(value0, ...values), result);
  }
  return result;
}

export function lflatMapI(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lflatMap1I(proc, list0);
    }
    case 1: {
      return lflatMap2I(proc, list0, lists[0]);
    }
    default: {
      return _lflatMapNI(proc, list0, lists);
    }
  }
}

export function lflatMap1I(proc, list0) {
  let result = nil;
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

export function lflatMap2I(proc, list0, list1) {
  let result = nil;
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

function _lflatMapNI(proc, list0, lists) {
  const nLists = lists.length;
  let result = nil;
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

export function lreduce(proc, init, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lreduce1(proc, init, list0);
    }
    case 1: {
      return lreduce2(proc, init, list0, lists[0]);
    }
    default: {
      return _lreduceN(proc, init, list0, lists);
    }
  }
}

export function lreduce1(proc, init, list0) {
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    init = proc(init, car(tmp));
  }
  return init;
}

export function lreduce2(proc, init, list0, list1) {
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    init = proc(init, car(tmp0), car(tmp1));
  }
  return init;
}

function _lreduceN(proc, init, list0, lists) {
  const nLists = lists.length;

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
    init = proc(init, value0, ...values);
  }
  return init;
}

export function lreduceRight(proc, init, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lreduceRight1(proc, init, list0);
    }
    case 1: {
      return lreduceRight2(proc, init, list0, lists[0]);
    }
    default: {
      return _lreduceRightN(proc, init, list0, lists);
    }
  }
}

export function lreduceRight1(proc, init, list0) {
  if (isPair(list0)) {
    return proc(lreduceRight1(proc, init, cdr(list0)), car(list0));
  }
  return init;
}

export function lreduceRight2(proc, init, list0, list1) {
  if (isPair(list0) && isPair(list1)) {
    return proc(lreduceRight2(proc, init, cdr(list0), cdr(list1)), car(list0), car(list1));
  }
  return init;
}

function _lreduceRightN(proc, init, list0, lists) {
  const nLists = lists.length;

  if (!isPair(list0)) {
    return init;
  }

  const value0 = car(list0);
  const values = new Array(nLists);

  const rest0 = cdr(list0);
  const rests = new Array(nLists);
  for (let i = 0; i < nLists; ++i) {
    const tmpI = lists[i];
    if (!isPair(tmpI)) {
      return init;
    }
    values[i] = car(tmpI);
    rests[i] = cdr(tmpI);
  }

  return proc(_lreduceRightN(proc, init, rest0, rests), value0, ...values);
}

export function lforEach(proc, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lforEach1(proc, list0);
    }
    case 1: {
      return lforEach2(proc, list0, lists[0]);
    }
    default: {
      return _lforEachN(proc, list0, lists);
    }
  }
}

export function lforEach1(proc, list0) {
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    proc(car(tmp));
  }
}

export function lforEach2(proc, list0, list1) {
  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    proc(car(tmp0), car(tmp1));
  }
}

function _lforEachN(proc, list0, lists) {
  const nLists = lists.length;

  const values = new Array(nLists);

  for (let tmp0 = list0; isPair(tmp0); tmp0 = cdr(tmp0)) {
    const value0 = car(tmp0);
    for (let i = 0; i < nLists; ++i) {
      const tmpI = lists[i];
      if (!isPair(tmpI)) {
        return;
      }
      values[i] = car(tmpI);
      lists[i] = cdr(tmpI);
    }
    proc(value0, ...values);
  }
}

export function levery(pred, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return levery1(pred, list0);
    }
    case 1: {
      return every2(pred, list0, lists[0]);
    }
    default: {
      return _leveryN(pred, list0, lists);
    }
  }
}

export function levery1(pred, list0) {
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

function _leveryN(pred, list0, lists) {
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

export function lsome(pred, list0, ...lists) {
  switch (lists.length) {
    case 0: {
      return lsome1(pred, list0);
    }
    case 1: {
      return lsome2(pred, list0, lists[0]);
    }
    default: {
      return _lsomeN(pred, list0, lists);
    }
  }
}

export function lsome1(pred, list0) {
  let result = false;
  for (let tmp = list0; isPair(tmp); tmp = cdr(tmp)) {
    result = pred(car(tmp));
    if (result) {
      break;
    }
  }
  return result;
}

export function lsome2(pred, list0, list1) {
  let result = false;

  for (let tmp0 = list0, tmp1 = list1; isPair(tmp0) && isPair(tmp1); tmp0 = cdr(tmp0), tmp1 = cdr(tmp1)) {
    result = pred(car(tmp0), car(tmp1));
    if (result) {
      break;
    }
  }
  return result;
}

function _lsomeN(pred, list0, lists) {
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

export function ljoin(sep, list) {
  const acc = [];
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    acc.push(car(tmp));
  }
  return acc.join(sep);
}

// misc ================

export function lreverse(list, last = nil) {
  let acc = last;
  for (let tmp = list; isPair(tmp); tmp = cdr(tmp)) {
    acc = cons(car(tmp), acc);
  }
  return acc;
}

export function lreverseI(list, last = nil) {
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
