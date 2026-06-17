// helpers ================

import { toUInt } from "./asfunc";

function _safeReturn(iter) {
  if (typeof iter.return === "function") {
    iter.return();
  }
}

class _IterBase {
  [Symbol.iterator]() {
    return this;
  }

  return(value) {
    this.next = _IterBase._returnDone;
    return { value, done: true };
  }

  static _returnDone() {
    return { value: void 0, done: true };
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
    return new _RepeatInfIter(value);
  }
  return new _RepeatIter(count, value);
}

class _RepeatInfIter extends _IterBase {
  constructor(value) {
    super();
    this._value = value;
  }

  next() {
    return { value: this._value, done: false };
  }

  return(value) {
    this._value = void 0;
    return super.return(value);
  }
}

class _RepeatIter extends _IterBase {
  constructor(count, value) {
    super();
    this._count = toUInt(count);
    this._value = value;
    this._i = 0;
  }

  next() {
    if (this._i >= this._count) {
      return this.return();
    }
    this._i += 1;
    return { value: this._value, done: false };
  }

  return(value) {
    this._value = void 0;
    return super.return(value);
  }
}

export function iota(count, start = 0, step = 1) {
  if (count === void 0 || count === Number.POSITIVE_INFINITY) {
    return new _IotaInfIter(start, step);
  }
  return new _IotaIter(count, start, step);
}

class _IotaInfIter extends _IterBase {
  constructor(start, step) {
    super();
    this._start = +start;
    this._step = +step;
    this._i = 0;
  }

  next() {
    const value = (this._i++) * this._step + this._start;
    return { value, done: false };
  }
}

class _IotaIter extends _IterBase {
  constructor(count, start, step) {
    super();
    this._count = toUInt(count);
    this._start = +start;
    this._step = +step;
    this._i = 0;
  }

  next() {
    if (this._i >= this._count) {
      return this.return();
    }
    const value = (this._i++) * this._step + this._start;
    return { value, done: false };
  }
}

// splicing ================

