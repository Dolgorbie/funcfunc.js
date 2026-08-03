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

export function grepeat(count, value) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return _grepeatInf(value);
  }
  return _grepeatFinite(toUInt(count), value);
}

function* _grepeatInf(value) {
  for (; ;) {
    yield value;
  }
}

function* _grepeatFinite(count, value) {
  for (let i = 0; i < count; ++i) {
    yield value;
  }
}

export function giota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return _giotaInf(+start, +step);
  }
  return _giotaFinite(toUInt(count), +start, +step);
}

function* _giotaInf(start, step) {
  for (let i = 0; ; ++i) {
    yield step * i + start;
  }
}

function* _giotaFinite(count, start, step) {
  for (let i = 0; i < count; ++i) {
    yield step * i + start;
  }
}


export function* gunfold(gen, seed, tailGen = void 0) {
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

export function* gtake(count, iter) {
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

export function* gdrop(count, iter) {
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

export function* gflat(iters) {
  for (const iter of iters) {
    yield* iter;
  }
}

export function gconcat(...iters) {
  return gflat(iters);
}

export function* gzip(iter0, ...iters) {
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

export function gentries(...iters) {
  return gzip(giota(), ...iters);
}

// filtering ================

export function* gfilter(pred, iter) {
  for (const v of iter) {
    if (pred(v)) {
      yield v;
    }
  }
}

export function* gfindTail(pred, iter) {
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

export function* gtakeWhile(pred, iter) {
  for (const v of iter) {
    if (!pred(v)) {
      break;
    }
    yield v;
  }
}

export function* gdropWhile(pred, iter) {
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

export function* gunique(iter) {
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

export function gmap(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return gmap1(proc, iter0);
    }
    case 1: {
      return gmap2(proc, iter0, iters[0]);
    }
    default: {
      return _gmapN(proc, iter0, iters);
    }
  }
}

export function* gmap1(proc, iter0) {
  for (const value0 of iter0) {
    yield proc(value0);
  }
}

export function* gmap2(proc, iter0, iter1) {
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

function* _gmapN(proc, iter0, iters) {
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

export function gflatMap(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return gflatMap1(proc, iter0);
    }
    case 1: {
      return gflatMap2(proc, iter0, iters[0]);
    }
    default: {
      return _gflatMapN(proc, iter0, iters);
    }
  }
}

export function* gflatMap1(proc, iter0) {
  for (const value0 of iter0) {
    yield* proc(value0);
  }
}

export function* gflatMap2(proc, iter0, iter1) {
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

function* _gflatMapN(proc, iter0, iters) {
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

export function greduce(proc, init, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return greduce1(proc, init, iter0);
    }
    case 1: {
      return greduce2(proc, init, iter0, iters[0]);
    }
    default: {
      return _greduceN(proc, init, iter0, iters);
    }
  }
}

export function greduce1(proc, init, iter0) {
  for (const value0 of iter0) {
    init = proc(init, value0);
  }
  return init;
}

export function greduce2(proc, init, iter0, iter1) {
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

function _greduceN(proc, init, iter0, iters) {
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

export function gforEach(proc, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      gforEach1(proc, iter0);
      break;
    }
    case 1: {
      gforEach2(proc, iter0, iters[0]);
      break;
    }
    default: {
      _gforEachN(proc, iter0, iters);
    }
  }
}

export function gforEach1(proc, iter0) {
  for (const value0 of iter0) {
    proc(value0);
  }
}

export function gforEach2(proc, iter0, iter1) {
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

function _gforEachN(proc, iter0, iters) {
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

export function gevery(pred, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return gevery1(pred, iter0);
    }
    case 1: {
      return gevery2(pred, iter0, iters[0]);
    }
    default: {
      return _geveryN(pred, iter0, iters);
    }
  }
}

export function gevery1(pred, iter0) {
  let result = true;
  for (const value0 of iter0) {
    result = pred(value0);
    if (!result) {
      break;
    }
  }
  return result;
}

export function gevery2(pred, iter0, iter1) {
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

function _geveryN(pred, iter0, iters) {
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

export function gsome(pred, iter0, ...iters) {
  switch (iters.length) {
    case 0: {
      return gsome1(pred, iter0);
    }
    case 1: {
      return gsome2(pred, iter0, iters[0]);
    }
    default: {
      return _gsomeN(pred, iter0, iters);
    }
  }
}

export function gsome1(pred, iter0) {
  let result = false;
  for (const value0 of iter0) {
    result = pred(value0);
    if (result) {
      break;
    }
  }
  return result;
}

export function gsome2(pred, iter0, iter1) {
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

function _gsomeN(pred, iter0, iters) {
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

export function gjoin(sep, iter) {
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
