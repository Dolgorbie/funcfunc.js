import { every2, forEach1, map1, reverseIter } from "./arrays";
import { is } from "./asfunc";

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 3;

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
  constructor() {
    this.__count = 0;
    this.__initHooks = new Map();
    this.__finalHooks = [];
  }

  _retain() {
    if (this.__count++ === 0) {
      this.__setup();
    }
    return this;
  }

  _release() {
    if (this.__count === 0) {
      throw Error("too many release");
    }
    if (--this.__count === 0) {
      this.__cleanup();
    }
    return this;
  }

  _addInitHook(hook, thisArg = void 0) {
    this.__initHooks.set(hook, [hook, thisArg]);
  }

  _removeInitHook(hook) {
    this.__initHooks.delete(hook);
  }

  __setup() {
    for (const [hook, thisArg] of this.__initHooks.values()) {
      const newFinalHook = hook.call(thisArg);
      if (typeof newFinalHook === "function") {
        this.__finalHooks.push([newFinalHook, thisArg]);
      }
    }
  }

  __cleanup() {
    for (const [hook, thisArg] of reverseIter(this.__finalHooks)) {
      hook.call(thisArg);
    }
    this.__finalHooks = [];
  }
}

class _SigContainer {
  constructor() {
    this.__children = new Set();
    this.__effects = new Set();
    this.__regChildHooks = new Set();
    this.__regEffHooks = new Set();
    this.__removeHooks = new Map();
  }

  _children() {
    return this.__children.values();
  }

  _effects() {
    return this.__effects.values();
  }

  _regChild(sigNode) {
    this.__children.add(sigNode);
    this.__invokeRegHooks(sigNode, this.__regChildHooks);
  }

  _removeChild(sigNode) {
    this.__invokeRemoveHooks(sigNode);
    this.__children.delete(sigNode);
  }

  _clearChildren() {
    this.__children = new Set();
  }

  _regEff(eff) {
    this.__effects.add(eff);
    this.__invokeRegHooks(eff, this.__regEffHooks);
  }

  _removeEff(eff) {
    this.__invokeRemoveHooks(eff);
    this.__effects.delete(eff);
  }

  _clearEffs() {
    this.__effects = new Set();
  }

  _addRegChildHook(hook, thisArg = void 0) {
    this.__regChildHooks.add([hook, thisArg]);
  }

  _addRegEffHook(hook, thisArg = void 0) {
    this.__regEffHooks.add([hook, thisArg]);
  }

  __invokeRegHooks(nodeOrEff, regHooks) {
    for (const [hook, thisArg] of regHooks) {
      const removeHook = hook.call(thisArg, nodeOrEff);
      if (typeof removeHook === "function") {
        let removeHooksOfTheSigNode = this.__removeHooks.get(nodeOrEff);
        if (removeHooksOfTheSigNode === void 0) {
          this.__removeHooks.set(nodeOrEff, (removeHooksOfTheSigNode = []));
        }
        removeHooksOfTheSigNode.push([removeHook, thisArg]);
      }
    }
  }