export function* take(count, iterable) {
  const n = toUInt(count);
  const iter = iterable[Symbol.iterator]();

  try {
    let res;
    for (let i = 0; i < n; ++i) {
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

export function* drop(count, iterable) {
  const n = toUInt(count);
  const iter = iterable[Symbol.iterator]();

  try {
    let res;
    for (let i = 0; i < n; ++i) {
      res = iter.next()
      if (res.done) {
        return;
      }
    }

    while (!(res = iter.next()).done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

// composition ================

export function* flat(iterablesOfIterable) {
  for (const iter of iterablesOfIterable) {
    yield* iter;
  }
}

export function concat(...iterables) {
  return flat(iterables);
}

export function* zip(iterable0, ...iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  try {
    for (const v0 of iterable0) {
      const values = new Array(niter + 1);
      values[0] = v0;

      for (let i = 0; i < niter; ++i) {
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

export function entries(...iterables) {
  return zip(iota(), ...iterables);
}

// filtering ================

export function* filter(pred, iterable) {
  for (const v of iterable) {
    if (pred(v)) {
      yield v;
    }
  }
}

export function* findTail(pred, iterable) {
  const iter = iterable[Symbol.iterator]();

  try {
    let res;
    while (!(res = iter.next()).done) {
      const { value } = res;
      if (pred(value)) {
        yield value;
        break;
      }
    }

    while (!(res = iter.next()).done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

export function* takeWhile(pred, iterable) {
  for (const v of iterable) {
    if (!pred(v)) {
      break;
    }
    yield v;
  }
}

export function* dropWhile(pred, iterable) {
  const iter = iterable[Symbol.iterator]();

  try {
    let res;
    while (!(res = iter.next()).done) {
      const { value } = res;
      if (!pred(value)) {
        yield value;
        break;
      }
    }

    while (!(res = iter.next()).done) {
      yield res.value;
    }
  } finally {
    _safeReturn(iter);
  }
}

export function* unique(iterable) {
  const appeared = new Set();
  for (const v of iterable) {
    if (appeared.has(v)) {
      continue;
    }
    appeared.add(v);
    yield v;
  }
}

// mapping ================

export function map(proc, iterable0, ...iterables) {
  if (iterables.length === 0) {
    return map1(proc, iterable0);
  }
  return _mapN(proc, iterable0, iterables);
}


export function* map1(proc, iterable0) {
  for (const v0 of iterable0) {
    yield proc(v0);
  }
}

function* _mapN(proc, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);
  try {
    for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i + 1] = res.value;
      }
      yield proc(...values);
    }
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

export function flatMap(proc, iterable0, ...iterables) {
  if (iterables.length === 0) {
    return flatMap1(proc, iterable0);
  }
  return _flatMapN(proc, iterable0, iterables);
}

export function* flatMap1(proc, iterable0) {
  for (const v0 of iterable0) {
    yield* proc(v0);
  }
}

function* _flatMapN(proc, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);
  try {
    for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i + 1] = res.value;
      }
      yield* proc(...values);
    }
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

// reduction ================

export function reduce(proc, init, iterable0, ...iterables) {
  if (iterables.length === 0) {
    return reduce1(proc, init, iterable0);
  }
  return _reduceN(proc, init, iterable0, iterables);
}

export function reduce1(proc, init, iterable0) {
  let acc = init;
  for (const v0 of iterable0) {
    acc = proc(acc, v0);
  }
  return acc;
}

function _reduceN(proc, init, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);
  try {
    let acc = init;
    for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return acc;
        }
        values[i + 1] = res.value;
      }
      acc = proc(acc, ...values);
    }
    return acc;
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

export function forEach(proc, iterable0, ...iterables) {
  if (iterables.length === 0) {
    forEach1(proc, iterable0);
    return;
  }
  return _forEachN(proc, iterable0, iterables);
}


export function forEach1(proc, iterable0) {
  for (const v0 of iterable0) {
    proc(v0);
  }
}

function _forEachN(proc, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);
  try {
    for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          return;
        }
        values[i + 1] = res.value;
      }
      proc(...values);
    }
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

export function every(pred, iterable0, ...iterables) {
  if (iterables.length === 0) {
    return every1(pred, iterable0);
  }
  return _everyN(pred, iterable0, iterables);
}

export function every1(pred, iterable0) {
  let result = true;
  for (const v0 of iterable0) {
    result = pred(v0);
    if (!result) {
      break;
    }
  }
  return result;
}

function _everyN(pred, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);

  try {
    let result = true;
    LoopIter0: for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          break LoopIter0;
        }
        values[i + 1] = res.value;
      }
      result = pred(...values);
      if (!result) {
        break;
      }
    }
    return result;
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

export function some(pred, iterable0, ...iterables) {
  if (iterables.length === 0) {
    return some1(pred, iterable0);
  }
  return _someN(pred, iterable0, iterables);
}

export function some1(pred, iterable0) {
  let result = false;
  for (const v0 of iterable0) {
    result = pred(v0);
    if (result) {
      break;
    }
  }
  return result;
}

function _someN(pred, iterable0, iterables) {
  const niter = iterables.length;

  const iters = new Array(niter);
  for (let i = 0; i < niter; ++i) {
    iters[i] = iterables[i][Symbol.iterator]();
  }

  const values = new Array(niter + 1);

  try {
    let result = false;
    LoopIter0: for (const v0 of iterable0) {
      values[0] = v0;
      for (let i = 0; i < niter; ++i) {
        const res = iters[i].next();
        if (res.done) {
          break LoopIter0;
        }
        values[i + 1] = res.value;
      }
      result = pred(...values);
      if (result) {
        break;
      }
    }
    return result;
  } finally {
    for (const it of iters) {
      _safeReturn(it);
    }
  }
}

const _join_buffer_size = 10000;

export function join(sep, iterable) {
  const result = [];
  const buffer = new Array(_join_buffer_size);
  let i = 0;
  for (const v of iterable) {
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
