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
  node._retain?.();
  const res = node._deref();
  node._release?.();
  return res;
}

export function swap(node, func, ...args) {
  node._retain?.();
  const res = node._swap(func, ...args);
  node._release?.();
  return res;
}

export function xswap(func, node, ...args) {
  return swap(node, func, ...args);
}

export function reset(node, value) {
  return swap(node, () => value);
}

export function retain(node) {
  return node._retain();
}

export function release(node) {
  return node._release();
}

class _RC {
  __listener = null;
  __count = 0;

  constructor(listener) {
    this.__listener = listener;
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

class _Children {
  __listener = null;
  __set = new Set();

  constructor(listener) {
    this.__listener = listener;
  }

  _nodes() {
    return this.__set.values();
  }

  _regisger(sigNode) {
    const { __set: __children } = this;
    if (__children.has(sigNode)) {
      return;
    }
    __children.add(sigNode);
    this.__listener._onRegister?.(sigNode);
  }

  _remove(sigNode) {
    const { __set: __children } = this;
    if (!__children.has(sigNode)) {
      return;
    }
    this.__listener._onRemove?.(sigNode);
    __children.delete(sigNode);
  }

  _clear() {
    this.__set.forEach((c) => this._remove(c));
  }
}

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Stm {
  __listener = null;
  __state = _st_disabled;

  constructor(listener) {
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

class _Deps {
  __listener = null;
  _depNodes = [];
  _values = [];

  constructor(listener, depNodes) {
    this.__listener = listener;
    this._depNodes = depNodes;
  }

  _collect() {
    const values = map1((n) => n._deref(), this._depNodes);
    this._values = values;
    return values;
  }

  _recollect() {
    const values = map1((n) => n._deref(), this._depNodes);
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
    this._children = new _Children({});
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

    const effs = new Set(_staleAndCollectEffects(this._children._nodes()));
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
  _stm = new _Stm({
    _onStart: () => {
      forEach1((node) => node._regChild(this), this._deps._depNodes);
    },

    _onActivate: () => {
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
      return _staleAndCollectEffects(this._children._nodes());
    },

    _onSkipStale: function* () {
    },

    _onDispose: () => {
      const { _deps } = this;
      forEach1((sigNode) => sigNode._removeChild(this), _deps._depNodes);
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
      return _staleAndCollectEffects(this._children._nodes());
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
