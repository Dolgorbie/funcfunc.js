import { toUInt } from "./asfunc";

export const idlens = lens((target) => target, (_target, value) => value);

export function lens(ref, upd, thisArg = void 0) {
  if (thisArg === void 0) {
    return { ref, upd };
  }
  return { ref: ref.bind(thisArg), upd: upd.bind(thisArg) };
}

export function isLens(x) {
  return x != null && typeof x === "object" && typeof x.ref === "function" && typeof x.upd === "function";
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

  upd(target, value) {
    const { _prop } = this;

    if (target == null || typeof target !== "object") {
      return { [_prop]: value };
    }

    if (_prop in target && Object.is(target[_prop], value)) {
      return target;
    }

    return { ...target, [_prop]: value };
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

  upd(target, value) {
    const { _index } = this;

    if (!Array.isArray(target)) {
      const res = new Array(_index + 1);
      res[_index] = value;
      return res;
    }

    const { length } = target;
    if (_index in target && Object.is(target[_index], value)) {
      return target;
    }

    const res = [...target];
    if (length <= _index) {
      res.length = _index + 1;
    }
    res[_index] = value;
    return res;

  }
}
