export class Cache {
  _weak = new WeakMap()
  _strong = new Map();
  _mzeroValue = null;

  _finalizationRegistry;

  _getFinalizationRegistry() {
    if (this._finalizationRegistry == null) {
      this._finalizationRegistry = new FinalizationRegistry((key) => {
        const { _strong } = this;
        const ref = _strong.get(key);
        if (ref != null && ref.deref() === void 0) {
          _strong.delete(key);
        }
      });
    }
    return this._finalizationRegistry;
  }

  get(key) {
    if (key == null) {
      return this._getFromStrong(key);
    }

    if (Object.is(key, -0)) {
      return this._mzeroValue?.deref();
    }

    switch (typeof key) {
      case "object":
      case "function":
        return this._weak.get(key);
      default:
        return this._getFromStrong(key);
    }
  }

  set(key, value) {
    const { _weak } = this;

    if (key == null) {
      this._setToStrong(key, value);
      return this;
    }

    if (Object.is(key, -0)) {
      this._mzeroValue = void 0;

      if (value != null) {
        switch (typeof value) {
          case "object":
          case "function":
            this._mzeroValue = new WeakRef(value);
            break;
          default:
          // do nothing if value is primitive.
        }
      }
      return this;
    }

    switch (typeof key) {
      case "object":
      case "function":
        _weak.set(key, value);
        return this;
      default:
        this._setToStrong(key, value);
        return this;
    }
  }

  _getFromStrong(key) {
    const { _strong } = this;

    const ref = _strong.get(key);
    if (ref === void 0) {
      return void 0;
    }

    const value = ref.deref();
    if (value === void 0) {
      _strong.delete(key);
    }
    return value;
  }

  _setToStrong(key, value) {
    const { _strong } = this;
    _strong.delete(key);

    if (value == null) {
      return;
    }

    switch (typeof value) {
      case "object":
      case "function": {
        const ref = new WeakRef(value);
        this._getFinalizationRegistry().register(value, key);
        _strong.set(key, ref);
        break;
      }
      default:
      // do nothing if value is primitive.
    }
  }
}

const PARTIAL_CACHE = new Cache();

export function partial(proc, value0) {
  let cachedMap = PARTIAL_CACHE.get(proc);
  if (cachedMap == null) {
    PARTIAL_CACHE.set(proc, (cachedMap = new Cache()));
  }

  let cachedProc = cachedMap.get(value0);
  if (cachedProc != null) {
    return cachedProc;
  }

  function partialProc(...args) {
    return proc(value0, ...args);
  }

  partialProc.arg = function arg(value1) {
    return partial(partialProc, value1);
  }

  cachedMap.set(value0, partialProc);
  return partialProc;
}
