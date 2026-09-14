import { toUInt } from "../asfunc";

// helpers ================

function _lengthMin(arrays) {
  const { length } = arrays;

  let result = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < length; ++i) {
    result = Math.min(result, arrays[i].length);
  }

  return result;
}

// creation ================

export function arrayOf(...values) {
  return values;
}

export function repeat(count, value) {
  return new Array(toUInt(count)).fill(value);
}

export function iota(count, start = 0, step = 1) {
  count = toUInt(count);
  start = +start;
  step = +step;

  const result = new Array(count);
  for (let i = 0; i < count; ++i) {
    result[i] = step * i + start;
  }

  return result;
}

export function unfold(gen, seed, tailGen = void 0) {
  const result = [];
  let res;
  while ((res = gen(seed)), !res.done) {
    const { value } = res;
    result.push(value);
    seed = "seed" in res ? res.seed : value;
  }

  if (tailGen !== void 0) {
    const tail = tailGen(seed);
    let { length } = tail;
    for (let i = 0; i < length; ++i) {
      result.push(tail[i]);
    }
  }

  return result;
}

export function unfoldRight(gen, seed, tail = []) {
  const result = [];
  let res;
  while ((res = gen(seed)), !res.done) {
    const { value } = res;
    result.push(value);
    seed = "seed" in res ? res.seed : value;
  }

  result.reverse();

  const { length } = tail;
  for (let i = 0; i < length; ++i) {
    result.push(tail[i]);
  }

  return result;
}

// splicing ================

export function take(count, array) {
  return Array.prototype.slice.call(array, 0, toUInt(count));
}

export function drop(count, array) {
  return Array.prototype.slice.call(array, toUInt(count));
}

export function takeRight(count, array) {
  return Array.prototype.slice.call(array, toUInt(array.length - toUInt(count)));
}

export function dropRight(count, array) {
  return Array.prototype.slice.call(array, 0, toUInt(array.length - toUInt(count)));
}

// composition ================

export function flat(arrays) {
  switch (arrays.length) {
    case 0: return arrays;
    case 1: return arrays[0];
    default: return _flat(arrays);
  }
}

function _flat(arrays) {
  const length = reduce1((acc, { length }) => acc + length, 0, arrays);
  const result = new Array(length);

  let i = 0;
  const nArrays = arrays.length;
  for (let j = 0; j < nArrays; ++j) {
    const innerArray = arrays[j];
    const nInner = innerArray.length;
    for (let k = 0; k < nInner; ++k) {
      result[i++] = innerArray[k];
    }
  }

  return result;
}

export function concat(...arrays) {
  return flat(arrays);
}

export function zip(array0, ...arrays) {
  return map(arrayOf, array0, ...arrays);
}

export function entries(array0, ...arrays) {
  const count = reduce1((acc, { length }) => Math.min(acc, length), array0.length, arrays);
  return zip(iota(count), array0, ...arrays);
}

// filtering ================

export function filter(pred, array) {
  const { length } = array;
  const result = [];
  for (let i = 0; i < length; ++i) {
    const v = array[i];
    if (pred(v)) {
      result.push(v);
    }
  }
  return result;
}

export function findTail(pred, array) {
  const { length } = array;
  let i;
  for (i = 0; i < length; ++i) {
    if (pred(array[i])) {
      break;
    }
  }
  return Array.prototype.slice.call(array, i);
}

export function takeWhile(pred, array) {
  const { length } = array;
  let i;
  for (i = 0; i < length; ++i) {
    if (!pred(array[i])) {
      break;
    }
  }
  return Array.prototype.slice.call(array, 0, i);
}

export function dropWhile(pred, array) {
  const { length } = array;
  let i;
  for (i = 0; i < length; ++i) {
    if (!pred(array[i])) {
      break;
    }
  }
  return Array.prototype.slice.call(array, i);
}

export function unique(array) {
  const { length } = array;
  const resultSet = new Set();

  for (let i = 0; i < length; ++i) {
    resultSet.add(array[i]);
  }

  return [...resultSet];
}

// mapping ================

