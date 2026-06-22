const _lazyTag = Symbol("lazy");
const _eagerTag = Symbol("eager");

export class Delayed {
  constructor(content) {
    this._content = content;
  }

  static resolve(value) {
    return new Delayed({ _type: _eagerTag, _payload: value });
  }
}

export function isDelayed(x) {
  return x instanceof Delayed;
}

export function force(delayed) {
  while (delayed._content._type === _lazyTag) {
    const dIn = delayed._content._payload();
    if (delayed._content._type === _lazyTag) {
      delayed._content._type = dIn._content._type;
      delayed._content._payload = dIn._content._payload;
      dIn._content = delayed._content;
    }
  }

  return delayed._content._payload;
}

export function delayForce(thunk) {
  return _delayForce(() => {
    const result = thunk();
    if (isDelayed(result)) {
      return result;
    }
    throw TypeError(`expects delayed, but got: ${result}`);
  });
}

export function delay(thunk) {
  return _delayForce(() => Delayed.resolve(thunk()));
}

export function map(proc, ...delayeds) {
  return delay(() => {
    const { length } = delayeds;
    const values = new Array(length);
    for (let i = 0; i < length; ++i) {
      values[i] = force(delayeds[i]);
    }
    return proc(...values);
  });
}

export function forEach(proc, ...delayeds) {
  const { length } = delayeds;
  const values = new Array(length);
  for (let i = 0; i < length; ++i) {
    values[i] = force(delayeds[i]);
  }
  proc(...values);
}

export function flatMap(proc, ...delayeds) {
  return delayForce(() => {
    const { length } = delayeds;
    const values = new Array(length);
    for (let i = 0; i < length; ++i) {
      values[i] = force(delayeds[i]);
    }
    return proc(...values);
  });
}

function _delayForce(thunk) {
  return new Delayed({ _type: _lazyTag, _payload: thunk });
}
