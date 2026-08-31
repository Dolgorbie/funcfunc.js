import { every2, forEach1, map1 } from "./sequence/array-utils";

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
  retain(node);
  const res = derefWeak(node);
  release(node);
  return res;
}

export function derefWeak(node) {
  node._update?.();
  return node._value;
}

export function swap(node, func, ...args) {
  if (!("_updateRoot" in node)) {
    throw TypeError("immutable node");
  }

  retain(node);

  const { _root, _changed } = node._updateRoot(func, ...args);
  if (_changed) {
    const effects = new Set();
    _staleAll(effects, [_root]);
    for (const e of effects) {
      e._invoke();
    }
  }
  const res = derefWeak(node);

  release(node);
  return res;
}

function _staleAll(effects, children) {
  const nextChildren = new Set();
  for (const c of children) {
    c._staleDown(effects, nextChildren);
  }
  _staleAll(effects, nextChildren);
}

export function xswap(func, node, ...args) {
  return swap(node, func, ...args);
}

export function reset(node, value) {
  return swap(node, () => value);
}

export function retain(node) {
  if (!("_count" in node)) {
    return;
  }

  if (node._count++ === 0) {
    node._setup?.();
  }
}

export function release(node) {
  if (!("_count" in node)) {
    return;
  }

  if (node._count <= 0) {
    throw Error("too many release");
  }

  if (--node._count === 0) {
    node._tearDown?.();
  }
}


class _Atom {
  _childrenSet = new Set();
  _effectsSet = new Set();

  _value = void 0;

  constructor(value) {
    this._value = value;
  }

  _updateRoot(toNext, ...args) {
    const prev = this._value;
    const next = toNext(prev, ...args);

    this._value = next;

    return { _root: this, _changed: Object.is(prev, next) };
  }

  _staleDown(effects, children) {
    for (const e of this._effectsSet) {
      effects.add(e);
    }

    for (const c of this._childrenSet) {
      children.add(c);
    }
  }
}

class _Focus {
  _childrenSet = new Set();
  _effectsSet = new Set();

  _lens = null;
  _depNode = null;

  _state = _st_disabled;
  _count = 0;
  _depValue = void 0;
  _value = void 0;

  constructor(lens, node) {
    this._lens = lens;
    this._depNode = node;
  }

  _update() {
    switch (this._state) {
      case _st_disabled:
        throw Error("disabled node");
      case _st_fresh:
        break;
      case _st_stale: {
        const dv = derefWeak(this._depNode);
        if (Object.is(dv, this._depValue)) {
          break;
        }
        this._depValue = dv;
        this._value = this._lens.view(dv);
        break;
      }
      case _st_new: {
        const dv = derefWeak(this._depNode);
        this._depValue = dv;
        this._value = this._lens.view(dv);
        break;
      }
      default:
        throw Error("unrecognized state");
    }

    this._state = _st_fresh;
  }

  _updateRoot(toNext, ...args) {
    return this._depNode._updateRoot((prevParent) => this._lens.update((prev) => toNext(prev, ...args), prevParent));
  }

  _staleDown(effects, children) {
    switch (this._state) {
      case _st_disabled:
        throw Error("disabled node");
      case _st_fresh: {
        for (const e of this._effectsSet) {
          effects.add(e);
        }

        for (const c of this._childrenSet) {
          children.add(c);
        }
        break;
      }
      case _st_stale:
      case _st_new:
        break;
      default:
        throw Error("unrecognized state");
    }

    this._state = _st_stale;
  }

  _setup() {
    const { _depNode } = this;
    this._state = _st_new;

    retain(_depNode);
    _depNode._childrenSet.add(this);
  }

  _tearDown() {
    const { _depNode } = this;
    _depNode._childrenSet.delete(this);
    release(_depNode);

    this._state = _st_disabled;
    this._count = 0;
    this._depValue = void 0;
    this._value = void 0;
  }
}

class _Effect {
  _proc = null;
  _depNodes = null;

  _state = _st_disabled;
  _count = 0;
  _depValues = null;

  constructor(proc, nodes) {
    this._proc = proc;
    this._depNodes = nodes;
  }

