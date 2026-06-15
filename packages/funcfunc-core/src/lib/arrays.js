// helpers ================

function lengthMin(arr0, arrs) {
  let len = arr0.length;

  const n = arrs.length;
  for (let i = 0; i < n; ++i) {
    len = Math.min(len, arrs[i].length);
  }

  return len;
}

// creation ================

export function arrayOf(...values) {
  return values;
}

export function repeat(count, value) {
  return new Array((count | 0) & ~(count >> 31)).fill(value);
}

export function iota(count, start = 0, step = 1) {
  const n = (count | 0) & ~(count >> 31);
  const a0 = +start;
  const d = +step;

  const result = new Array(n);
  for (let i = 0; i < n; ++i) {
    result[i] = d * i + a0;
  }

  return result;
}

// splicing ================

export function take(count, arr) {
  const n = (count | 0) & ~(count >> 31);
  if (n >= arr.length) {
    return arr;
  }
  return arr.slice(0, n);
}

export function drop(count, arr) {
  const n = (count | 0) & ~(count >> 31);
  if (n === 0) {
    return arr;
  }
  return arr.slice(n);
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
      const n = arraysOfArray.length;
      for (let i = 0; i < n; ++i) {
        length += arraysOfArray[i].length;
      }

      const result = new Array(length);
      let jOffset = 0;
      for (let i = 0; i < n; ++i) {
        const ai = arraysOfArray[i];
        const ni = ai.length;
        for (let j = 0; j < ni; ++j) {
          result[j + jOffset] = ai[j];
        }
        jOffset += ni;
      }
      return result;
    }
  }
}

export function concat(...arrays) {
  return flat(arrays);
}

export function zip(arr0, ...arrs) {
  const narrs = arrs.length;
  const length = lengthMin(arr0, arrs);

  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    const acc = new Array(narrs + 1);
    acc[0] = arr0[i];
    for (let j = 0; j < narrs; ++j) {
      acc[j + 1] = arrs[j][i];
    }
    result[i] = acc;
  }

  return result;
}

// filtering ================

export function filter(pred, array) {
  const result = [];
  for (const v of array) {
    if (pred(v)) {
      result.push(v);
    }
  }
  return result;
}

export function findTail(pred, array) {
  const { length } = array;
  for (let i = 0; i < length; ++i) {
    if (pred(array[i])) {
      return array.splice(i);
    }
  }
  return void 0;
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
  return array.slice(0, i);
}

// mapping ================

export function map(proc, arr0, ...arrs) {
  const narrs = arrs.length;

  switch (arrs.length) {
    case 0: {
      return map1(proc, arr0);
    }
    case 1: {
      return map2(proc, arr0, arrs[0]);
    }
    default: {
      const length = lengthMin(arr0, arrs);

      const result = new Array(length);
      const arrsi = new Array(narrs + 1);
      for (let i = 0; i < length; ++i) {
        arrsi[0] = arr0[i];
        for (let j = 0; j < narrs; ++j) {
          arrsi[j + 1] = arrs[j][i];
        }

        result[i] = proc(...arrsi);
      }
      return result;
    }
  }
}

export function map1(proc, arr0) {
  const { length } = arr0;
  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    result[i] = proc(arr0[i]);
  }
  return result;
}

export function map2(proc, arr0, arr1) {
  const length = Math.min(arr0.length, arr1.length);
  const result = new Array(length);
  for (let i = 0; i < length; ++i) {
    result[i] = proc(arr0[i], arr1[i]);
  }
  return result;
}

export function flatMap(proc, arr0, ...arrs) {
  const narrs = arrs.length;

  const length = lengthMin(arr0, arrs);
  const result = [];
  const arrsi = new Array(narrs + 1);
  for (let i = 0; i < length; ++i) {
    arrsi[0] = arr0[i];
    for (let j = 0; j < narrs; ++j) {
      arrsi[j + 1] = arrs[j][i];
    }

    const tmp = proc(...arrsi);
    const ntmp = tmp.length;
    for (let j = 0; j < ntmp; ++j) {
      result.push(tmp[j]);
    }
  }

  return result;
}