  __invokeRemoveHooks(sigNode) {
    const hooks = this.__removeHooks.get(sigNode);
    if (hooks !== void 0) {
      for (const [proc, thisArg] of reverseIter(hooks)) {
        proc.call(thisArg, sigNode);
      }
      this.__removeHooks.delete(sigNode);
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

  regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  removeChild(sigNode) {
    this._sigContainer._removeChild(sigNode);
  }

  regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  removeEff(eff) {
    this._sigContainer._removeEff(eff);
  }
}

function* _staleAndCollectEffects(sigNodes, effs) {
  yield* effs;

  for (const n of sigNodes) {
    yield* n._stale();
  }
}


export class Track {
  constructor(handler, depNodes) {
    this._rc = new _RC();
    this._sigContainer = new _SigContainer();

    this._handler = handler;
    this._depNodes = depNodes;

    this._state = _st_new;
    this._depValues = [];
    this._value = void 0;

    this._rc._addInitHook(this._initHook, this);
    this._sigContainer._addRegChildHook(this._regNodeOrEffHook, this);
  }

  _deref() {
    return this._update();
  }

  _update() {
    switch (this._state) {
      case _st_disabled: {
        throw Error("disabled track");
      }
      case _st_fresh: {
        break;
      }
      case _st_stale: {
        const depValues = map1(deref, this._depNodes);

        const changed = !every2(Object.is, this._depValues, depValues);
        if (changed) {
          this._depValues = depValues;
          const next = this._handler(...depValues);
          if (!Object.is(this._value, next)) {
            this._value = next;
          }
        }
        break;
      }
      case _st_new: {
        const depValues = map1(deref, this._depNodes);
        const value = this._handler(...depValues);
        this._depValues = depValues;
        this._value = value;
        break;
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
    this._state = _st_fresh;
    return this._value;
  }

  *_stale() {
    switch (this._state) {
      case _st_disabled: {
        throw Error("disabled track");
      }
      case _st_fresh: {
        const { _sigContainer } = this;
        yield* _sigContainer._effects();
        for (const c of _sigContainer._children()) {
          yield* c._stale();
        }
        break;
      }
      case _st_stale:
      case _st_new: {
        break;
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
  }

  _retain() {
    this._rc._retain();
  }

  _release() {
    this._rc._release();
  }

  regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  removeChild(sigNode) {
    this._sigContainer._removeChild(sigNode);
  }

  regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  removeEff(eff) {
    this._sigContainer._removeEff(eff);
  }

  _initHook() {
    forEach1((sigNode) => sigNode.regChild(this), this._depNodes);
    return this._finalHook;
  }

  _finalHook() {
    forEach1((sigNode) => sigNode.removeChild(this), this._depNodes);
  }

  _regNodeOrEffHook() {
    this._retain();
    return this._removeNodeOrEffHook;
  }

  _removeNodeOrEffHook() {
    this._release();
  }
}


export class Focus {
  constructor(lens, depNode) {
    this._rc = new _RC();
    this._sigContainer = new _SigContainer();

    this._lens = lens;
    this._depNode = depNode;

    this._state = _st_new;
    this._depValue = void 0;
    this._value = void 0;
  }

  _deref() {
    return this._update();
  }

  _swap(swapper) {
    const { _lens } = this;
    const [, changed] = this._depNode._swap((dep) => _lens.upd(dep, swapper(_lens.ref(dep))));

    return [this._update(), changed];
  }

  _update() {

    switch (this._state) {
      case _st_disabled: {
        throw Error("disabled focus");
      }
      case _st_fresh: {
        break;
      }
      case _st_stale: {
        const depValue = this._depNode._deref();

        if (!Object.is(this._depValue, depValue)) {
          this._depValue = depValue;
          const next = this._lens.ref(depValue);
          if (!Object.is(this._value, next)) {
            this._value = next;
          }
        }
        break;
      }
      case _st_new: {
        const depValue = this._depNode._deref();
        const value = this._lens.ref(depValue);
        this._depValue = depValue;
        this._value = value;
        break;
      }
      default: {
        throw Error("Unrecognized state");
      }
    }
    this._state = _st_fresh;
    return this._value;
  }

  *_stale() {

  }

  _setup() {
    super._setup();
    this._depNode._regChild(this);
  }

  _cleanup() {
    this._depNode._remChild(this);
    super._cleanup();
  }
}

export class Effect {
  constructor(handler, depNodes) {
    this._count = 0;
    this._meta = { _state: "disabled" };
    this._handler = handler;
    this._depNodes = depNodes;
    this._meta = { _state: "disabled" };
  }

  _invoke() {
    const { _meta } = this;

    switch (_meta._state) {
      case "disabled": {
        throw Error("disabled effect");
      }
      case "active": {
        const depValues = this._depNodes.map((node) => node._deref());

        const changed = !_meta._depValues.every((prev, i) => is(prev, depValues[i]));
        if (changed) {
          _meta._depValues = depValues;
          this._handler(...depValues);
        }
        break;
      }
      default: {
        const depValues = this._depNodes.map((node) => node._deref());
        _meta._depValues = depValues;

        this._handler(...depValues);
        _meta._state = "active";
        break;
      }
    }
  }

  _retain() {
    if (this._count++ === 0) {
      this._meta = { _state: "new" };
      this._depNodes.forEach((n) => n._regEff(this));
    }
  }

  _release() {
    if (--this._count === 0) {
      this._depNodes.forEach((n) => n._remEff(this));
      this._meta = { _state: "disabled" };
    }
  }
}
