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
  constructor({ _thisArg, _onInit } = {}) {
    this.__thisArg = _thisArg;
    this.__onInit = _onInit;
    this.__onDispose = void 0;
    this.__count = 0;
  }

  _retain() {
    if (this.__count++ === 0) {
      const { __onInit } = this;
      if (__onInit) {
        this.__onDispose = __onInit.call(this.__thisArg);
      }
    }
  }

  _release() {
    if (this.__count === 0) {
      throw Error("too many release");
    }
    if (--this.__count === 0) {
      const { __onDispose } = this;
      if (__onDispose) {
        __onDispose.call(this.__thisArg);
      }
    }
  }
}

class _SigContainer {
  constructor({ _thisArg, _onRegChild, onRegEff } = {}) {
    this.__thisArg = _thisArg;
    this.__onRegChild = _onRegChild;
    this.__onRegEff = onRegEff;

    this.__onRemoveHookMap = new Map();

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
    _regItemTemplate(this.__children, sigNode, this.__onRegChild, this.__thisArg, this.__onRemoveHookMap);
  }

  _removeChild(sigNode) {
    _removeItemTemplate(this.__children, sigNode, this.__onRemoveHookMap, this.__thisArg);
  }

  _clearChildren() {
    for (const c of this.__children) {
      this._removeChild(c);
    }
  }

  _regEff(eff) {
    _regItemTemplate(this.__effects, eff, this.__onRegEff, this.__thisArg, this.__onRemoveHookMap);
  }

  _removeEff(eff) {
    _removeItemTemplate(this.__effects, eff, this.__onRemoveHookMap, this.__thisArg);
  }

  _clearEffs() {
    for (const e of this.__effects) {
      this._removeEff(e);
    }
  }
}

function _regItemTemplate(itemSet, item, callback, thisArg, inverseCallbackMap) {
  if (itemSet.has(item)) {
    return;
  }

  itemSet.add(item);
  if (callback) {
    const inverseCallback = callback.call(thisArg, item);
    if (inverseCallback) {
      inverseCallbackMap.set(item, inverseCallback);
    }
  }
}

function _removeItemTemplate(itemSet, item, inverseCallbackMap, thisArg) {

  if (!itemSet.has(item)) {
    return;
  }

  const inverseCallback = inverseCallbackMap.get(item);
  if (inverseCallback) {
    inverseCallback.call(thisArg, item);
    inverseCallbackMap.delete(item);
  }

  itemSet.delete(item);
}

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Stm {
  constructor({
    _thisArg,
    _onStart,
    _onActivate,
    _onRefresh,
    _onStale,
    _onDispose,
  } = {}) {
    this.__state = _st_new;

    this.__thisArg = _thisArg;

    this.__onStart = _onStart;
    this.__onActivate = _onActivate;
    this.__onRefresh = _onRefresh;
    this.__onStale = _onStale;
    this.__onDispose = _onDispose;

    _onStart.call(_thisArg);
  }

  _start() {
    switch (this.__state) {
      case _st_disabled: {
        this.__state = _st_new;
        return this.__onStart.call(this.__thisArg);
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
        return this.__onRefresh.call(this.__thisArg);
      }
      case _st_new: {
        this.__state = _st_fresh;
        return this.__onActivate.call(this.__thisArg);
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
        return this.__onStale.call(this.__thisArg);
      }
      case _st_stale:
      case _st_new: {
        break;
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
    this.__state = _st_stale;
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
        return this.__onDispose.call(this.__thisArg);
      }
    }
  }
}

export class Atom {
  constructor(init) {
    this._sigContainer = new _SigContainer();

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
    this._stm = new _Stm({
      _thisArg: this,
      _onStart: this._onStart,
      _onActivate: this._onActivate,
      _onRefresh: this._onRefresh,
      _onStale: this._onStale,
      _onDispose: this._onDispose,
    });

    this._rc = new _RC({
      _thisArg: this,
      _onInit: this._onInit,
    });

    this._sigContainer = new _SigContainer({
      _thisArg: this,
      _onRegChild: this._onRegChild,
      onRegEff: this._onRegEff,
    });

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

  _dispose() {
    this._stm._dispose();
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
    return this._dispose;
  }

  _onRegChild() {
    this._retain();
    return this._release;

  }

  _onRegEff() {
    this._retain();
    return this._release;
  }
}

export class Focus {
  constructor(lens, depNode) {
    this._stm = new _Stm({
      _thisArg: this,
      _onStart: this._onStart,
      _onActivate: this._onActivate,
      _onRefresh: this._onRefresh,
      _onStale: this._onStale,
      _onDispose: this._onDispose,
    });

    this._rc = new _RC({
      _thisArg: this,
      _onInit: this._onInit,
    });

    this._sigContainer = new _SigContainer({
      _thisArg: this,
      _onRegChild: this._onRegChild,
      onRegEff: this._onRegEff,
    });

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

  _dispose() {
    this._stm._dispose();
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
    return this._dispose();
  }

  _onRegChild() {
    this._retain();
    return this._release;
  }

  _onRegEff() {
    this._retain();
    return this._release;
  }
}

export class Effect {
  constructor(handler, depNodes) {
    this._stm = new _Stm({
      _thisArg: this,
      _onStart: this._onStart,
      _onActivate: this._onActivate,
      _onRefresh: this._onRefresh,
      _onStale: void 0,
      _onDispose: this._onDispose,
    });

    this._rc = new _RC({
      _thisArg: this,
      _onInit: this._onInit,
    });

    this._handler = handler;
    this._depNodes = depNodes;

    this._depValues = [];
  }

  _invoke() {
    this._stm._refresh();
  }

  _dispose() {
    this._stm._dispose();
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
}

function* _staleAndCollectEffects(sigNodes, effs) {
  yield* effs;

  for (const n of sigNodes) {
    yield* n._stale();
  }
}
