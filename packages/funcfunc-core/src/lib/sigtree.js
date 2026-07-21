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

export function reset(node, value) {
  return node._swap(() => value);
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
  }

  _children() {
    return this.__children.values();
  }

  _regChild(sigNode) {
    const { __children } = this;
    if (__children.has(sigNode)) {
      return;
    }
    __children.add(sigNode);
    this.__listener._onRegChild?.(sigNode);
  }

  _removeChild(sigNode) {
    const { __children } = this;
    if (!__children.has(sigNode)) {
      return;
    }
    this.__listener._onRemoveChild?.(sigNode);
    __children.delete(sigNode);
  }

  _clearChildren() {
    forEach1((c) => this._removeChild(c), [...this.__children]);
  }
}

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Stm {
  constructor(listener) {
    this.__state = _st_disabled;
    this.__listener = listener;
  }

  _start() {
    switch (this.__state) {
      case _st_disabled: {
        this.__state = _st_new;
        this.__listener._onStart?.();
        break;
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
        return this.__listener._onSkipRefresh?.();
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
        return this.__listener._onSkipStale?.();
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
        this.__listener._onDispose?.();
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
      return _value;
    }

    this._value = next;

    const { _sigContainer } = this;

    const effs = new Set(_staleAndCollectEffects(_sigContainer._children()));

    effs.forEach((eff) => eff._invoke());

    return this._value;
  }

  _regChild(sigNode) {
    return this._sigContainer._regChild(sigNode);
  }

  _removeChild(sigNode) {
    return this._sigContainer._removeChild(sigNode);
  }
}

export class Track {
  constructor(handler, depNodes) {
    this._stm = new _Stm(this);
    this._rc = new _RC(this);
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

  _onSkipRefresh() {
    return this._value;
  }

  _onStale() {
    return _staleAndCollectEffects(this._sigContainer._children());
  }

  *_onSkipStale() {
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

  _onRegChild() {
    this._retain();

  }

  _onRemoveChild() {
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
    this._stm._refresh();
    return this._value;
  }

  _swap(swapper) {
    const { _lens } = this;
    const parentValue = this._depNode._swap((dep) => _lens.upd(dep, swapper(_lens.ref(dep))));
    return _lens.ref(parentValue);
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

  _onSkipRefresh() {
    return this._value;
  }

  _onStale() {
    return _staleAndCollectEffects(this._sigContainer._children());
  }

  *_onSkipStale() {
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

  _onRegChild() {
    this._retain();
  }

  _onRemoveChild() {
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

  _stale() {
    return this._stm._stale();
  }

  _retain() {
    this._rc._retain();
  }

  _release() {
    this._rc._release();
  }

  _onStart() {
    forEach1((sigNode) => sigNode._regChild(this), this._depNodes);
  }

  _onActivate() {
    const depValues = map1(deref, this._depNodes);
    this._depValues = depValues;
    this._handler(...depValues);
  }

  _onRefresh() {
    const depValues = map1(deref, this._depNodes);

    const changed = !every2(Object.is, this._depValues, depValues);
    if (changed) {
      this._depValues = depValues;
      this._handler(...depValues);
    }
  }

  *_onStale() {
    yield this;
  }

  *_onSkipStale() {
  }

  _onDispose() {
    forEach1((sigNode) => sigNode._removeChild(this), this._depNodes);
    this._depValues = [];
  }

  _onInit() {
    this._stm._start();
  }

  _onFinal() {
    this._stm._dispose();
  }
}

function* _staleAndCollectEffects(sigNodes) {
  for (const n of sigNodes) {
    yield* n._stale();
  }
}
