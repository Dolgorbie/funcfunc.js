import { isPlainObject, toInt } from "./asfunc";
import { isFailed, nothing } from "./failable";
import { every2 } from "./sequence/array-utils";
import { gmap1 } from "./sequence/iterator-utils";

export const idlens = lens((target) => target, (target, func) => func(target));

export function lens(view, update, thisArg = void 0) {
  if (thisArg === void 0) {
    return { view, update };
  }
  return { view: view.bind(thisArg), update: update.bind(thisArg) };
}

export function isLens(x) {
  return x != null && typeof x === "object" && typeof x.view === "function" && typeof x.update === "function";
}

export function view(lns, target) {
  return lns.view(target);
}

export function xview(target, lns) {
  return lns.view(target);
}

export function update(lns, target, func) {
  return lns.update(target, func);
}

export function xupdate(target, lns, func) {
  return lns.update(target, func);
}

export function puton(lns, target, value) {
  return lns.update(target, () => value);
}

export function xputon(target, lns, value) {
  return lns.update(target, () => value);
}

export function chain(lenses) {
  const lnsArray = Array.isArray(lenses) ? lenses : [...lenses];
  const { length } = lnsArray;
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

export function path(segments) {
  return chain(gmap1((seg) => {
    switch (typeof seg) {
      case "string":
      case "symbol": {
        return new _PropLens(seg);
      }
      case "number": {
        return new _IndexLens(seg);
      }
      default: {
        return seg;
      }
    }
  }, segments));
}

class _ChainLens {
  _lenses;

  constructor(lenses) {
    this._lenses = lenses;
  }

  view(target) {
    const { _lenses } = this;
    const { length } = _lenses

    let t = target;
    for (let i = 0; i < length; ++i) {
      if (isFailed(t)) {
        return t;
      }
      t = _lenses[i].view(t);
    }
    return t;
  }

  update(target, func) {
    const { _lenses } = this;
    const { length } = _lenses
    return _chainUpdate(_lenses, length, func, 0, target);
  }
}

function _chainUpdate(lenses, length, func, i, target) {
  if (isFailed(target)) {
    return target;
  }

  if (i === length) {
    return func(target);
  }

  const lensI = lenses[i];
  return lensI.update(target, (value) => _chainUpdate(lenses, length, func, i + 1, value));
}

class _PropLens {
  _prop;

  constructor(prop) {
    this._prop = prop;
  }

  view(target) {
    if (isFailed(target)) {
      return target;
    }

    if (!isPlainObject(target)) {
      return nothing();
    }

    const { _prop } = this;

    return Object.hasOwn(target, _prop) ? target[_prop] : nothing();
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    const { _prop } = this;

    if (!isPlainObject(target)) {
      const value = func(nothing());
      return isFailed(value) ? target : { [_prop]: value };
    }

    if (!(Object.hasOwn(target, _prop))) {
      const value = func(nothing());
      return isFailed(value) ? target : { ...target, [_prop]: value };
    }

    const prev = target[_prop];
    const next = func(prev);

    if (Object.is(prev, next)) {
      return target;
    }

    if (isFailed(next)) {
      const res = { ...target };
      delete res[_prop];
      return res;
    }

    return { ...target, [_prop]: next };
  }
}

class _IndexLens {
  _index;

  constructor(index) {
    this._index = toInt(index);
  }

  view(target) {
    if (isFailed(target)) {
      return target;
    }

    if (!Array.isArray(target)) {
      return nothing();
    }

    const { _index } = this;
    const i = _index < 0 ? _index + target.length : _index;
    return i in target ? target[i] : nothing();
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    const { _index } = this;

    if (!Array.isArray(target)) {
      const value = func(nothing());
      if (isFailed(value)) {
        return target;
      }
      const res = new Array(_index < 0 ? -_index : _index + 1);
      res[Math.max(0, _index)] = value;
      return res;
    }

    const i = _index < 0 ? _index + target.length : _index;

    if (!(i in target)) {
      const value = func(nothing());
      if (isFailed(value)) {
        return target;
      }
      const res = [...target];
      if (i < 0) {
        res.length += -i;
        res.copyWithin(-i, 0);
        for (let j = 0; j < -i; ++j) {
          delete res[j];
        }
      }
      res[Math.max(0, i)] = value;
      return res;
    }

    const prev = target[i];
    const next = func(prev);

    if (Object.is(prev, next)) {
      return target;
    }

    if (isFailed(next)) {
      if (i === target.length - 1) {
        return target.slice(0, -1);
      }
      const res = [...target];
      delete res[i];
      return res
    }

    const res = [...target];
    res[i] = next;
    return res;
  }
}

const _arrayEachInstance = new _ArrayEach();

export function arrayEach() {
  return _arrayEachInstance;
}

class _ArrayEach {
  view(target) {
    if (isFailed(target)) {
      return target;
    }

    if (!Array.isArray(target)) {
      return nothing();
    }

    return target;
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    if (!Array.isArray(target)) {
      return target;
    }

    const { length } = target;

    const res = new Array(length);
    for (let i = 0; i < length; ++i) {
      const prev = i in target ? target[i] : nothing();
      const next = func(prev);
      if (!isFailed(next)) {
        res[i] = next;
      }
    }

    return every2(Object.is, target, res) ? target : res;
  }
}

export function arrayFilter(pred) {
  return new _ArrayFilter(pred);
}

class _ArrayFilter {
  _filter;

  constructor(filter) {
    this._filter = filter;
  }

  view(target) {
    if (isFailed(target)) {
      return target;
    }

    if (!Array.isArray(target)) {
      return nothing();
    }

    const { _filter } = this;
    const { length } = target;

    let i = 0;
    const res = new Array(length);
    for (let j = 0; j < length; ++j) {
      const value = j in target ? target[j] : nothing();
      if (_filter(value, j, target)) {
        res[i++] = value;
      }
    }

    if (i === length) {
      return target;
    }

    res.length = i;
    return res;
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    if (!Array.isArray(target)) {
      return target;
    }

    const { _filter } = this;
    const { length } = target;

    const res = new Array(length);
    for (let i = 0; i < length; ++i) {
      const inTarget = i in target;
      const prev = inTarget ? target[i] : nothing();
      if (!_filter(prev, i, target)) {
        if (inTarget) {
          res[i] = prev;
        }
        continue;
      }

      const next = func(prev);
      if (!isFailed(next)) {
        res[i] = next;
      }
    }

    return every2(Object.is, target, res) ? target : res;
  }
}
