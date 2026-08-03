import { filter, iota } from "./array-utils";
import { mod2, toInt } from "./asfunc";
import { fail, isFailed } from "./failable";
import { map1 } from "./iterator-utils";

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

export function path(...segments) {
  const { length } = segments;
  for (let i = 0; i < length; ++i) {
    const seg = segments[i];
    switch (typeof seg) {
      case "string":
      case "symbol": {
        segments[i] = new _PropLens(seg);
        break;
      }
      case "number": {
        segments[i] = new _IndexLens(seg);
        break;
      }
      case "function": {
        segments[i] = new _Trav(seg);
        break;
      }
      default: {
        // DO NOTHING
      }
    }
  }

  return _chainLens(segments);
}

export function opath(...segments) {
  const { length } = segments;
  for (let i = 0; i < length; ++i) {
    const seg = segments[i];
    switch (typeof seg) {
      case "string":
      case "symbol": {
        segments[i] = new _PropOpts(seg);
        break;
      }
      case "number": {
        segments[i] = new _IndexOpts(seg);
        break;
      }
      case "function": {
        segments[i] = new _TravOpts(seg);
        break;
      }
      default: {
        // DO NOTHING
      }
    }
  }
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
      if (isFailed(t)) {
        return t;
      }
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
    this._index = toInt(index);
  }

  deref(target) {
    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      return void 0;
    }

    const { _index } = this;
    return target[_index < 0 ? mod2(_index, target.length) : _index];
  }

  swap(target, swapper) {
    const { _index } = this;

    if (target == null || typeof target !== "object" || typeof target.length !== "number") {
      const res = [];
      res[_index] = swapper();
      return res;
    }

    const i = _index < 0 ? mod2(_index, target.length) : _index;

    if (!(i in target)) {
      const res = Array.prototype.slice.call(target);
      res[i] = swapper();
      return res;
    }

    const prev = target[i];
    const next = swapper(prev);
    if (Object.is(prev, next)) {
      return target;
    }
    const res = Array.prototype.slice.call(target);
    res[i] = next;
    return res;
  }
}

class _Trav {
  _filter;

  constructor(filter) {
    this._filter = filter;
  }

  deref(target) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      const { _filter } = this;
      if (typeof length === "number") {
        const prevRange = iota(length);
        const nextRange = filter(_filter, prevRange);
        if (prevRange.length === nextRange.length) {
          return target;
        }
        return Array.from(map1((i) => target[i], nextRange));
      }
      const prevKeys = Object.keys(target);
      const nextKeys = filter(_filter, prevKeys);
      if (prevKeys.length === nextKeys.length) {
        return target;
      }
      return Object.fromEntries(map1((key) => [key, target[key]], nextKeys));
    }
    return void 0;
  }

  swap(target, swapper) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      const { _filter } = this;
      if (typeof length === "number") {
        return Array.from(map1((i) => _filter(i) ? swapper(target[i]) : target[i], iota(length)));
      }
      return Object.fromEntries((key) => [key, _filter(key) ? swapper(target[key]) : target[key]], Object.keys(target));
    }
    return swapper();
  }
}

class _PropOpts {
  _prop;

  constructor(prop) {
    this._prop = prop;
  }

  deref(target) {
    if (target != null && typeof target === "object") {
      const { _prop } = this;
      if (_prop in target) {
        return target[_prop];
      }
    }
    return fail();
  }

  swap(target, swapper) {
    if (target != null && typeof target === "object") {
      const { _prop } = this;
      if (_prop in target) {
        const prev = target[_prop]
        const next = swapper(prev);
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

  deref(target) {
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

  swap(target, swapper) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      if (typeof length === "number") {
        const { _index } = this;
        const i = _index < 0 ? mod2(_index, length) : _index;
        if (i in target) {
          const prev = target[i];
          const next = swapper(prev);
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

class _TravOpts {
  _filter;

  constructor(filter) {
    this._filter = filter;
  }

  deref(target) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      const { _filter } = this;
      if (typeof length === "number") {
        const prevRange = iota(length);
        const nextRange = filter(_filter, prevRange);
        if (prevRange.length === nextRange.length) {
          return target;
        }
        return Array.from(map1((i) => target[i], nextRange));
      }
      const prevKeys = Object.keys(target);
      const nextKeys = filter(_filter, prevKeys);
      if (prevKeys.length === nextKeys.length) {
        return target;
      }
      return Object.fromEntries(map1((key) => [key, target[key]], nextKeys));
    }
    return fail();
  }

  swap(target, swapper) {
    if (target != null && typeof target === "object") {
      const { length } = target;
      const { _filter } = this;
      if (typeof length === "number") {
        return Array.from(map1((i) => _filter(i) ? swapper(target[i]) : target[i], iota(length)));
      }
      return Object.fromEntries((key) => [key, _filter(key) ? swapper(target[key]) : target[key]], Object.keys(target));
    }
    return target;
  }
}
