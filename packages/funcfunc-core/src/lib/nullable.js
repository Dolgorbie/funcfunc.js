import { isNull, isUndef } from "./asfunc";

export { isNull, isUndef };

export function isNullish(x) {
  return x == null;
}

export function isFalsy(x) {
  return !x;
}

export function nullMap(proc, x0, ...xs) {
  switch (xs.length) {
    case 0: {
      return nullMap1(proc, x0);
    }
    case 1: {
      return nullMap2(proc, x0, xs[0]);
    }
    default: {
      return _nullMapN(proc, x0, xs);
    }
  }
}

export function nullMap1(proc, x0) {
  if (x0 === null) {
    return null;
  }
  return proc(x0);
}

export function nullMap2(proc, x0, x1) {
  if (x0 === null || x1 === null) {
    return null;
  }
  return proc(x0, x1);
}

function _nullMapN(proc, x0, xs) {
  if (x0 === null) {
    return null;
  }
  const { length } = xs;
  for (let i = 0; i < length; ++i) {
    if (xs[i] === null) {
      return null;
    }
  }
  return proc(x0, ...xs);
}

export function undefMap(proc, ...xs) {
  if (xs.some(isUndef)) {
    return void 0;
  }
  return proc(...xs);
}

export function undefMap1(proc, x) {
  if (x === void 0) {
    return void 0;
  }
  return proc(x);
}

export function nullishMap(proc, ...xs) {
  if (xs.some(isNullish)) {
    return void 0;
  }
  return proc(...xs);
}

export function nullishMap1(proc, x) {
  if (x == null) {
    return void 0;
  }
  return proc(x);
}

export function falsyMap(proc, ...xs) {
  if (xs.some(isFalsy)) {
    return false;
  }
  return proc(...xs);
}

export function falsyMap1(proc, x) {
  if (!x) {
    return false;
  }
  return proc(x);
}

export function falseMap(proc, ...xs) {
  if (xs.some((x) => x === false)) {
    return false;
  }
  return proc(...xs);
}

export function falseMap1(proc, x) {
  if (x === false) {
    return false;
  }
  return proc(x);
}
