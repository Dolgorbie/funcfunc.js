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

export function undefMap(proc, x0, ...xs) {
  switch (xs.length) {
    case 0: {
      return undefMap1(proc, x0);
    }
    case 1: {
      return undefMap2(proc, x0, xs[0]);
    }
    default: {
      return _undefMapN(proc, x0, xs);
    }
  }
}

export function undefMap1(proc, x0) {
  if (x0 === void 0) {
    return void 0;
  }
  return proc(x0);
}

export function undefMap2(proc, x0, x1) {
  if (x0 === void 0 || x1 === void 0) {
    return void 0;
  }
  return proc(x0, x1);
}

function _undefMapN(proc, x0, xs) {
  if (x0 === void 0) {
    return void 0;
  }
  const { length } = xs;
  for (let i = 0; i < length; ++i) {
    if (xs[i] === void 0) {
      return void 0;
    }
  }
  return proc(x0, ...xs);
}

export function nullishMap(proc, x0, ...xs) {
  switch (xs.length) {
    case 0: {
      return nullishMap1(proc, x0);
    }
    case 1: {
      return nullishMap2(proc, x0, xs[0]);
    }
    default: {
      return _nullishMapN(proc, x0, xs);
    }
  }
}

export function nullishMap1(proc, x0) {
  if (x0 == null) {
    return void 0;
  }
  return proc(x0);
}

export function nullishMap2(proc, x0, x1) {
  if (x0 == null || x1 == null) {
    return void 0;
  }
  return proc(x0, x1);
}

function _nullishMapN(proc, x0, xs) {
  if (x0 == null) {
    return void 0;
  }
  const { length } = xs;
  for (let i = 0; i < length; ++i) {
    if (xs[i] == null) {
      return void 0;
    }
  }
  return proc(x0, ...xs);
}

export function falsyMap(proc, x0, ...xs) {
  switch (xs.length) {
    case 0: {
      return falsyMap1(proc, x0);
    }
    case 1: {
      return falsyMap2(proc, x0, xs[0]);
    }
    default: {
      return _falsyMapN(proc, x0, xs);
    }
  }
}

export function falsyMap1(proc, x0) {
  if (!x0) {
    return false;
  }
  return proc(x0);
}

export function falsyMap2(proc, x0, x1) {
  if (!x0 || !x1) {
    return false;
  }
  return proc(x0, x1);
}

function _falsyMapN(proc, x0, xs) {
  if (!x0) {
    return false;
  }
  const { length } = xs;
  for (let i = 0; i < length; ++i) {
    if (!xs[i]) {
      return false;
    }
  }
  return proc(x0, ...xs);
}

export function falseMap(proc, x0, ...xs) {
  switch (xs.length) {
    case 0: {
      return falseMap1(proc, x0);
    }
    case 1: {
      return falseMap2(proc, x0, xs[0]);
    }
    default: {
      return _falseMapN(proc, x0, xs);
    }
  }
}

export function falseMap1(proc, x0) {
  if (x0 === false) {
    return false;
  }
  return proc(x0);
}

export function falseMap2(proc, x0, x1) {
  if (x0 === false || x1 === false) {
    return false;
  }
  return proc(x0);
}

function _falseMapN(proc, x0, xs) {
  if (x0 === false) {
    return false;
  }
  const { length } = xs;
  for (let i = 0; i < length; ++i) {
    if (xs[i] === false) {
      return false;
    }
  }
  return proc(x0, ...xs);
}
