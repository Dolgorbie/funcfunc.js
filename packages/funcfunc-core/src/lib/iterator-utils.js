import { toUInt } from "./asfunc";

// helpers ================

function _safeReturn(iter) {
  if (typeof iter.return === "function") {
    iter.return();
  }
}

// creation ================

export function* iterableOf(...values) {
  for (const v of values) {
    yield v;
  }
}

export function repeat(count, value) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return _repeatInf(value);
  }
  return _repeatFinite(toUInt(count), value);
}

function* _repeatInf(value) {
  for (; ;) {
    yield value;
  }
}

function* _repeatFinite(count, value) {
  for (let i = 0; i < count; ++i) {
    yield value;
  }
}

export function iota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return _iotaInf(+start, +step);
  }
  return _iotaFinite(toUInt(count), +start, +step);
}

function* _iotaInf(start, step) {
  for (let i = 0; ; ++i) {
    yield step * i + start;
  }
}

function* _iotaFinite(count, start, step) {
  for (let i = 0; i < count; ++i) {
    yield step * i + start;
  }
}


export function* unfold(gen, seed, tailGen = void 0) {
  let res;
  while ((res = gen(seed)), !res.done) {
    const { value } = res;
    yield value;
    seed = "seed" in res ? res.seed : value;
  }
  if (tailGen !== void 0) {
    yield* tailGen(seed);
  }
}

// splicing ================

export function* take(count, iter) {
  count = toUInt(count);
  iter = iter[Symbol.iterator]();

  try {
    let res;
    for (let i = 0; i < count; ++i) {
      res = iter.next()
      if (res.done) {
        return;
      }
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

export function* drop(count, iter) {
  count = toUInt(count);
  iter = iter[Symbol.iterator]();

  try {
    let res;
    for (let i = 0; i < count; ++i) {
      res = iter.next()
      if (res.done) {
        return;
      }
    }

    while ((res = iter.next()), !res.done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

// composition ================

export function* flat(iters) {
  for (const iter of iters) {
    yield* iter;
  }
}

export function concat(...iters) {
  return flat(iters);
}

export function* zip(iter0, ...iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  try {
    for (const value0 of iter0) {
      const values = new Array(nIters + 1);

      values[0] = value0;
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i + 1] = res.value;
      }

      yield values;
    }
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

export function entries(...iters) {
  return zip(iota(), ...iters);
}

// filtering ================

export function* filter(pred, iter) {
  for (const v of iter) {
    if (pred(v)) {
      yield v;
    }
  }
}

export function* findTail(pred, iter) {
  iter = iter[Symbol.iterator]();

  try {
    let res;
    while ((res = iter.next()), !res.done) {
      const { value } = res;
      if (pred(value)) {
        yield value;
        break;
      }
    }

    while ((res = iter.next()), !res.done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

export function* takeWhile(pred, iter) {
  for (const v of iter) {
    if (!pred(v)) {
      break;
    }
    yield v;
  }
}

export function* dropWhile(pred, iter) {
  iter = iter[Symbol.iterator]();

  try {
    let res;
    while ((res = iter.next()), !res.done) {
      const { value } = res;
      if (!pred(value)) {
        yield value;
        break;
      }
    }

    while ((res = iter.next()), !res.done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

export function* unique(iter) {
  const appeared = new Set();

  for (const v of iter) {
    if (appeared.has(v)) {
      continue;
    }
    appeared.add(v);
    yield v;
  }
}

// mapping ================

export function map(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return map1(proc, iter0);
    }
    case 1: {
      return map2(proc, iter0, iters[0]);
    }
    default: {
      return _mapN(proc, iter0, iters);
    }
  }
}

export function* map1(proc, iter0) {
  for (const value0 of iter0) {
    yield proc(value0);
  }
}

export function* map2(proc, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        return;
      }
      yield proc(value0, res1.value);
    }
  } finally {
    _safeReturn(iter1);
  }
}

function* _mapN(proc, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  const values = new Array(nIters);
  try {
    for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i] = res.value;
      }
      yield proc(value0, ...values);
    }
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

export function flatMap(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return flatMap1(proc, iter0);
    }
    case 1: {
      return flatMap2(proc, iter0, iters[0]);
    }
    default: {
      return _flatMapN(proc, iter0, iters);
    }
  }
}

export function* flatMap1(proc, iter0) {
  for (const value0 of iter0) {
    yield* proc(value0);
  }
}

export function* flatMap2(proc, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        return;
      }
      yield* proc(value0, res1.value);
    }
  } finally {
    _safeReturn(iter1);
  }
}

function* _flatMapN(proc, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  const values = new Array(nIters);
  try {
    for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i] = res.value;
      }
      yield* proc(value0, ...values);
    }
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

