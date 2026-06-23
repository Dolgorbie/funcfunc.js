import { constant } from "./core";

export class Delayed {
  constructor(content) {
    this._content = content;
  }

  static resolve(value) {
    return new Delayed({ _isLazy: false, _thunk: constant(value), _value: value });
  }
}

export function isDelayed(x) {
  return x instanceof Delayed;
}

export function force(delayed) {
  while (delayed._content._isLazy) {
    const delayedInner = delayed._content._thunk();
    if (delayed._content._isLazy) {
      delayed._content._isLazy = delayedInner._content._isLazy;
      delayed._content._thunk = delayedInner._content._thunk;
      delayed._content._value = delayedInner._content._value;
      delayedInner._content = delayed._content;
    }
  }

  return delayed._content._value;
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

export function map(proc, delayed0, ...delayeds) {
  switch (delayeds.length) {
    case 0: {
      return map1(proc, delayed0);
    }
    case 1: {
      return map2(proc, delayed0, delayeds[0]);
    }
    default: {
      return _mapN(proc, delayed0, delayeds);
    }
  }
}

export function map1(proc, delayed0) {
  return delay(() => proc(force(delayed0)));
}

export function map2(proc, delayed0, delayed1) {
  return delay(() => proc(force(delayed0), force(delayed1)));
}

function _mapN(proc, delayed0, delayeds) {
  return delay(() => {
    const { length } = delayeds;
    const value0 = force(delayed0);
    const values = new Array(length);
    for (let i = 0; i < length; ++i) {
      values[i] = force(delayeds[i]);
    }
    return proc(value0, ...values);
  });
}

export function flatMap(proc, delayed0, ...delayeds) {
  switch (delayeds.length) {
    case 0: {
      return flatMap1(proc, delayed0);
    }
    case 1: {
      return flatMap2(proc, delayed0, delayeds[0]);
    }
    default: {
      return _flatMapN(proc, delayed0, delayeds);
    }
  }
}

export function flatMap1(proc, delayed0) {
  return delayForce(() => proc(force(delayed0)));
}

export function flatMap2(proc, delayed0, delayed1) {
  return delayForce(() => proc(force(delayed0), force(delayed1)));
}

function _flatMapN(proc, delayed0, delayeds) {
  return delayForce(() => {
    const { length } = delayeds;
    const value0 = force(delayed0);
    const values = new Array(length);
    for (let i = 0; i < length; ++i) {
      values[i] = force(delayeds[i]);
    }
    return proc(value0, ...values);
  });
}

export function forEach(proc, delayed0, ...delayeds) {
  switch (delayeds.length) {
    case 0: {
      forEach1(proc, delayed0);
      break;
    }
    case 1: {
      forEach2(proc, delayed0, delayeds[0]);
      break;
    }
    default: {
      _forEachN(proc, delayed0, delayeds);
      break;
    }
  }
}

export function forEach1(proc, delayed0) {
  proc(force(delayed0));
}

export function forEach2(proc, delayed0, delayed1) {
  proc(force(delayed0), force(delayed1));
}

function _forEachN(proc, delayed0, delayeds) {
  const { length } = delayeds;
  const value0 = force(delayed0);
  const values = new Array(length);
  for (let i = 0; i < length; ++i) {
    values[i] = force(delayeds[i]);
  }
  proc(value0, ...values);
}

function _delayForce(thunk) {
  return new Delayed({ _isLazy: true, _thunk: thunk, _value: void 0 });
}
