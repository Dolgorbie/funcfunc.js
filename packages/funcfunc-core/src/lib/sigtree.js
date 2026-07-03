import { is } from "./asfunc";
import { upd, view } from "./lens";

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

class _Node {
  constructor() {
    this._children = new Set();
    this._effects = new Set();
  }

  _regChild(node) {
    this._children.add(node);
  }

  _remChild(node) {
    this._children.delete(node);
  }

  _regEff(eff) {
    this._effects.add(eff);
  }

  _remEff(eff) {
    this._effects.delete(eff);
  }
}

class _InterNode extends _Node {
  constructor() {
    super();
    this._count = 0;
    this._meta = { _state: "disabled" };
  }

  _setup() {
    this._meta = { _state: "new" };
  }

  _cleanup() {
    this._meta = { _state: "disabled" };
  }

  _retain() {
    if (this._count++ === 0) {
      this._setup();
    }
  }

  _release() {
    if (--this._count === 0) {
      this._cleanup();
    }
  }

  *_stale() {
    switch (this._meta._state) {
      case "disabled": {
        throw Error("disabled");
      }
      case "stale": {
        break;
      }
      default: {
        this._meta._state = "stale";
        yield* this._effects;
        for (const c of this._children) {
          yield* c._stale();
        }
      }
    }
  }

  _regChild(node) {
    super._regChild(node);
    this._retain();
  }

  _remChild(node) {
    this._release();
    super._remChild(node);
  }

  _regEff(eff) {
    super._regEff(eff);
    this._retain();
  }

  _remEff(eff) {
    this._release();
    super._remEff(eff);
  }
}

export class Atom extends _Node {
  constructor(init) {
    super();
    this._value = init;
  }

  _deref() {
    return this._value;
  }

  _swap(swapper) {
    const { _value } = this;
    const next = swapper(_value);

    if (is(_value, next)) {
      return [_value, false];
    }

    this._value = next;

    const effects = new Set(_staleAndCollectEffects(this._children, this._effects));

    effects.forEach((eff) => eff._invoke());

    return [next, true];
  }
}

function* _staleAndCollectEffects(nodes, effects) {
  yield* effects;

  for (const n of nodes) {
    yield* n._stale();
  }
}


export class Track extends _InterNode {
  constructor(handler, depNodes) {
    super();
    this._handler = handler;
    this._depNodes = depNodes;
    this._meta = { _state: "disabled" };
  }

  _deref() {
    return this._update();
  }

  _update() {
    const { _meta } = this;

    switch (_meta._state) {
      case "disabled": {
        throw Error("disabled track");
      }
      case "fresh": {
        break;
      }
      case "stale": {
        const depValues = this._depNodes.map((node) => node._deref());

        const changed = !_meta._depValues.every((prev, i) => is(prev, depValues[i]));
        if (changed) {
          _meta._depValues = depValues;
          const next = this._handler(...depValues);
          if (!is(_meta._value, next)) {
            _meta._value = next;
          }
        }
        break;
      }
      default: {
        const depValues = this._depNodes.map((node) => node._deref());
        const value = this._handler(...depValues);
        _meta._depValues = depValues;
        _meta._value = value;
        break;
      }
    }
    _meta._state = "fresh";
    return _meta._value;
  }

  _setup() {
    super._setup();
    this._depNodes.forEach((n) => n._regChild(this));
  }

  _cleanup() {
    this._depNodes.forEach((n) => n._remChild(this));
    super._cleanup();
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