  _invoke() {
    switch (this._state) {
      case _st_disabled:
        throw Error("disabled node");
      case _st_fresh:
        break;
      case _st_stale: {
        const dvs = map1(derefWeak, this._depNodes);
        if (every2(Object.is, dvs, this._depValues)) {
          break;
        }
        this._depValues = dvs;
        this._proc(...dvs);
        break;
      }
      case _st_new: {
        const dvs = map1(derefWeak, this._depNodes);
        this._depValues = dvs;
        this._proc(...dvs);
        break;
      }
      default:
        throw Error("unrecognized state");
    }

    this._state = _st_fresh;
  }

  _setup() {
    const { _depNodes } = this;
    this._state = _st_new;

    forEach1((d) => {
      retain(d);
      d._childrenSet.add(this);
    }, _depNodes);
  }

  _tearDown() {
    const { _depNodes } = this;
    forEach1((d) => {
      d._childrenSet.delete(this);
      release(d);
    }, _depNodes);

    this._state = _st_disabled;
    this._count = 0;
    this._depValues = null;
  }
}









class _Observable {
  __listeners = {};

  _on(listeners) {
    const news = typeof listeners === "function" ? listeners() : listeners;
    this.__listeners = { ...this.__listeners, ...news };
    return this;
  }
}

class _RC extends _Observable {
  __count = 0;

  _retain() {
    if (this.__count++ === 0) {
      this.__listeners._init?.();
    }
  }

  _release() {
    if (this.__count === 0) {
      throw Error("too many release");
    }
    if (--this.__count === 0) {
      this.__listeners._final?.();
    }
  }
}

class _Children extends _Observable {
  __nodes = new Set();

  _get() {
    return this.__nodes.values();
  }

  _regisger(node) {
    const { __nodes } = this;
    if (__nodes.has(node)) {
      return;
    }
    __nodes.add(node);
    this.__listeners._register?.(node);
  }

  _remove(node) {
    const { __nodes } = this;
    if (!__nodes.has(node)) {
      return;
    }
    this.__listeners._remove?.(node);
    __nodes.delete(node);
  }

  _clear() {
    this.__nodes.forEach((c) => this._remove(c));
  }
}

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Stm extends _Observable {
  __state = _st_disabled;

  _start() {
    switch (this.__state) {
      case _st_disabled: {
        this.__state = _st_new;
        this.__listeners._start?.();
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
        return this.__listeners._skipRefresh?.();
      }
      case _st_stale: {
        this.__state = _st_fresh;
        return this.__listeners._refresh?.();
      }
      case _st_new: {
        this.__state = _st_fresh;
        return this.__listeners._activate?.();
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
        return this.__listeners._stale?.();
      }
      case _st_stale:
      case _st_new: {
        return this.__listeners._skipStale?.();
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
        this.__listeners._dispose?.();
      }
    }
  }
}

class _Deps {
  _nodes = [];
  _values = [];

  constructor(nodes) {
    this._nodes = nodes;
  }

  _collect() {
    const values = map1((n) => n._deref(), this._nodes);
    this._values = values;
    return values;
  }

  _recollect() {
    const values = map1((n) => n._deref(), this._nodes);
    const changed = !every2(Object.is, this._values, values);
    if (changed) {
      this._values = values;
      return true;
    }
    return false;
  }

  _clearValues() {
    this._values = [];
  }
}

export class Atom {
  constructor(init) {
    this._children = new _Children();
    this._value = init;
  }

  _deref() {
    return this._value;
  }

  _swap(func, ...args) {
    const { _value } = this;
    const next = func(_value, ...args);

    if (Object.is(_value, next)) {
      return _value;
    }

    this._value = next;

    const effs = new Set(_staleAndCollectEffects(this._children._get()));
    effs.forEach((eff) => eff._invoke());

    return next;
  }

  _regChild(sigNode) {
    return this._children._regisger(sigNode);
  }

  _removeChild(sigNode) {
    return this._children._remove(sigNode);
  }
}

