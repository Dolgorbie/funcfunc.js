import { toUInt } from "./asfunc";

export const idlens = lens((target) => target, (_target, value) => value);

export function lens(ref, swap, thisArg = void 0) {
  if (thisArg === void 0) {
    return { ref, swap };
  }
  return { ref: ref.bind(thisArg), swap: swap.bind(thisArg) };
}

export function isLens(x) {
  return x != null && typeof x === "object" && typeof x.ref === "function" && typeof x.swap === "function";
}

export function ref(lns, target) {
  return lns.ref(target);
}

export function xref(target, lns) {
  return lns.ref(target);
}

export function swap(lns, target, swapper) {
  return lns.swap(target, swapper(lns.ref(target)));
}

export function xswap(target, lns, swapper) {
  return lns.swap(target, swapper(lns.ref(target)));
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

  ref(target) {
    const { _lenses } = this;
    const { length } = _lenses

    let t = target;
    for (let i = 0; i < length; ++i) {
      t = _lenses[i].ref(t);
    }
    return t;
  }

  upd(target, value) {
    const { _lenses } = this;
    const { length } = _lenses
    return _chainUpd(_lenses, length, value, 0, target);
  }
}

function _chainUpd(lenses, length, value, i, target) {
  if (i === length) {
    return value;
  }
  const lensI = lenses[i];
  return lensI.upd(target, _chainUpd(lenses, length, value, i + 1, lensI.ref(target)));
}

class _PropLens {
  _prop;

  constructor(prop) {
    this._prop = prop;
  }

  ref(target) {
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

  ref(target) {
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
