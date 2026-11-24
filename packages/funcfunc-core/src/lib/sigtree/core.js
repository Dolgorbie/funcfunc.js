import { every2, forEach1, map1 } from "../sequence/array-utils";

const _ST_DISABLED = 0;
const _ST_FRESH = 1;
const _ST_STALE = 2;

export function atom(init) {
  return new _Atom(init);
}

export function focus(lns, sig) {
  return new _Focus(lns, sig);
}

export function track(handler, ...sigs) {
  return new _Track(handler, sigs);
}

export function effect(handler, ...sigs) {
  return new _Effect(handler, sigs);
}

export function deref(sig) {
  sig._update?.();
  return sig._value;
}

export function swap(sig, func, ...args) {
  if (!("_updateRoot" in sig)) {
    throw TypeError("immutable signal");
  }

  const { _root, _changed } = sig._updateRoot(func, ...args);

  if (_changed) {
    const errors = [];
    const effects = [..._root._effectSet];
    _staleAllChildren(effects, [..._root._childSet]);

    for (const e of effects) {
      switch (e._state) {
        case _ST_DISABLED:
          throw Error("disabled effect");
        case _ST_FRESH:
          e._state = _ST_STALE;
          break;
        case _ST_STALE:
          break;
        default:
          throw Error("unrecognized state");
      }
    }

    for (const e of effects) {
      try {
        switch (e._state) {
          case _ST_DISABLED:
            throw Error("disabled effect");
          case _ST_FRESH:
            break;
          case _ST_STALE:
            e._invoke();
            break;
          default:
            throw Error("unrecognized state");
        }
      } catch (err) {
        errors.push(err);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, "some effects threw errors.");
    }
  }

  return deref(sig);
}

function _staleAllChildren(effects, children) {
  if (children.length === 0) {
    return;
  }

  const nextChildren = [];

  for (const target of children) {
    switch (target._state) {
      case _ST_DISABLED:
        throw Error("disabled signal");
      case _ST_FRESH: {
        for (const e of target._effectSet) {
          effects.push(e);
        }
        for (const c of target._childSet) {
          nextChildren.push(c);
        }
        target._state = _ST_STALE;
        break;
      }
      case _ST_STALE:
        break;
      default:
        throw Error("unrecognized state");
    }
  }

  _staleAllChildren(effects, nextChildren);
}

export function xswap(func, sig, ...args) {
  return swap(sig, func, ...args);
}

export function reset(sig, value) {
  return swap(sig, () => value);
}

export function retain(sig) {
  if (!("_count" in sig)) {
    return;
  }

  if (sig._count++ === 0) {
    try {
      sig._setup?.();
    } catch (error) {
      sig._count -= 1;
      throw error;
    }
  }
}

export function release(sig) {
  if (!("_count" in sig)) {
    return;
  }

  if (sig._count <= 0) {
    throw Error("too many release");
  }

  if (--sig._count === 0) {
    sig._tearDown?.();
  }
}

class _Atom {
  _effectSet = new Set();
  _childSet = new Set();

  _value = void 0;

  constructor(value) {
    this._value = value;
  }

  /**
   *
   * @param {(...xs: any[]) => any} toNext
   * @param  {...any} args
   * @returns {{ _root:_Atom, _changed:boolean }}
   */
  _updateRoot(toNext, ...args) {
    const prev = this._value;
    const next = toNext(prev, ...args);

    this._value = next;

    return { _root: this, _changed: !Object.is(prev, next) };
  }
}

class _Focus {
  _effectSet = new Set();
  _childSet = new Set();

  _lens = null;
  _depSig = null;

  _depValue = void 0;
  _value = void 0;

  _state = _ST_DISABLED;
  _count = 0;

  constructor(lens, sig) {
    this._lens = lens;
    this._depSig = sig;
    this._depValue = deref(sig);
    this._value = lens.view(this._depValue);
  }

  _update() {
    const { _state } = this;

    switch (_state) {
      case _ST_FRESH:
        break;
      case _ST_DISABLED:
      case _ST_STALE: {
        const dv = deref(this._depSig);
        if (Object.is(dv, this._depValue)) {
          break;
        }
        this._value = this._lens.view(dv);
        this._depValue = dv;
        break;
      }
      default:
        throw Error("unrecognized state");
    }

    if (_state === _ST_STALE) {
      this._state = _ST_FRESH;
    }
  }

  _updateRoot(toNext, ...args) {
    return this._depSig._updateRoot((prevDepValue) => this._lens.update(prevDepValue, (prev) => toNext(prev, ...args)));
  }

  _setup() {
    const { _depSig } = this;
    this._state = _ST_STALE;

    retain(_depSig);
    _depSig._childSet.add(this);
  }

  _tearDown() {
    const { _depSig } = this;
    _depSig._childSet.delete(this);
    release(_depSig);

    this._state = _ST_DISABLED;
  }
}

class _Track {
  _effectSet = new Set();
  _childSet = new Set();

  _func = null;
  _depSigs = null;

  _depValues = null;
  _value = void 0;

  _state = _ST_DISABLED;
  _count = 0;

  constructor(func, sigs) {
    this._func = func;
    this._depSigs = sigs;
    this._depValues = map1(deref, sigs);
    this._value = func(...this._depValues);
  }

  _update() {
    const { _state } = this;

    switch (_state) {
      case _ST_FRESH:
        break;
      case _ST_DISABLED:
      case _ST_STALE: {
        const dvs = map1(deref, this._depSigs);
        if (every2(Object.is, dvs, this._depValues)) {
          break;
        }
        this._value = this._func(...dvs);
        this._depValues = dvs;
        break;
      }
      default:
        throw Error("unrecognized state");
    }

    if (_state === _ST_STALE) {
      this._state = _ST_FRESH;
    }
  }

  _setup() {
    this._state = _ST_STALE;

    forEach1((d) => {
      retain(d);
      d._childSet.add(this);
    }, this._depSigs);
  }

  _tearDown() {
    forEach1((d) => {
      d._childSet.delete(this);
      release(d);
    }, this._depSigs);

    this._state = _ST_DISABLED;
  }
}

class _Effect {
  _proc = null;
  _depSigs = null;

  _depValues = null;
  _cleanup = null;

  _state = _ST_DISABLED;
  _count = 0;

  constructor(proc, sigs) {
    this._proc = proc;
    this._depSigs = sigs;
  }

  _invoke() {
    const { _state } = this;

    switch (_state) {
      case _ST_FRESH:
        break;
      case _ST_DISABLED:
      case _ST_STALE: {
        const { _depValues } = this;
        const dvs = map1(deref, this._depSigs);
        if (_depValues != null && every2(Object.is, dvs, _depValues)) {
          break;
        }
        const { _cleanup } = this;
        this._cleanup = null;
        if (typeof _cleanup === "function") {
          _cleanup();
        }
        this._cleanup = this._proc(...dvs);
        this._depValues = dvs;
        break;
      }
      default:
        throw Error("unrecognized state");
    }

    if (_state === _ST_STALE) {
      this._state = _ST_FRESH;
    }
  }

  _setup() {
    forEach1((d) => {
      retain(d);
      d._effectSet.add(this);
    }, this._depSigs);

    this._state = _ST_STALE;

    try {
      this._invoke();
    } catch (error) {
      this._tearDown();
      throw error;
    }
  }

  _tearDown() {
    try {
      this._cleanup?.();
    } finally {
      this._state = _ST_DISABLED;
      this._depValues = null;
      this._cleanup = null;

      forEach1((d) => {
        d._effectSet.delete(this);
        release(d);
      }, this._depSigs);
    }
  }
}
