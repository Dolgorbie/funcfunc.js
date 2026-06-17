// helpers ================

const _slice = Array.prototype.slice;
const _entries = Array.prototype.entries;

function _lengthMin(array0, arrays) {
  let len = array0.length;
  const n = arrays.length;

  for (let i = 0; i < n; ++i) {
    len = Math.min(len, arrays[i].length);
  }

  return len;
}

function _asUInt(value) {
  return (value | 0) & ~(value >> 31);
}

// creation ================

export function arrayOf(...values) {
  return values;
}

export function repeat(count, value) {
  return new Array(_asUInt(count)).fill(value);
}

export function iota(count, start = 0, step = 1) {
  const n = _asUInt(count);
  const a0 = +start;
  const d = +step;

  const result = new Array(n);
  for (let i = 0; i < n; ++i) {
    result[i] = d * i + a0;
  }

  return result;
}

// splicing ================

export function take(count, array) {
  const n = _asUInt(count);
  if (n >= array.length) {
    return array;
  }
  return _slice.call(array, 0, n);
}

export function drop(count, array) {
  const n = _asUInt(count);
  if (n === 0) {
    return array;
  }
  return _slice.call(array, n);
}

// composition ================

export function flat(arraysOfArray) {
  switch (arraysOfArray.length) {
    case 0: {
      return arraysOfArray;
    }
    case 1: {
      return arraysOfArray[0];
    }
    default: {
      let length = 0;
      const nOuter = arraysOfArray.length;
      for (let i = 0; i < nOuter; ++i) {
        length += arraysOfArray[i].length;
      }

      const result = new Array(length);
      let jOffset = 0;
      for (let i = 0; i < nOuter; ++i) {
        const ai = arraysOfArray[i];
        const nInner = ai.length;
        for (let j = 0; j < nInner; ++j) {
          result[j + jOffset] = ai[j];
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
  return zip(iota(_lengthMin(array0, arrays)), array0, ...arrays);
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
  return _slice.call(array, i);
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
  return _slice.call(array, 0, i);
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
  return _slice.call(array, i);
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
      const length = _lengthMin(array0, arrays);

      const result = new Array(length);
      const arrayI = new Array(nArrays + 1);
      for (let i = 0; i < length; ++i) {
        arrayI[0] = array0[i];
        for (let j = 0; j < nArrays; ++j) {
          arrayI[j + 1] = arrays[j][i];
        }

        result[i] = proc(...arrayI);
      }
      return result;
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

export function flatMap(proc, array0, ...arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  const result = [];
  const arrayI = new Array(nArrays + 1);
  for (let i = 0; i < length; ++i) {
    arrayI[0] = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      arrayI[j + 1] = arrays[j][i];
    }

    const tmp = proc(...arrayI);
    const ntmp = tmp.length;
    for (let j = 0; j < ntmp; ++j) {
      result.push(tmp[j]);
    }
  }

  return result;
}

export function reduce(proc, init, array0, ...arrays) {
  const nArrays = arrays.length;

  const length = _lengthMin(array0, arrays);
  let acc = init;
  const arrayI = new Array(nArrays + 2);
  for (let i = 0; i < length; ++i) {
    arrayI[0] = acc;
    arrayI[1] = array0[i];
    for (let j = 0; j < nArrays; ++j) {
      arrayI[j + 2] = arrays[j][i];
    }
    acc = proc(...arrayI);
  }
  return acc;
}
