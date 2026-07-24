export const idlens = lens((target) => target, (_target, value) => value);

export function lens(ref, upd, thisArg = void 0) {
  if (thisArg === void 0) {
    return { ref, upd };
  }
  return { ref: ref.bind(thisArg), upd: upd.bind(thisArg) };
}

export function chain(...lenses) {
  return _chainLens(lenses);
}

export function pathLens(...propOrIndex) {
  const { length } = propOrIndex;
  for (let i = 0; i < length; ++i) {
    const segment = propOrIndex[i];
    switch (typeof segment) {
      case "string":
      case "symbol": {
        propOrIndex[i] = _propLens(segment);
        break;
      }
      case "number": {
        propOrIndex[i] = _indexLens(segment);
        break;
      }
      default: {
        throw TypeError(`expects string, symbol, or number, but got: ${segment}`);
      }
    }
  }

  return _chainLens(propOrIndex);
}

function _chainLens(lenses) {
  const { length } = lenses;
  switch (length) {
    case 0: {
      return idlens;
    }
    case 1: {
      return lenses[0];
    }
    default: {
      return _chainLensImpl(lenses);
    }
  }
}

function _chainLensImpl(lenses) {
  const { length } = lenses;

  function _ref(target) {
    for (let i = 0; i < length; ++i) {
      target = lenses[i].ref(target);
    }
    return target;
  }

  function _upd(target, value) {
    return _updImpl(0, target, value);
  }

  function _updImpl(i, target, value) {
    if (i === length) {
      return value;
    }
    const lensI = lenses[i];
    return lensI.upd(target, _updImpl(i + 1, lensI.ref(target), value));
  }

  return lens(_ref, _upd);
}

function _propLens(prop) {
  function _ref(target) {
    if (target === null || typeof target !== "object") {
      return void 0;
    }
    return target[prop];
  }

  function _upd(target, value) {
    if (target === null || typeof target !== "object") {
      return { [prop]: value };
    }

    if (prop in target && Object.is(target[prop], value)) {
      return target;
    }

    return { ...target, [prop]: value };
  }

  return lens(_ref, _upd);
}

function _indexLens(index) {
  index = Math.max(0, index | 0);

  function _ref(target) {
    if (!Array.isArray(target)) {
      return void 0;
    }
    return target[index];
  }

  function _upd(target, value) {
    if (!Array.isArray(target)) {
      const res = new Array(index + 1);
      res[index] = value;
      return res;
    }

    const { length } = target;
    if (index in target && Object.is(target[index], value)) {
      return target;
    }

    const res = [...target];
    if (length <= index) {
      res.length = index + 1;
    }
    res[index] = value;
    return res;
  }

  return lens(_ref, _upd);
}

export function ref(lns, target) {
  return lns.ref(target);
}

export function xref(target, lns) {
  return lns.ref(target);
}

export function upd(lns, target, value) {
  return lns.upd(target, value);
}

export function xupd(target, lns, value) {
  return lns.upd(target, value);
}

export function swap(lns, target, swapper) {
  return lns.upd(target, swapper(lns.ref(target)));
}

export function xswap(target, lns, swapper) {
  return lns.upd(target, swapper(lns.ref(target)));
}

export function isLens(lns) {
  return lns != null && typeof lns === "object" && typeof lns.ref === "function" && typeof lns.upd === "function";
}