// reduction ================

export function reduce(proc, init, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return reduce1(proc, init, iter0);
    }
    case 1: {
      return reduce2(proc, init, iter0, iters[0]);
    }
    default: {
      return _reduceN(proc, init, iter0, iters);
    }
  }
}

export function reduce1(proc, init, iter0) {
  for (const value0 of iter0) {
    init = proc(init, value0);
  }
  return init;
}

export function reduce2(proc, init, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        return init;
      }
      init = proc(init, value0, res1.value);
    }
    return init;
  } finally {
    _safeReturn(iter1);
  }
}

function _reduceN(proc, init, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  const values = new Array(nIters);
  try {
    for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return init;
        }
        values[i] = res.value;
      }
      init = proc(init, value0, ...values);
    }
    return init;
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

export function forEach(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      forEach1(proc, iter0);
      break;
    }
    case 1: {
      forEach2(proc, iter0, iters[0]);
      break;
    }
    default: {
      _forEachN(proc, iter0, iters);
    }
  }
}

export function forEach1(proc, iter0) {
  for (const value0 of iter0) {
    proc(value0);
  }
}

export function forEach2(proc, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        return;
      }
      proc(value0, res1.value);
    }
  } finally {
    _safeReturn(iter1);
  }
}

function _forEachN(proc, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  const values = new Array(nIters);
  try {
    for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i] = res.value;
      }
      proc(value0, ...values);
    }
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

export function every(pred, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return every1(pred, iter0);
    }
    case 1: {
      return every2(pred, iter0, iters[0]);
    }
    default: {
      return _everyN(pred, iter0, iters);
    }
  }
}

export function every1(pred, iter0) {
  let result = true;
  for (const value0 of iter0) {
    result = pred(value0);
    if (!result) {
      break;
    }
  }
  return result;
}

export function every2(pred, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  let result = true;
  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        break;
      }
      result = pred(value0, res1.value);
      if (!result) {
        break;
      }
    }
    return result;
  } finally {
    _safeReturn(iter1);
  }
}

function _everyN(pred, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }


  let result = true;
  const values = new Array(nIters);
  try {
    Outer: for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          break Outer;
        }
        values[i] = res.value;
      }
      result = pred(value0, ...values);
      if (!result) {
        break;
      }
    }
    return result;
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

export function some(pred, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return some1(pred, iter0);
    }
    case 1: {
      return some2(pred, iter0, iters[0]);
    }
    default: {
      return _someN(pred, iter0, iters);
    }
  }
}

export function some1(pred, iter0) {
  let result = false;
  for (const value0 of iter0) {
    result = pred(value0);
    if (result) {
      break;
    }
  }
  return result;
}

export function some2(pred, iter0, iter1) {
  iter1 = iter1[Symbol.iterator]();

  let result = false;
  try {
    for (const value0 of iter0) {
      const res1 = iter1.next();
      if (res1.done) {
        break;
      }
      result = pred(value0, res1.value);
      if (result) {
        break;
      }
    }
    return result;
  } finally {
    _safeReturn(iter1);
  }
}

function _someN(pred, iter0, iters) {
  const nIters = iters.length;

  for (let i = 0; i < nIters; ++i) {
    iters[i] = iters[i][Symbol.iterator]();
  }

  let result = false;
  const values = new Array(nIters);
  try {
    Outer: for (const value0 of iter0) {
      for (let i = 0; i < nIters; ++i) {
        const res = iters[i].next();
        if (res.done) {
          break Outer;
        }
        values[i] = res.value;
      }
      result = pred(value0, ...values);
      if (result) {
        break;
      }
    }
    return result;
  } finally {
    for (const iter of iters) {
      _safeReturn(iter);
    }
  }
}

const _join_buffer_size = 10000;

export function join(sep, iter) {
  const result = [];
  const buffer = new Array(_join_buffer_size);
  let i = 0;
  for (const v of iter) {
    if (i >= _join_buffer_size) {
      result.push(buffer.join(sep));
      i = 0;
    }
    buffer[i] = v;
    i += 1;
  }
  buffer.length = i;
  result.push(buffer.join(sep));
  return result.join(sep);
}
