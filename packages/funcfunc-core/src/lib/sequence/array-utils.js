import { toUInt } from "../asfunc";

// helpers ================

function _lengthMin(array0, arrays) {
  const nArrays = arrays.length;

  let { length } = array0;
  for (let i = 0; i < nArrays; ++i) {
    length = Math.min(length, arrays[i].length);
  }

  return length;
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
  count = toUInt(count);
  if (count >= array.length) {
    return array;
  }
  return Array.prototype.slice.call(array, 0, count);
}

export function drop(count, array) {
  count = toUInt(count);
  if (count === 0) {
    return array;
  }
  return Array.prototype.slice.call(array, count);
}

export function takeRight(count, array) {
  count = toUInt(count);
  const { length } = array;
  if (count >= length) {
    return array;
  }
  return Array.prototype.slice.call(array, length - count);
}

export function dropRight(count, array) {
  count = toUInt(count);
  if (count === 0) {
    return array;
  }
  return Array.prototype.slice.call(array, 0, array.length - count);
}

// composition ================

export function flat(arrays) {
  switch (arrays.length) {
    case 0: {
      return arrays;
    }
    case 1: {
      return arrays[0];
    }
    default: {
      let length = 0;
      const nOuter = arrays.length;
      for (let i = 0; i < nOuter; ++i) {
        length += arrays[i].length;
      }

      const result = new Array(length);
      let jOffset = 0;
      for (let i = 0; i < nOuter; ++i) {
        const arrayI = arrays[i];
        const nInner = arrayI.length;
        for (let j = 0; j < nInner; ++j) {
          result[j + jOffset] = arrayI[j];
        }
        jOffset += nInner;
      }
      return result;
    }
  }
}

export function concat(...arrays) {
  return flat(arrays);
}

export function zip(array0, ...arrays) {
  const nArrays = arrays.length;
  const length = _lengthMin(array0, arrays);

  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    const acc = new Array(nArrays + 1);
    acc[0] = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      acc[j + 1] = arrays[j][i];
    }
    result[i] = acc;
  }

  return result;
}

export function entries(array0, ...arrays) {
  const nArrays = arrays.length;
  const length = _lengthMin(array0, arrays);

  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    const acc = new Array(nArrays + 2);
    acc[0] = i;
    acc[1] = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      acc[j + 2] = arrays[j][i];
    }
    result[i] = acc;
  }

  return result;
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

  if (i === 0) {
    return array;
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
  if (i === length) {
    return array;
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
  if (i === 0) {
    return array;
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
  const nArrays = arrays.length;

  switch (nArrays) {
    case 0: {
      return map1(proc, array0);
    }
    case 1: {
      return map2(proc, array0, arrays[0]);
    }
    default: {
      return _mapN(proc, array0, arrays);
    }
  }
}

export function map1(proc, array0) {
  const { length } = array0;
  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    result[i] = proc(array0[i]);
  }
  return result;
}

export function map2(proc, array0, array1) {
  const length = Math.min(array0.length, array1.length);
  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    result[i] = proc(array0[i], array1[i]);
  }
  return result;
}

function _mapN(proc, array0, arrays) {
  const nArrays = arrays.length;
  const length = _lengthMin(array0, arrays);

  const result = new Array(length);
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }

    result[i] = proc(value0, ...values);
  }
  return result;
}

export function flatMap(proc, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return flatMap1(proc, array0);
    }
    case 1: {
      return flatMap2(proc, array0, arrays[0]);
    }
    default: {
      return _flatMapN(proc, array0, arrays);
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

function _flatMapN(proc, array0, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  const result = [];
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    const tmp = proc(value0, ...values);
    const n = tmp.length;
    for (let j = 0; j < n; ++j) {
      result.push(tmp[j]);
    }
  }
  return result;
}

export function mapMulti(proc, array0, ...arrays) {
  switch (arrays.length) {
    case 0:
      return mapMulti1(proc, array0);
    case 1:
      return mapMulti2(proc, array0, arrays[1]);
    default:
      return _mapMultiN(proc, array0, arrays);
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

export function _mapMultiN(proc, array0, arrays) {
  const nArrays = arrays.length;

  const result = [];

  const add = (value) => {
    result.push(value);
  };

  const values = new Array(nArrays);

  const { length } = array0;
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    proc(add, value0, ...values);
  }
  return result;
}

// reduction ================

export function reduce(proc, init, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return reduce1(proc, init, array0);
    }
    case 1: {
      return reduce2(proc, init, array0, arrays[0]);
    }
    default: {
      return _reduceN(proc, init, array0, arrays);
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

function _reduceN(proc, init, array0, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    init = proc(init, value0, ...values);
  }
  return init;
}

export function reduceRight(proc, init, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return reduceRight1(proc, init, array0);
    }
    case 1: {
      return reduceRight2(proc, init, array0, arrays[0]);
    }
    default: {
      return _reduceRightN(proc, init, array0, arrays);
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

function _reduceRightN(proc, init, array0, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  const values = new Array(nArrays);
  for (let i = length - 1; i >= 0; --i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    init = proc(init, value0, ...values);
  }
  return init;
}

export function forEach(proc, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return forEach1(proc, array0);
    }
    case 1: {
      return forEach2(proc, array0, arrays[0]);
    }
    default: {
      return _forEachN(proc, array0, arrays);
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

function _forEachN(proc, array0, arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  const values = new Array(nArrays);
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    proc(value0, ...values);
  }
}

export function every(pred, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return every1(pred, array0);
    }
    case 1: {
      return every2(pred, array0, arrays[0]);
    }
    default: {
      return _everyN(pred, array0, arrays);
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

function _everyN(pred, array0, arrays) {
  const length = _lengthMin(array0, arrays);
  const nArrays = arrays.length;
  const values = new Array(nArrays);
  let result = true;
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    result = pred(value0, ...values);
    if (!result) {
      break;
    }
  }
  return result;
}

export function some(pred, array0, ...arrays) {
  switch (arrays.length) {
    case 0: {
      return some1(pred, array0);
    }
    case 1: {
      return some2(pred, array0, arrays[0]);
    }
    default: {
      return _someN(pred, array0, arrays);
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

function _someN(pred, array0, arrays) {
  const length = _lengthMin(array0, arrays);
  const nArrays = arrays.length;
  const values = new Array(nArrays);
  let result = false;
  for (let i = 0; i < length; ++i) {
    const value0 = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      values[j] = arrays[j][i];
    }
    result = pred(value0, ...values);
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
