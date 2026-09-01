import { every2, forEach1, map1 } from "./sequence/array-utils";

export function atom(init) {
  return new _Atom(init);
}

export function focus(lns, node) {
  return new _Focus(lns, node);
}

export function track(handler, ...nodes) {
  return new _Track(handler, nodes);
}

export function effect(handler, ...nodes) {
  return new _Effect(handler, nodes);
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
    const effects = new Set(_root._effectSet);
    _staleAll(effects, _root._childSet);
    for (const e of effects) {
      e._invoke();
    }
  }
  const res = derefWeak(node);

  release(node);
  return res;
}

function _staleAll(effects, children) {
  if (children.size === 0) {
    return;
  }

  const nextChildren = new Set();

  for (const target of children) {
    switch (target._state) {
      case _st_disabled:
        throw Error("disabled node");
      case _st_fresh: {
        for (const e of target._effectSet) {
          effects.add(e);
        }
        for (const c of target._childSet) {
          nextChildren.add(c);
        }
        target._state = _st_stale;
        break;
      }
      case _st_stale:
      case _st_new:
        break;
      default:
        throw Error("unrecognized state");
    }
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

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

class _Atom {
  _effectSet = new Set();
  _childSet = new Set();

  _value = void 0;

  constructor(value) {
    this._value = value;
  }

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
    return this._depNode._updateRoot((prevDepValue) => this._lens.update((prev) => toNext(prev, ...args), prevDepValue));
  }

  _setup() {
    const { _depNode } = this;
    this._state = _st_new;

    retain(_depNode);
    _depNode._childSet.add(this);
  }

  _tearDown() {
    const { _depNode } = this;
    _depNode._childSet.delete(this);
    release(_depNode);

    this._state = _st_disabled;
    this._count = 0;
    this._depValue = void 0;
    this._value = void 0;
  }
}

class _Track {
  _effectSet = new Set();
  _childSet = new Set();

  _func = null;
  _depNodes = null;

  _state = _st_disabled;
  _count = 0;
  _depValues = null;
  _value = void 0;

  constructor(func, nodes) {
    this._func = func;
    this._depNodes = nodes;
  }

  _update() {
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
        this._value = this._func(...dvs);
        break;
      }
      case _st_new: {
        const dvs = map1(derefWeak, this._depNodes);
        this._depValues = dvs;
        this._value = this._func(...dvs);
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
      d._childSet.add(this);
    }, _depNodes);
  }

  _tearDown() {
    const { _depNodes } = this;
    forEach1((d) => {
      d._childSet.delete(this);
      release(d);
    }, _depNodes);

    this._state = _st_disabled;
    this._count = 0;
    this._depValues = null;
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
      d._childSet.add(this);
    }, _depNodes);
  }

  _tearDown() {
    const { _depNodes } = this;
    forEach1((d) => {
      d._childSet.delete(this);
      release(d);
    }, _depNodes);

    this._state = _st_disabled;
    this._count = 0;
    this._depValues = null;
  }
}