export function map(proc, array0, ...arrays) {
  switch (arrays.length) {
    case 0: return map1(proc, array0);
    case 1: return map2(proc, array0, arrays[0]);
    default: return _mapN(proc, array0, arrays);
  }
}

export function map1(proc, array0) {
  const result = new Array(array0.length);
  return map1I(result, proc, array0);
}

export function map2(proc, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  const result = new Array(length);
  return map2I(result, proc, array0, array1);
}

function _mapN(proc, array0, arrays) {
  const length = reduce1((acc, { length }) => Math.min(acc, length), array0.length, arrays);
  const result = new Array(length);
  return _mapNI(result, proc, array0, arrays);
}

export function mapI(dst, proc, array0, ...arrays) {
  switch (arrays.length) {
    case 0: return map1I(dst, proc, array0);
    case 1: return map1I(dst, proc, array0, arrays[0]);
    default: return _mapNI(dst, proc, array0, arrays);
  }
}

export function map1I(dst, proc, array0) {
  const { length } = dst;
  for (let i = 0; i < length; ++i) {
    dst[i] = proc(array0[i]);
  }
  return dst;
}

export function map2I(dst, proc, array0, array1) {
  const { length } = dst;
  for (let i = 0; i < length; ++i) {
    dst[i] = proc(array0[i], array1[i]);
  }
  return dst;
}

function _mapNI(dst, proc, array0, arrays) {
  const acc = new Array(arrays.length);
  const { length } = dst;
  for (let i = 0; i < length; ++i) {
    dst[i] = proc(array0[i], ...map1I(acc, (x) => x[i], arrays));
  }
  return dst;
}

export function flatMap(proc, ...arrays) {
  switch (arrays.length) {
    case 1: {
      return flatMap1(proc, arrays[0]);
    }
    case 2: {
      return flatMap2(proc, arrays[0], arrays[1]);
    }
    default: {
      return _flatMapN(proc, arrays);
    }
  }
}

export function flatMap1(proc, array0) {
  const result = [];
  const { length } = array0;
  for (let i = 0; i < length; ++i) {
    const tmp = proc(array0[i]);
    const n = tmp.length;
    for (let j = 0; j < n; ++j) {
      result.push(tmp[j]);
    }
  }
  return result;
}

export function flatMap2(proc, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  const result = [];
  for (let i = 0; i < length; ++i) {
    const tmp = proc(array0[i], array1[i]);
    const n = tmp.length;
    for (let j = 0; j < n; ++j) {
      result.push(tmp[j]);
    }
  }
  return result;
}

function _flatMapN(proc, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(arrays);
  const result = [];
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    const tmp = proc(...values);
    const n = tmp.length;
    for (let j = 0; j < n; ++j) {
      result.push(tmp[j]);
    }
  }
  return result;
}

export function mapMulti(proc, ...arrays) {
  switch (arrays.length) {
    case 0:
      return mapMulti1(proc, arrays[0]);
    case 1:
      return mapMulti2(proc, arrays[0], arrays[1]);
    default:
      return _mapMultiN(proc, arrays);
  }
}

export function mapMulti1(proc, array0) {
  const result = [];

  const add = (value) => {
    result.push(value);
  };

  const { length } = array0;
  for (let i = 0; i < length; ++i) {
    proc(add, array0[i]);
  }
  return result;

}

export function mapMulti2(proc, array0, array1) {
  const result = [];

  const add = (value) => {
    result.push(value);
  };

  const { length } = array0;
  for (let i = 0; i < length; ++i) {
    proc(add, array0[i], array1[i]);
  }
  return result;

}

export function _mapMultiN(proc, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(arrays);
  const result = [];
  const values = new Array(nArrays);

  const add = (value) => {
    result.push(value);
  };

  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    proc(add, ...values);
  }
  return result;
}

// reduction ================

export function reduce(proc, init, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return reduce1(proc, init, arrays[0]);
    }
    case 1: {
      return reduce2(proc, init, arrays[0], arrays[1]);
    }
    default: {
      return _reduceN(proc, init, arrays);
    }
  }
}

