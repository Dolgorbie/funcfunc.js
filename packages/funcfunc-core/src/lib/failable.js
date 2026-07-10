export function succeed(value) {
  return { success: true, value, reasons: [] };
}

export function fail(...reasons) {
  return { success: false, value: void 0, reasons: _flatErrors(reasons) };
}

export function isSuccess(failable) {
  return failable.success;
}

export function failable(thunk) {
  try {
    return succeed(thunk());
  } catch (error) {
    return fail(error);
  }
}

export async function asyncFailable(thunk) {
  try {
    return succeed(await thunk());
  } catch (error) {
    return fail(error);
  }
}

export function lift(failable) {
  if (failable.success) {
    return failable.value;
  }
  const { reasons } = failable;
  throw reasons.length === 1 ? reasons[0] : AggregateError(reasons);
}

export function map(proc, failable1, ...failables) {
  switch (failables.length) {
    case 0: {
      return map1(proc, failable1);
    }
    case 1: {
      return map2(proc, failable1, failables[0]);
    }
    default: {
      return _mapN(proc, failable1, failables);
    }
  }
}

export function map1(proc, failable1) {
  try {
    return failable1.success ? succeed(proc(failable1.value)) : failable1;
  } catch (error) {
    return fail(error)
  }
}

export function map2(proc, failable1, failable2) {
  try {
    const { success: success1 } = failable1;
    const { success: success2 } = failable2;
    if (success1) {
      if (success2) {
        return succeed(proc(failable1.value, failable2.value));
      }
      return failable2;
    }
    if (success2) {
      return success1;
    }
    throw AggregateError([...failable1.reasons, ...failable2.reasons]);
  } catch (error) {
    return fail(error);
  }
}

function _mapN(proc, failable1, failables) {
  try {
    const { length } = failables;
    const acc = [];

    let i = 0;
    if (failable1.success) {
      acc.length = length;
      for (i = 0; i < length; ++i) {
        const failableI = failables[i];
        if (!failableI.success) {
          break;
        }
        acc[i] = failableI.value;
      }

      if (i === length) {
        return succeed(proc(failable1.value, ...acc));
      }
    } else {
      acc.push(...failable1.reasons);
    }

    for (; i < length; ++i) {
      const failableI = failables[i];
      if (failableI.success) {
        continue;
      }
      const { reasons } = failableI;
      const nReasons = reasons.length;
      for (let j = 0; j < nReasons; ++j) {
        acc.push(reasons[j]);
      }
    }

    throw AggregateError(acc);
  } catch (error) {
    return fail(error);
  }
}

function _flatErrors(errors) {
  function _loop(acc, errors) {
    const { length } = errors;
    for (let i = 0; i < length; ++i) {
      const error = errors[i];
      if (error instanceof AggregateError) {
        _loop(acc, error.errors);
        return;
      }
      acc.push(errors);
    }
  }

  const acc = [];
  _loop(acc, errors);
  return acc;
}
