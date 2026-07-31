import { toUInt } from "./asfunc";

export const idlens = lens((target) => target, (target, swapper) => swapper(target));

export function lens(deref, swap, thisArg = void 0) {
  if (thisArg === void 0) {
    return { deref, swap };
  }
  return { deref: deref.bind(thisArg), swap: swap.bind(thisArg) };
}

export function isLens(x) {
  return x != null && typeof x === "object" && typeof x.deref === "function" && typeof x.swap === "function";
}

export function deref(lns, target) {
  return lns.deref(target);
}

export function xderef(target, lns) {
  return lns.deref(target);
}

export function swap(lns, target, swapper) {
  return lns.swap(target, swapper);
}

export function xswap(target, lns, swapper) {
  return lns.swap(target, swapper);
}

export function upd(lns, target, value) {
  return lns.swap(target, () => value);
}

export function xupd(target, lns, value) {
  return lns.swap(target, () => value);
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
        propOrIndex[i] = new _PropLens(segment);
        break;
      }
      case "number": {
        propOrIndex[i] = new _IndexLens(segment);
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
      return new _ChainLens(lenses);
    }
  }
}

class _ChainLens {
  _lenses;

  constructor(lenses) {
    this._lenses = lenses;
  }

  deref(target) {
    const { _lenses } = this;
    const { length } = _lenses

    let t = target;
    for (let i = 0; i < length; ++i) {
      t = _lenses[i].deref(t);
    }
    return t;
  }

  swap(target, swapper) {
    const { _lenses } = this;
    const { length } = _lenses
    return _chainSwap(_lenses, length, swapper, 0, target);
  }
}

function _chainSwap(lenses, length, swapper, i, target) {
  if (i === length) {
    return swapper(target);
  }
  const lensI = lenses[i];
  return lensI.swap(target, (value) => _chainSwap(lenses, length, swapper, i + 1, value));
}

class _PropLens {
  _prop;

  constructor(prop) {
    this._prop = prop;
  }

  deref(target) {
    if (target == null || typeof target !== "object") {
      return void 0;
    }
    return target[this._prop];
  }

  swap(target, swapper) {
    const { _prop } = this;

    if (target == null || typeof target !== "object") {
      return { [_prop]: swapper() };
    }

    if (!(_prop in target)) {
      return { ...target, [_prop]: swapper() };
    }

    const prev = target[_prop]
    const next = swapper(prev);
    if (Object.is(prev, next)) {
      return target;
    }

    return { ...target, [_prop]: next };
  }
}

class _IndexLens {
  _index;

  constructor(index) {
    this._index = toUInt(index);
  }

  deref(target) {
    if (!Array.isArray(target)) {
      return void 0;
    }
    return target[this._index];
  }

  swap(target, swapper) {
    const { _index } = this;

    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      const res = [];
      res[_index] = swapper();
      return res;
    }

    if (!(_index in target)) {
      const res = Array.prototype.slice.call(target);
      res[_index] = swapper();
      return res;
    }

    const prev = target[_index];
    const next = swapper(prev);
    if (Object.is(prev, next)) {
      return target;
    }
    const res = Array.prototype.slice.call(target);
    res[_index] = next;
    return res;
  }
}
