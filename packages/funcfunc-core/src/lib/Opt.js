import { isPlainObject } from "./asfunc";
import { isFailed, nothing } from "./failable";
import { map1, reduce2, repeat } from "./sequence/array-utils";
import { gmap1 } from "./sequence/iterator-utils";

export class OptBase {
  view(_target) {
    void _target;
    throw Error("not implemented");
  }

  update(_target, _next) {
    void _target, _next;
    throw Error("not implemented");
  }

  chain(other0, ...others) {
    return chainOpt([this, other0, ...others]);
  }

  at(key0, ...keys) {
    return pathOpt([this, key0, ...keys]);
  }

  merge(others) {
    return chainOpt([this, mergeOpt(others)]);
  }
}

export class BasicOptBase extends OptBase {
  view(target) {
    if (isFailed(target)) {
      return target;
    }
    return this._viewImpl(target);
  }

  update(target, next) {
    if (isFailed(target)) {
      if (isFailed(next)) {
        return target;
      }
      return this._create(next);
    }

    const prev = this._viewImpl(target);
    if (Object.is(prev, next)) {
      return target;
    }

    if (isFailed(next)) {
      return this._remove(target);
    }
    return this._updateImpl(target, next);
  }

  _viewImpl(_target) {
    void _target;
    throw Error("not implemented");
  }

  _updateImpl(_target, _next) {
    void _target, _next;
    throw Error("not implemented");
  }

  _create(_next) {
    void _next;
    throw Error("not implemented");
  }

  _remove(_target) {
    void _target;
    throw Error("not implemented");
  }
}

class _ObjOpt extends BasicOptBase {
  constructor(key) {
    super();
    this._key = key;
  }

  _viewImpl(target) {
    if (!isPlainObject(target)) {
      throw TypeError("target is not a plain object");
    }

    const { _key } = this;

    if (!Object.hasOwn(target, _key)) {
      return nothing();
    }

    return target[_key];
  }

  _updateImpl(target, next) {
    return { ...target, [this._key]: next };
  }

  _create(next) {
    return { [this._key]: next };
  }

  _remove(target) {
    const { [this._key]: _, ...result } = target;
    void _
    return result;
  }
}

class _ArrOpt extends BasicOptBase {
  constructor(index) {
    super();
    this._index = index;
  }

  _viewImpl(target) {
    if (!Array.isArray(target)) {
      throw TypeError("target is not an array");
    }

    const { length } = target;
    const { _index } = this;
    if (_index < 0 && _index < -length) {
      throw RangeError(`length of target requires larger than ${-_index - 1}`);
    }
    if (_index >= 0 && _index >= length) {
      throw RangeError(`length of target requires larger than ${_index}`);
    }

    const i = _index < 0 ? _index + length : _index;
    if (!Object.hasOwn(target, i)) {
      return nothing();
    }

    return target[i];
  }

  _updateImpl(target, next) {
    const { length } = target;
    const { _index } = this;
    const i = _index < 0 ? _index + length : _index;
    const result = target.slice();
    result[i] = next;
    return result;
  }

  _create(next) {
    const { _index } = this;

    if (_index < 0) {
      const result = new Array(-_index);
      result[0] = next;
      return result;
    }

    const result = new Array(_index + 1);
    result[_index] = next;
    return result;
  }

  _remove(target) {
    const { length } = target;
    const { _index } = this;
    const i = _index < 0 ? _index + length : _index;
    const result = target.slice();
    delete result[i];
    return result;
  }
}

class _ChainOpt extends OptBase {
  constructor(opts) {
    super();
    this._opts = [...opts];
  }

  view(target) {
    let result = target;
    for (const opt of this._opts) {
      if (isFailed(result)) {
        return result;
      }
      result = opt.view(result);
    }
    return result;
  }

  update(target, next) {
    const { _opts } = this;
    const { length } = _opts;
    const tmp = repeat(length, nothing());

    tmp[0] = target;
    for (let i = 0; i < length - 1; ++i) {
      const t = tmp[i];
      if (isFailed(t)) {
        break;
      }

      tmp[i + 1] = _opts[i].view(t);
    }

    let result = next;
    for (let i = length - 1; i >= 0; --i) {
      result = _opts[i].update(tmp[i], result);
    }

    return result;
  }
}

class _MergeOpt extends OptBase {
  constructor(opts) {
    super();
    this._opts = [...opts];
  }

  view(target) {
    if (isFailed(target)) {
      return target;
    }

    return map1((opt) => opt.view(target), this._opts);
  }

  update(target, next) {
    if (isFailed(target)) {
      if (isFailed(next)) {
        return next;
      }
      throw TypeError("next requires an array if target is not a failure");
    }
    return reduce2((acc, opt, next) => opt.update(acc, next), target, this._opts, next);
  }
}

export function isOpt(x) {
  return x instanceof OptBase;
}

export function chainOpt(opts) {
  return new _ChainOpt(opts);
}

export function pathOpt(keys) {
  return chainOpt(gmap1((k) => {
    switch (typeof k) {
      case "number":
        return new _ArrOpt(k);
      case "string":
      case "symbol":
        return new _ObjOpt(k);
      default:
        if (isOpt(k)) {
          return k;
        }
        throw TypeError("key requires a number, string, symbol, or Opt");
    }
  }, keys));
}

export function mergeOpt(opts) {
  return new _MergeOpt(opts);
}

export function view(opt, target) {
  return opt.view(target);
}

export function xview(target, opt) {
  return opt.view(target);
}

export function update(opt, target, value) {
  return opt.update(target, value);
}

export function xupdate(target, opt, value) {
  return opt.update(target, value);
}

export function over(opt, target, func) {
  return opt.update(target, func(opt.view(target)));
}

export function xover(target, opt, func) {
  return opt.update(target, func(opt.view(target)));
}
