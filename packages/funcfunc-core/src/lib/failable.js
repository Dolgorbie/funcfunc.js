
const _reason = Symbol("reason");

export function fail(reason) {
  return { [_reason]: reason }
}

const _nothingSingleton = { [_reason]: [] };

export function nothing() {
  return _nothingSingleton;
}

export function attempt(proc, ...args) {
  switch (args.length) {
    case 0: {
      return attempt0(proc);
    }
    case 1: {
      return attempt1(proc, args[0]);
    }
    case 2: {
      return attempt2(proc, args[0], args[1]);
    }
    default: {
      return _attemptN(proc, ...args);
    }
  }
}

export function attempt0(thunk) {
  try {
    return thunk();
  } catch (error) {
    return fail(error);
  }
}

export function attempt1(proc, arg0) {
  try {
    return proc(arg0);
  } catch (error) {
    return fail(error);
  }
}

export function attempt2(proc, arg0, arg1) {
  try {
    return proc(arg0, arg1);
  } catch (error) {
    return fail(error);
  }
}

function _attemptN(proc, ...args) {
  try {
    return proc(...args);
  } catch (error) {
    return fail(error);
  }
}

export async function asyncAttempt(promise) {
  try {
    return await promise;
  } catch (error) {
    return fail(error);
  }
}

export function isFailed(failable) {
  return failable != null && typeof failable === "object" && _reason in failable;
}

export function isSuccess(failable) {
  return !isFailed(failable);
}

export function confirm(failable) {
  if (isFailed(failable)) {
    throw _buildError(failable[_reason]);
  }
  return failable;
}

export function reasonOf(failure) {
  if (isFailed(failure)) {
    return failure[_reason];
  }
  throw TypeError("expects failure");
}

export function flmap(proc, ...failables) {
  switch (failables.length) {
    case 1: {
      return flmap1(proc, failables[0]);
    }
    case 2: {
      return flmap2(proc, failables[0], failables[1]);
    }
    default: {
      return _flmapN(proc, failables);
    }
  }
}

export function flmap1(proc, failable0) {
  return isFailed(failable0) ? failable0 : proc(failable0);
}

export function flmap2(proc, failable0, failable1) {
  if (isFailed(failable0)) {
    if (isFailed(failable1)) {
      return fail([failable0[_reason], failable1[_reason]]);
    }
    return failable0;
  }

  if (isFailed(failable1)) {
    return failable1;
  }

  return proc(failable0, failable1);
}

function _flmapN(proc, failables) {
  const composed = all(failables);

  if (isFailed(composed)) {
    return composed;
  }

  return proc(...failables);
}

export function tryMap(proc, ...failables) {
  switch (failables.length) {
    case 0: {
      return tryMap1(proc, failables[0]);
    }
    case 1: {
      return tryMap2(proc, failables[0], failables[1]);
    }
    default: {
      return _tryMapN(proc, failables);
    }
  }
}

export function tryMap1(proc, failable0) {
  try {
    return flmap1(proc, failable0);
  } catch (error) {
    return fail(error)
  }
}

export function tryMap2(proc, failable0, failable1) {
  try {
    return flmap2(proc, failable0, failable1);
  } catch (error) {
    return fail(error);
  }
}

function _tryMapN(proc, failables) {
  try {
    return _flmapN(proc, failables);
  } catch (error) {
    return fail(error);
  }
}

export function orDefault(failable, defaultValue) {
  if (isFailed(failable)) {
    return defaultValue;
  }
  return failable;
}

export function orCalc(failable, generate, ...args) {
  if (isFailed(failable)) {
    return generate(...args);
  }
  return failable;
}

export function all(failables) {
  const acc = [];

  for (const x of failables) {
    if (isFailed(x)) {
      acc.push(x);
    }
  }

  const { length } = acc;
  switch (length) {
    case 0:
      return failables;
    case 1:
      return acc[0];
    default: {
      for (let i = 0; i < length; ++i) {
        acc[i] = acc[i][_reason];
      }
      return fail(acc);
    }
  }
}

export function any(failables) {
  const acc = [];

  for (const x of failables) {
    if (isFailed(x)) {
      acc.push(x);
    }
    return failables;
  }

  return fail(acc);
}

function _buildError(reason) {
  if (reason == null || typeof reason !== "object" || reason instanceof AggregateError) {
    return reason;
  }

  const acc = [];
  _buildErrorLoop(acc, reason);
  return acc.length === 1 ? acc[0] : new AggregateError(acc);
}

function _buildErrorLoop(acc, reason) {
  if (reason == null || typeof reason !== "object") {
    acc.push(reason);
    return;
  }

  const { length } = reason;
  if (typeof length === "number") {
    for (let i = 0; i < length; ++i) {
      _buildErrorLoop(acc, reason[i]);
    }
    return;
  }

  if (typeof reason[Symbol.iterator] === "function") {
    for (const r of reason) {
      _buildErrorLoop(acc, r);
    }
    return;
  }

  if (reason instanceof AggregateError) {
    _buildErrorLoop(acc, reason.errors);
    return;
  }

  acc.push(reason);
}
