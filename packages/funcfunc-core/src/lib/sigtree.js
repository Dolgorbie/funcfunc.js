import { every2, forEach1, map1 } from "./arrays";

export function atom(init) {
  return new Atom(init);
}

export function track(handler, ...nodes) {
  return new Track(handler, nodes);
}

export function focus(lns, node) {
  return new Focus(lns, node);
}

export function effect(handler, ...nodes) {
  return new Effect(handler, nodes);
}

export function deref(node) {
  return node._deref();
}

export function swap(node, swapper) {
  return node._swap(swapper);
}

export function retain(node) {
  return node._retain();
}

export function release(node) {
  return node._release();
}

class _RC {
  constructor(listener) {
    this.__listener = listener;
    this.__count = 0;
  }

  _retain() {
    if (this.__count++ === 0) {
      this.__listener._onInit?.();
    }
  }

  _release() {
    if (this.__count === 0) {
      throw Error("too many release");
    }
    if (--this.__count === 0) {
      this.__listener._onFinal?.();
    }
  }
}

class _SigContainer {
  constructor(listener) {
    this.__listener = listener;

    this.__children = new Set();
    this.__effects = new Set();
  }

  _children() {
    return this.__children.values();
  }

  _effects() {
    return this.__effects.values();
  }

  _regChild(sigNode) {
    const { __children } = this;
    if (__children.has(sigNode)) {
      return;
    }
    __children.add(sigNode);
    this.__listener._onRegItem?.(sigNode);
  }

  _removeChild(sigNode) {
    const { __children } = this;
    if (!__children.has(sigNode)) {
      return;
    }
    this.__listener._onRemoveItem?.(sigNode);
    __children.delete(sigNode);
  }

  _clearChildren() {
    forEach1((c) => this._removeChild(c), [...this.__children]);
  }

  _regEff(eff) {
    const { __effects } = this;
    if (__effects.has(eff)) {
      return;
    }
    __effects.add(eff);
    this.__listener._onRegItem?.(eff);

  }

  _removeEff(eff) {
    const { __effects } = this;
    if (!__effects.has(eff)) {
      return;
    }
    this.__listener._onRemoveItem?.(eff);
    this._effects.delete(eff);
  }