export class Track {
  _stm = new _Stm()._on(() => ({
    _deps: this._deps,

    _start() {
      forEach1((node) => node._regChild(this), this._deps._nodes);
    },

    _onActivate() {
      this._value = this._handler(...this._deps._collect());
      return this._value;
    },

    _onRefresh: () => {
      const { _deps } = this;
      if (_deps._recollect()) {
        const next = this._handler(..._deps._values);
        if (!Object.is(this._value, next)) {
          this._value = next;
        }
      }
      return this._value;
    },

    _onSkipRefresh: () => {
      return this._value;
    },

    _onStale: () => {
      return _staleAndCollectEffects(this._children._get());
    },

    _onSkipStale: function* () {
    },

    _onDispose: () => {
      const { _deps } = this;
      forEach1((sigNode) => sigNode._removeChild(this), _deps._depNodes);
      _deps._clearValues();
      this._value = void 0;
    },
  }));

  _rc = new _RC({
    _onInit: () => {
      this._stm._start();
    },

    _onFinal: () => {
      this._stm._dispose();
    },
  });

  _children = new _Children({
    _onRegister: () => {
      this._retain();
    },

    _onRemove: () => {
      this._release();
    },
  });

  _deps = null;
  _handler = null;
  _value = void 0;

  constructor(handler, depNodes) {
    this._deps = new _Deps(depNodes);
    this._handler = handler;
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

  _regChild(node) {
    this._children._regisger(node);
  }

  _removeChild(node) {
    this._children._remove(node);
  }
}

export class Focus {
  _stm = new _Stm({
    _onStart: () => {
      this._deps._depNodes[0]._regChild(this);
    },

    _onActivate: () => {
      this._value = this._lens.ref(this._deps._collect()[0]);
      return this._value;
    },

    _onRefresh: () => {
      const { _deps } = this;
      if (_deps._recollect()) {
        const next = this._lens.ref(_deps._values[0]);
        if (!Object.is(this._value, next)) {
          this._value = this._lens.ref(_deps._values[0]);
        }
      }
      return this._value;
    },

    _onSkipRefresh: () => {
      return this._value;
    },

    _onStale: () => {
      return _staleAndCollectEffects(this._children._get());
    },

    _onSkipStale: function* () {
    },

    _onDispose: () => {
      const { _deps } = this;
      _deps._depNodes[0]._removeChild(this);
      _deps._clearValues();
      this._value = void 0;
    },
  });

  _rc = new _RC({
    _onInit: () => {
      this._stm._start();
    },

    _onFinal: () => {
      this._stm._dispose();
    },
  });

  _children = new _Children({
    _onRegister: () => {
      this._retain();
    },

    _onRemove: () => {
      this._release();
    },
  });

  _deps = null;
  _lens = null;
  _value = void 0;

  constructor(lens, depNode) {
    this._deps = new _Deps([depNode]);
    this._lens = lens;
  }

  _deref() {
    this._stm._refresh();
    return this._value;
  }

  _swap(func, ...args) {
    const { _lens } = this;
    const parentValue = this._deps._depNodes[0]._swap((dep) => _lens.upd(dep, func(_lens.ref(dep), ...args)));
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
    this._children._regisger(sigNode);
  }

  _removeChild(sigNode) {
    this._children._remove(sigNode);
  }
}

export class Effect {
  _stm = new _Stm({
    _onStart: () => {
      forEach1((sigNode) => sigNode._regChild(this), this._deps._depNodes);
      this._invoke();
    },

    _onActivate: () => {
      this._cleanup = this._handler(...this._deps._collect());
    },

    _onRefresh: () => {
      const { _deps } = this;
      if (_deps._recollect()) {
        this._cleanup?.();
        this._cleanup = this._handler(..._deps._values);
      }
    },

    _onStale: function* () {
      yield this;
    },

    _onSkipStale: function* () {
    },

    _onDispose: () => {
      this._cleanup?.();
      const { _deps } = this;
      forEach1((sigNode) => sigNode._removeChild(this), _deps._depNodes);
      _deps._clearValues();
    },
  });

  _rc = new _RC({
    _onInit: () => {
      this._stm._start();
    },

    _onFinal: () => {
      this._stm._dispose();
    },
  });

  _deps = null;
  _handler = null;
  _cleanup = void 0;

  constructor(handler, depNodes) {
    this._deps = new _Deps(depNodes);
    this._handler = handler;
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
}

function* _staleAndCollectEffects(sigNodes) {
  for (const n of sigNodes) {
    yield* n._stale();
  }
}
