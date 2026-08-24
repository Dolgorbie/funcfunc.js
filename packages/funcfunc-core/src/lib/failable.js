import { flatMap1, some1 } from "./sequence/array-utils";

const _reason = Symbol("reason");

export function fail(reason) {
  return { [_reason]: reason }
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

export function map(proc, failable0, ...failables) {
  switch (failables.length) {
    case 0: {
      return map1(proc, failable0);
    }
    case 1: {
      return map2(proc, failable0, failables[0]);
    }
    default: {
      return _mapN(proc, failable0, failables);
    }
  }
}

export function map1(proc, failable0) {
  return isFailed(failable0) ? failable0 : proc(failable0);
}

export function map2(proc, failable0, failable1) {
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

function _mapN(proc, failable0, failables) {
  if (isFailed(failable0)) {
    return fail([failable0[_reason], flatMap1((x) => isFailed(x) ? [x[_reason]] : [], failables)]);
  }

  if (some1(isFailed, failables)) {
    return fail(flatMap1((x) => isFailed(x) ? [x[_reason]] : [], failables));
  }

  return proc(failable0, ...failables);
}

export function tryMap(proc, failable0, ...failables) {
  switch (failables.length) {
    case 0: {
      return tryMap1(proc, failable0);
    }
    case 1: {
      return tryMap2(proc, failable0, failables[0]);
    }
    default: {
      return _tryMapN(proc, failable0, failables);
    }
  }
}

export function tryMap1(proc, failable0) {
  try {
    return map1(proc, failable0);
  } catch (error) {
    return fail(error)
  }
}

export function tryMap2(proc, failable0, failable1) {
  try {
    return map2(proc, failable0, failable1);
  } catch (error) {
    return fail(error);
  }
}

function _tryMapN(proc, failable0, failables) {
  try {
    return _mapN(proc, failable0, failables);
  } catch (error) {
    return fail(error);
  }
}

export function orValue(failable, defaultValue) {
  if (isFailed(failable)) {
    return defaultValue;
  }
  return failable;
}

export function orCalc(failable, ifFailed) {
  if (isFailed(failable)) {
    return ifFailed();
  }
  return failable;
}

export function all(failables) {
  const reasons = [];

  _collectReasons(reasons, failables);

  if (reasons.length === 0) {
    return failables;
  }

  return _toFailure(reasons);
}

export function any(failables) {
  const { length } = failables;
  const reasons = [];
  for (let i = 0; i < length; ++i) {
    const failableI = failables[i];
    if (isSuccess(failableI)) {
      return failableI;
    }

    const reasonsI = failableI[_reason];
    const nReasonsI = reasonsI.length;
    for (let j = 0; j < nReasonsI; ++j) {
      reasons.push(reasonsI[j]);
    }
  }
  return _toFailure(reasons);
}

function _collectReasons(acc, failables) {
  const { length } = failables;
  for (let i = 0; i < length; ++i) {
    const failableI = failables[i];
    if (isFailed(failableI)) {
      const reasonsI = failableI[_reason];
      const nReasons = reasonsI.length;
      for (let j = 0; j < nReasons; ++j) {
        acc.push(reasonsI[j]);
      }
    }
  }
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