export function reduce1(proc, init, array0) {
  const { length } = array0;

  for (let i = 0; i < length; ++i) {
    init = proc(init, array0[i]);
  }

  return init;
}

export function reduce2(proc, init, array0, array1) {
  const length = Math.min(array0.length, array1.length);

  for (let i = 0; i < length; ++i) {
    init = proc(init, array0[i], array1[i]);
  }

  return init;
}

function _reduceN(proc, init, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(arrays);
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    init = proc(init, ...values);
  }
  return init;
}

export function reduceRight(proc, init, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return reduceRight1(proc, init, arrays[0]);
    }
    case 1: {
      return reduceRight2(proc, init, arrays[0], arrays[1]);
    }
    default: {
      return _reduceRightN(proc, init, arrays);
    }
  }
}

export function reduceRight1(proc, init, array0) {
  const { length } = array0;

  for (let i = length - 1; i >= 0; --i) {
    init = proc(init, array0[i]);
  }

  return init;
}

export function reduceRight2(proc, init, array0, array1) {
  const length = Math.min(array0.length, array1.length);

  for (let i = length - 1; i >= 0; --i) {
    init = proc(init, array0[i], array1[i]);
  }

  return init;
}

function _reduceRightN(proc, init, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(arrays);
  const values = new Array(nArrays);
  for (let i = length - 1; i >= 0; --i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    init = proc(init, ...values);
  }
  return init;
}

export function forEach(proc, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return forEach1(proc, arrays[0]);
    }
    case 1: {
      return forEach2(proc, arrays[0], arrays[1]);
    }
    default: {
      return _forEachN(proc, arrays);
    }
  }
}

export function forEach1(proc, array0) {
  const { length } = array0;
  for (let i = 0; i < length; ++i) {
    proc(array0[i]);
  }
}

export function forEach2(proc, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  for (let i = 0; i < length; ++i) {
    proc(array0[i], array1[i]);
  }
}

function _forEachN(proc, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(arrays);
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    proc(...values);
  }
}

export function every(pred, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return every1(pred, arrays[0]);
    }
    case 1: {
      return every2(pred, arrays[0], arrays[1]);
    }
    default: {
      return _everyN(pred, arrays);
    }
  }
}

export function every1(pred, array0) {
  const { length } = array0;
  let result = true;
  for (let i = 0; i < length; ++i) {
    result = pred(array0[i]);
    if (!result) {
      break;
    }
  }
  return result;
}

export function every2(pred, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  let result = true;
  for (let i = 0; i < length; ++i) {
    result = pred(array0[i], array1[i]);
    if (!result) {
      break;
    }
  }
  return result;
}

function _everyN(pred, arrays) {
  const length = _lengthMin(arrays);
  const nArrays = arrays.length;
  const values = new Array(nArrays);
  let result = true;
  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    result = pred(...values);
    if (!result) {
      break;
    }
  }
  return result;
}

export function some(pred, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return some1(pred, arrays[0]);
    }
    case 1: {
      return some2(pred, arrays[0], arrays[1]);
    }
    default: {
      return _someN(pred, arrays);
    }
  }
}

export function some1(pred, array0) {
  const { length } = array0;
  let result = false;
  for (let i = 0; i < length; ++i) {
    result = pred(array0[i]);
    if (result) {
      break;
    }
  }
  return result;
}

export function some2(pred, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  let result = false;
  for (let i = 0; i < length; ++i) {
    result = pred(array0[i], array1[i]);
    if (result) {
      break;
    }
  }
  return result;
}

function _someN(pred, arrays) {
  const length = _lengthMin(arrays);
  const nArrays = arrays.length;
  const values = new Array(nArrays);
  let result = false;
  for (let i = 0; i < length; ++i) {
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    result = pred(...values);
    if (result) {
      break;
    }
  }
  return result;
}

export function join(sep, array) {
  return Array.prototype.join.call(array, sep);
}

// misc ================

export function reverse(array) {
  const { length } = array;
  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    result[i] = array[length - i - 1];
  }
  return result;
}

export function* reverseIter(array) {
  const { length } = array;
  for (let i = length - 1; i >= 0; --i) {
    yield array[i];
  }
}