  _clearEffs() {
    forEach1((e) => this._removeEff(e), [...this.__effects]);
  }
}

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Stm {
  constructor(listener) {
    this.__state = _st_new;
    this.__listener = listener;

    listener._onStart?.();
  }

  _start() {
    switch (this.__state) {
      case _st_disabled: {
        this.__state = _st_new;
        return this.__listener._onStart?.();
      }
      case _st_fresh:
      case _st_stale:
      case _st_new: {
        throw Error("expects disabled state");
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
  }

  _refresh() {
    switch (this.__state) {
      case _st_disabled: {
        throw Error("disabled");
      }
      case _st_fresh: {
        break;
      }
      case _st_stale: {
        this.__state = _st_fresh;
        return this.__listener._onRefresh?.();
      }
      case _st_new: {
        this.__state = _st_fresh;
        return this.__listener._onActivate?.();
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
  }

  _stale() {
    switch (this.__state) {
      case _st_disabled: {
        throw Error("disabled");
      }
      case _st_fresh: {
        this.__state = _st_stale;
        return this.__listener._onStale?.();
      }
      case _st_stale:
      case _st_new: {
        this.__state = _st_stale;
        break;
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
  }

  _dispose() {
    switch (this.__state) {
      case _st_disabled: {
        throw Error("disabled");
      }
      case _st_fresh:
      case _st_stale:
      case _st_new: {
        this.__state = _st_disabled;
        return this.__listener._onDispose?.();
      }
    }
  }
}

export class Atom {
  constructor(init) {
    this._sigContainer = new _SigContainer(this);

    this._value = init;
  }

  _deref() {
    return this._value;
  }

  _swap(swapper) {
    const { _value } = this;
    const next = swapper(_value);

    if (Object.is(_value, next)) {
      return [_value, false];
    }

    this._value = next;

    const { _sigContainer } = this;

    const effs = new Set(_staleAndCollectEffects(_sigContainer._children(), _sigContainer._effects()));

    effs.forEach((eff) => eff._invoke());

    return [this._value, true];
  }

  _regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  _removeChild(sigNode) {
    this._sigContainer._removeChild(sigNode);
  }

  _regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  removeEff(eff) {
    this._sigContainer._removeEff(eff);
  }
}

export class Track {
  constructor(handler, depNodes) {
    this._stm = new _Stm(this);

    this._rc = new _RC({
      _thisArg: this,
      _onInit: this._onInit,
    });

    this._sigContainer = new _SigContainer(this);

    this._handler = handler;
    this._depNodes = depNodes;

    this._depValues = [];
    this._value = void 0;
  }

  _deref() {
    return this._stm._refresh();
  }

  _stale() {
    return this._stm._stale();
  }

  _retain() {
    this._rc._retain();
  }

  _release() {
    this._rc._release();
  }

  _regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  _removeChild(sigNode) {
    this._sigContainer._removeChild(sigNode);
  }

  _regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  removeEff(eff) {
    this._sigContainer._removeEff(eff);
  }

  _onStart() {
    forEach1((sigNode) => sigNode._regChild(this), this._depNodes);
  }

  _onActivate() {
    const depValues = map1(deref, this._depNodes);
    const value = this._handler(...depValues);
    this._depValues = depValues;
    this._value = value;
    return value;
  }

  _onRefresh() {
    const depValues = map1(deref, this._depNodes);

    const changed = !every2(Object.is, this._depValues, depValues);
    if (changed) {
      this._depValues = depValues;
      const next = this._handler(...depValues);
      if (!Object.is(this._value, next)) {
        this._value = next;
      }
    }

    return this._value;
  }

  _onStale() {
    const { _sigContainer } = this;
    return _staleAndCollectEffects(_sigContainer._children(), _sigContainer._effects());
  }

  _onDispose() {
    forEach1((sigNode) => sigNode._removeChild(this), this._depNodes);
    this._depValues = [];
    this._value = void 0;
  }

  _onInit() {
    this._stm._start();
  }

  _onFinal() {
    this._stm._dispose();
  }

  _onRegItem() {
    this._retain();

  }

  _onRemoveItem() {
    this._release();
  }
}

export class Focus {
  constructor(lens, depNode) {
    this._stm = new _Stm(this);
    this._rc = new _RC(this);
    this._sigContainer = new _SigContainer(this);

    this._lens = lens;
    this._depNode = depNode;

    this._depValue = void 0;
    this._value = void 0;
  }

  _deref() {
    return this._stm._refresh();
  }

  _swap(swapper) {
    const { _lens } = this;
    const [, changed] = this._depNode._swap((dep) => _lens.upd(dep, swapper(_lens.ref(dep))));

    return [this._stm._refresh(), changed];
  }

  _stale() {
    return this._stm._stale();
  }

  _retain() {
    this._rc._retain();
  }

  _release() {
    this._rc._release();
  }

  _regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  _removeChild(sigNode) {
    this._sigContainer._removeChild(sigNode);
  }

  _regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  removeEff(eff) {
    this._sigContainer._removeEff(eff);
  }

  _onStart() {
    this._depNode._regChild(this);
  }

  _onActivate() {
    const depValue = this._depNode._deref();
    const value = this._lens.ref(depValue);
    this._depValue = depValue;
    this._value = value;
    return value;
  }

  _onRefresh() {
    const depValue = this._depNode._deref();

    if (!Object.is(this._depValue, depValue)) {
      this._depValue = depValue;
      const next = this._lens.ref(depValue);
      if (!Object.is(this._value, next)) {
        this._value = next;
      }
    }

    return this._value;
  }

  _onStale() {
    const { _sigContainer } = this;
    return _staleAndCollectEffects(_sigContainer._children(), _sigContainer._effects());
  }

  _onDispose() {
    this._depNode._removeChild(this);
    this._depValue = void 0;
    this._value = void 0;
  }

  _onInit() {
    this._stm._start();
  }

  _onFinal() {
    this._stm._dispose();
  }

  _onRegItem() {
    this._retain();
  }

  _onRemoveItem() {
    this._release();
  }
}

export class Effect {
  constructor(handler, depNodes) {
    this._stm = new _Stm(this);
    this._rc = new _RC(this);

    this._handler = handler;
    this._depNodes = depNodes;

    this._depValues = [];
  }

  _invoke() {
    this._stm._refresh();
  }

  _retain() {
    this._rc._retain();
  }

  _release() {
    this._rc._release();
  }

  _onStart() {
    forEach1((sigNode) => sigNode._regEff(this), this._depNodes);
  }

  _onActivate() {
    const depValues = map1(deref, this._depNodes);
    this._depValues = depValues;
    this._handler(...depValues);
  }

  _onRefresh() {
    const depValues = map1(deref, this._depNodes);

    const changed = every2(Object.is, this._depValues, depValues);
    if (changed) {
      this._depValues = depValues;
      this._handler(...depValues);
    }
  }

  _onDispose() {
    forEach1((sigNode) => sigNode._removeEff(this), this._depNodes);
    this._depValues = [];
  }

  _onInit() {
    this._stm._start();
    return this._dispose;
  }

  _onFinal() {
    this._stm._dispose();
  }
}

function* _staleAndCollectEffects(sigNodes, effs) {
  yield* effs;

  for (const n of sigNodes) {
    yield* n._stale();
  }
}
