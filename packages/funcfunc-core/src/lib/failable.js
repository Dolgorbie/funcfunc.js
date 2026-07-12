const _reasons = Symbol("reasons");

export function fail(...reasons) {
  return _toFailure(reasons);
}

function _toFailure(reasons) {
  return { [_reasons]: _flatErrors(reasons) }
}

export function failable(thunk) {
  try {
    return thunk();
  } catch (error) {
    return fail(error);
  }
}

export async function asyncFailable(thunk) {
  try {
    return await thunk();
  } catch (error) {
    return fail(error);
  }
}

export function isFailed(failable) {
  return failable != null && typeof failable === "object" && _reasons in failable;
}

export function isSuccess(failable) {
  return !isFailed(failable);
}

export function force(failable) {
  if (isFailed(failable)) {
    const reasons = failable[_reasons];
    throw reasons.length === 1 ? reasons[0] : new AggregateError(reasons);
  }
  return failable;
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
      return _toFailure([...failable0[_reasons], ...failable1[_reasons]]);
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
    const reasons = [...failable0[_reasons]];
    _collectReasons(reasons, failables);
    return _toFailure(reasons);
  }
  const reasons = [];
  _collectReasons(reasons, failables);
  if (reasons.length === 0) {
    return proc(failable0, ...failables);
  }
  return _toFailure(reasons);
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

function _collectReasons(acc, failables) {
  const { length } = failables;
  for (let i = 0; i < length; ++i) {
    const failableI = failables[i];
    if (isFailed(failableI)) {
      const reasonsI = failableI[_reasons];
      const nReasons = reasonsI.length;
      for (let j = 0; j < nReasons; ++j) {
        acc.push(reasonsI[j]);
      }
    }
  }
}

function _flatErrors(errors) {
  function _loop(acc, errors) {
    const { length } = errors;
    for (let i = 0; i < length; ++i) {
      const errorI = errors[i];
      if (errorI instanceof AggregateError) {
        _loop(acc, errorI.errors);
        continue;
      }
      acc.push(errorI);
    }
  }

  const acc = [];
  _loop(acc, errors);
  return acc;
}
