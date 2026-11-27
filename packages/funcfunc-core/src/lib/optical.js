import { isPlainObject } from "./asfunc";
import { fail, isFailed, nothing } from "./failable";
import { map1, reduce2 } from "./sequence/array-utils";
import { gflatMap1, gmap1 } from "./sequence/iterator-utils";

export class OptBase {
  view(_target) {
    throw Error("not implemented");
  }

  put(target, next) {
    return this.over(target, () => next);
  }

  over(target, func) {
    return this.put(target, func(this.view(target)));
  }

  chain(other0, ...others) {
    return chainOpt([this, other0, ...others]);
  }

  at(key0, ...keys) {
    return pathOpt([this, key0, ...keys]);
  }

  multi(others) {
    return chainOpt([this, multiOpt(others)]);
  }
}

export class BasicOptBase extends OptBase {
  view(target) {
    if (isFailed(target)) {
      return target;
    }
    return this._viewImpl(target);
  }

  put(target, next) {
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
    return this._putImpl(target, next);
  }

  over(target, func) {
    if (isFailed(target)) {
      const next = func(target);
      if (isFailed(next)) {
        return target;
      }
      return this._create(next);
    }

    const prev = this._viewImpl(target);
    const next = func(prev);
    if (Object.is(prev, next)) {
      return target;
    }

    if (isFailed(next)) {
      return this._remove(target);
    }
    return this._putImpl(target, next);
  }

  _viewImpl(_target) {
    throw Error("not implemented");
  }

  _putImpl(_target, _next) {
    throw Error("not implemented");
  }

  _create(_next) {
    throw Error("not implemented");
  }

  _remove(_target) {
    throw Error("not implemented");
  }
}

class _IdOpt extends OptBase {
  static _SINGLETON = new _IdOpt();

  view(target) {
    return target;
  }

  put(_target, next) {
    return next;
  }

  over(target, func) {
    return func(target);
  }
}

class _ObjOpt extends BasicOptBase {
  constructor(key) {
    super();
    this._key = key;
  }

  _viewImpl(target) {
    if (!isPlainObject(target)) {
      return fail(TypeError("target is not a plain object"));
    }

    const { _key } = this;
    if (!Object.hasOwn(target, _key)) {
      return nothing();
    }

    return target[_key];
  }

  _putImpl(target, next) {
    if (!isPlainObject(target)) {
      return this._create(next);
    }
    return { ...target, [this._key]: next };
  }

  _create(next) {
    return { [this._key]: next };
  }

  _remove(target) {
    if (!isPlainObject(target)) {
      return target;
    }

    const { [this._key]: _, ...result } = target;
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
      return fail(TypeError("target is not an array"));
    }

    const { _index } = this;
    if (!Object.hasOwn(target, _index)) {
      return nothing();
    }

    return target[_index];
  }

  _putImpl(target, next) {
    if (!Array.isArray(target)) {
      return this._create(next);
    }

    const result = target.slice();
    result[this._index] = next;
    return result;
  }

  _create(next) {
    const result = [];
    result[this._index] = next;
    return result;
  }

  _remove(target) {
    if (!Array.isArray(target)) {
      return target;
    }

    const result = target.slice();
    delete result[this._index];
    for (let i = result.length - 1; i >= 0; --i) {
      if (Object.hasOwn(result, i)) {
        break;
      }
      result.length -= 1;
    }
    return result;
  }
}

class _ChainOpt extends OptBase {
  constructor(opts) {
    super();
    this._opts = opts;
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

  over(target, func) {
    const { _opts } = this;
    const { length } = _opts;
    return _chainOver(_opts, length, func, target, 0);
  }
}

function _chainOver(opts, length, func, target, i) {
  if (i === length) {
    return func(target);
  }
  return opts[i].over(target, (value) => _chainOver(opts, length, func, value, i + 1));
}

class _MultiOpt extends OptBase {
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

  put(target, next) {
    if (isFailed(target)) {
      if (isFailed(next)) {
        return target;
      }
      throw TypeError("both target and next are failures");
    }

    const { _opts } = this;

    if (next.length !== _opts.length) {
      throw RangeError("length of next array and opts are not same number");
    }

    return reduce2((acc, opt, next) => opt.put(acc, next), target, this._opts, next);
  }
}

export function isOpt(x) {
  return x instanceof OptBase;
}

export function chainOpt(opts) {
  opts = [
    ...gflatMap1((opt) => {
      if (!isOpt(opt)) {
        throw TypeError("not an opt");
      }
      return opt instanceof _ChainOpt ? opt._opts : [opt];
    }, opts)
  ];

  switch (opts.length) {
    case 0:
      return _IdOpt._SINGLETON;
    case 1:
      return opts[0];
    default:
      return new _ChainOpt(opts);
  }
}

export function pathOpt(keys) {
  return chainOpt(gmap1((k) => {
    switch (typeof k) {
      case "number":
        if (!Number.isSafeInteger(k)) {
          throw RangeError("key is not a safe integer");
        }
        if (k < 0) {
          throw RangeError("key is negative integer");
        }
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

export function multiOpt(opts) {
  return new _MultiOpt(opts);
}

export function view(opt, target) {
  return opt.view(target);
}

export function xview(target, opt) {
  return opt.view(target);
}

export function put(opt, target, value) {
  return opt.put(target, value);
}

export function xput(target, opt, value) {
  return opt.put(target, value);
}

export function over(opt, target, func) {
  return opt.over(target, func);
}

export function xover(target, opt, func) {
  return opt.over(target, func);
}
