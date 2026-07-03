import { every1, map1, reduce1 } from "./arrays";
import { is, isArray, isObject } from "./asfunc";

export function view(lns, target) {
  return lns._view(target);
}

export function xview(target, lns) {
  return lns._view(target);
}

export function upd(lns, target, value) {
  return lns._upd(target, value);
}

export function xupd(target, lns, value) {
  return lns._upd(target, value);
}

export function xmut(target, lns, value) {
  return lns._mut(target, value);
}

export function isLens(lns) {
  return lns instanceof LensLike;
}

export function isMutableLens(lns) {
  return isLens(lns) && lns._isMutable();
}

export class LensLike {
  _isMutable() {
    return typeof this._mut === "function";
  }
}

class _Lens extends LensLike {
  constructor(view, upd, mut = void 0) {
    super();
    this._view = view;
    this._upd = upd;
    if (mut != null) {
      this._mut = mut;
    }
  }
}

export function lens(view, upd, mut = void 0) {
  return new _Lens(view, upd, mut);
}

class _IdLens extends LensLike {
  static _INSTANCE = new _IdLens();

  constructor() {
    super();
  }

  _view(target) {
    return target;
  }

  _upd(_target, value) {
    return value;
  }

  _mut(_target, value) {
    return value;
  }
}

class _ChainLens extends LensLike {
  constructor(lenses) {
    super();
    this._lenses = lenses;
    this._hasOnlyMutable = every1(isMutableLens, lenses);
  }

  _view(target) {
    return reduce1(xview, target, this._lenses);
  }

  _upd(target, value) {
    return _chainUpd(0, this._lenses, target, value);
  }

  _mut(target, value) {
    if (!this._hasOnlyMutable) {
      throw TypeError("expects all lenses are mutable, but some are immutable.");
    }
    return _chainMut(0, this._lenses, target, value);
  }

  _isMutable() {
    return this._hasOnlyMutable;
  }
}

export function chain(...lenses) {
  if (!every1((lns) => lns instanceof LensLike, lenses)) {
    throw TypeError("expects LensLike");
  }
  switch (lenses.length) {
    case 0: {
      return _IdLens._INSTANCE;
    }
    case 1: {
      return lenses[0];
    }
    default: {
      return new _ChainLens(lenses);
    }
  }
}

function _chainUpd(indexLenses, lenses, target, value) {
  if (lenses.length === indexLenses) {
    return value;
  }

  const lnsI = lenses[indexLenses];
  return lnsI._upd(target, _chainUpd(indexLenses + 1, lenses, lnsI._view(target), value));
}

function _chainMut(indexLenses, lenses, target, value) {
  if (lenses.length === indexLenses) {
    return value;
  }

  const lnsI = lenses[indexLenses];
  return lnsI._mut(target, _chainMut(indexLenses + 1, lenses, lnsI._view(target), value));
}

class _PropLens extends LensLike {
  constructor(prop) {
    super();
    this._prop = prop;
  }

  _view(target) {
    return isObject(target) ? target[this._prop] : void 0;
  }

  _upd(target, value) {
    const { _prop } = this;

    if (isObject(target)) {
      if (_prop in target && is(target[_prop], value)) {
        return target;
      }
      return { ...target, [_prop]: value };
    }

    return { [_prop]: value };
  }

  _mut(target, value) {
    const { _prop } = this;

    if (isObject(target)) {
      target[_prop] = value;
      return target;
    }

    return { [_prop]: value };
  }
}

class _IndexLens extends LensLike {
  constructor(index) {
    super();
    this._index = index;
  }

  _view(target) {
    return isArray(target) ? target[this._index] : void 0;
  }

  _upd(target, value) {
    const { _index } = this;

    if (isArray(target)) {
      const result = [...target];
      const len = target.length;
      if (len < _index) {
        result.length = _index + 1;
        result.fill(void 0, len);
      }
      result[_index] = value;
      return result;
    }

    const result = new Array(_index + 1).fill();
    result[_index] = value;
    return result;
  }

  _mut(target, value) {
    const { _index } = this;

    if (isArray(target)) {
      target[_index] = value;
      return target;
    }

    const result = new Array(_index + 1).fill();
    result[_index] = value;
    return result;
  }
}

export function pathLens(...segments) {
  const lenses = map1((s) => {
    switch (typeof s) {
      case "number": {
        return new _IndexLens(s);
      }
      case "string":
      case "symbol": {
        return new _PropLens(s);
      }
      default: {
        throw TypeError("expects number, string, or symbol");
      }
    }
  }, segments);

  return chain(...lenses);
}
