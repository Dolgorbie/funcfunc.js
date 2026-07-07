import { every2, map1, reverseIter } from "./arrays";
import { is } from "./asfunc";
import { upd, view } from "./lens";

const _st_disabled = 0;
const _st_fresh = 1;
const _st_stale = 2;
const _st_new = 2;

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
    this.__initProcs = new Map();
    this.__finalProcs = [];
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

  _addInit(callback, thisArg = void 0) {
    if (this.__count === 0) {
      throw Error("event listeners can be accepted before this retained.");
    }
    this.__initProcs.set(callback, [callback, thisArg]);
  }

  _remInit(callback) {
    if (this.__count === 0) {
      throw Error("event listeners can be removed before this retained.");
    }
    this.__initProcs.delete(callback);
  }

  __setup() {
    for (const [proc, thisArg] of this.__initProcs.values()) {
      const finalProc = proc.call(thisArg);
      if (typeof finalProc === "function") {
        this.__finalProcs.push([finalProc, thisArg]);
      }
    }
  }

  __cleanup() {
    for (const [proc, thisArg] of reverseIter(this.__finalProcs)) {
      proc.call(thisArg);
    }
    this.__finalProcs = [];
  }
}

class _SigContainer {
  constructor() {
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
    this.__children.add(sigNode);
  }

  _remChild(sigNode) {
    this.__children.delete(sigNode);
  }

  _clearChildren() {
    this.__children = new Set();
  }

  _regEff(eff) {
    this.__effects.add(eff);
  }

  _remEff(eff) {
    this.__effects.delete(eff);
  }

  _clearEffs() {
    this.__effects = new Set();
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

    return [next, true];
  }

  _regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
  }

  _remChild(sigNode) {
    this._sigContainer._remChild(sigNode);
  }

  _regEff(eff) {
    this._sigContainer._regEff(eff);
  }

  _remEff(eff) {
    this._sigContainer._remEff(eff);
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
    this._state = _st_disabled;
    this._depValues = [];
    this._value = void 0;

    this._rc._addInit(this._setup, this);
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
        const depValues = map1((sigNode) => sigNode._deref(), this._depNodes);

        const changed = !every2((prev, next) => Object.is(prev, next), this._depValues, depValues);
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
        const depValues = map1((node) => node._deref(), this._depNodes);
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

  _setup() {
    this._depNodes.forEach((sigNode) => sigNode._regChild(this));
    return this._cleanup;
  }

  _cleanup() {
    this._depNodes.forEach((sigNode) => sigNode._remChild(this));
  }

  _regChild(sigNode) {
    this._sigContainer._regChild(sigNode);
    this._rc._retain();
  }

  _remChild(sigNode) {
    this._rc._release()
    this._sigContainer._remChild(sigNode);
  }

  _regEff(eff) {
    this._sigContainer._regEff(eff);
    this._rc._retain();
  }

  _remEff(eff) {
    this._rc._release();
    this._sigContainer._remEff(eff);
  }
}


export class Focus extends _InterNode {
  constructor(lns, depNode) {
    super();
    this._lens = lns;
    this._depNode = depNode;
    this._meta = { _state: "disabled" };
  }

  _deref() {
    return this._update();
  }

  _swap(swapper) {
    const { _lens } = this;
    const [, changed] = this._depNode._swap((dep) => upd(_lens, dep, swapper(view(_lens, dep))));

    return [this._update(), changed];
  }

  _update() {
    const { _meta } = this;

    switch (_meta._state) {
      case "disabled": {
        throw Error("disabled focus");
      }
      case "fresh": {
        break;
      }
      case "stale": {
        const depValue = this._depNode._deref();

        if (!is(_meta._depValue, depValue)) {
          _meta._depValue = depValue;
          const next = view(this._lens, depValue);
          if (!is(_meta._value, next)) {
            _meta._value = next;
          }
        }
        break;
      }
      default: {
        const depValue = this._depNode._deref();
        const value = view(this._lens, depValue);
        _meta._depValue = depValue;
        _meta._value = value;
        break;
      }
    }
    _meta._state = "fresh";
    return _meta._value;
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
