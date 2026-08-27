import { mod2, toInt } from "./asfunc";
import { fail, isFailed } from "./failable";
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
  const lnsArray = [...lenses];
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
      case "function": {
        return new _ArrayTrav(seg);
      }
      default: {
        return seg;
      }
    }
  }, segments));
}


export function optspath(...segments) {
  return chain(gmap1((seg) => {
    switch (typeof seg) {
      case "string":
      case "symbol": {
        return new _PropOpts(seg);
      }
      case "number": {
        return new _IndexOpts(seg);
      }
      case "function": {
        return new _ArrayTrav(seg);
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

    if (target == null || typeof target !== "object") {
      return void 0;
    }

    return target[this._prop];
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    const { _prop } = this;

    if (target == null || typeof target !== "object") {
      const value = func();
      return isFailed(value) ? target : { [_prop]: value };
    }

    if (!(_prop in target)) {
      const value = func();
      return isFailed(value) ? target : { ...target, [_prop]: value };
    }

    const prev = target[_prop]
    const next = func(prev);
    if (isFailed(next)) {
      const res = { ...target };
      delete res[_prop];
      return res;
    }
    if (Object.is(prev, next)) {
      return target;
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

    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return void 0;
    }

    const { _index } = this;
    return target[_index < 0 ? mod2(_index, target.length) : _index];
  }

  update(target, func) {
    if (isFailed(target)) {
      return target;
    }

    const { _index } = this;

    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      const value = func();
      if (isFailed(value)) {
        return target;
      }
      const res = [];
      res[_index] = value;
      return res;
    }

    const i = _index < 0 ? mod2(_index, target.length) : _index;

    if (!(i in target)) {
      const value = func();
      if (isFailed(value)) {
        return target;
      }
      const res = Array.prototype.slice.call(target);
      res[i] = value;
      return res;
    }

    const prev = target[i];
    const next = func(prev);
    if (isFailed(next)) {
      if (i === target.length - 1) {
        return Array.prototype.slice.call(target, 0, -1);
      }
      const res = Array.prototype.slice.call(target);
      delete res[i];
      return res
    }
    if (Object.is(prev, next)) {
      return target;
    }
    const res = Array.prototype.slice.call(target);
    res[i] = next;
    return res;
  }
}

class _ArrayTrav {
  _filter;

  constructor(filter) {
    this._filter = filter;
  }

  view(target) {
    if (isFailed(target)) {
      return target;
    }

    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return void 0;
    }

    const { _filter } = this;
    const { length } = target;

    let i = 0;
    const res = new Array(length);
    for (let j = 0; j < length; ++j) {
      const value = target[j];
      if (_filter(value, j, length)) {
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
    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return target;
    }
    const { _filter } = this;
    const { length } = target;

    let i = 0;
    const res = new Array(length);
    for (let j = 0; j < length; ++j) {
      const value = target[j];
      if (_filter(value, j, length)) {
        res[i++] = func(value);
      }
    }

    if (i === length && every2(Object.is, target, res)) {
      return target;
    }

    res.length = i;
    return res;
  }
}

class _PropOpts {
  _prop;

  constructor(prop) {
    this._prop = prop;
  }

  view(target) {
    if (target != null && typeof target === "object") {
      const { _prop } = this;
      if (_prop in target) {
        return target[_prop];
      }
    }
    return fail();
  }

  update(target, func) {
    if (target != null && typeof target === "object") {
      const { _prop } = this;
      if (_prop in target) {
        const prev = target[_prop]
        const next = func(prev);
        if (!Object.is(prev, next)) {
          return { ...target, [_prop]: next };
        }
      }
    }
    return target;
  }
}

class _IndexOpts {
  _index;

  constructor(index) {
    this._index = toInt(index);
  }

  view(target) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      if (typeof length === "number") {
        const { _index } = this;
        const i = _index < 0 ? mod2(_index, length) : _index;
        if (i in target) {
          return target[i];
        }
      }
    }
    return fail();
  }

  update(target, func) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      if (typeof length === "number") {
        const { _index } = this;
        const i = _index < 0 ? mod2(_index, length) : _index;
        if (i in target) {
          const prev = target[i];
          const next = func(prev);
          if (!Object.is(prev, next)) {
            const res = Array.prototype.slice.call(target);
            res[i] = next;
            return res;
          }
        }
      }
    }
    return target;
  }
}

class _ArrayTravOpts {
  _filter;

  constructor(filter) {
    this._filter = filter;
  }

  view(target) {
    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return fail();
    }

    const { _filter } = this;
    const { length } = target;

    let i = 0;
    const res = new Array(length);
    for (let j = 0; j < length; ++j) {
      const value = target[j];
      if (_filter(value, j, length)) {
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
    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return target;
    }
    const { _filter } = this;
    const { length } = target;

    let i = 0;
    const res = new Array(length);
    for (let j = 0; j < length; ++j) {
      const value = target[j];
      if (_filter(value, j, length)) {
        res[i++] = func(value);
      }
    }

    if (i === length && every2(Object.is, target, res)) {
      return target;
    }

    res.length = i;
    return res;
  }
}
