import { reduce1 } from "./array-utils";
import { greduce1 } from "./iterator-utils";
import { cons, lreverseI, nil } from "./list";

// core ================

class _TransducerStoppedError extends Error {
  _result;
  constructor(result) {
    super();
    this._result = result;
  }
}

export function isStopped(error) {
  return error instanceof _TransducerStoppedError;
}

// splicing ================

export function takeTS(count) {
  return ({ rf, stop }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        if (i >= count) {
          return stop(acc);
        }
        i += 1;
        return rf(acc, value);
      },

      stop,
    };
  };
}

export function dropTS(count) {
  return ({ rf, stop }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        if (i < count) {
          i += 1;
          return acc;
        }
        return rf(acc, value);
      },

      stop,
    };
  };
}

// composition ================

export function flatT() {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      return greduce1(rf, acc, value);
    },

    stop,
  });
}

export function entriesTS() {
  return ({ rf, stop }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        return rf(acc, [i++, value]);
      },

      stop,
    };
  };
}

// filtering ================

export function filterT(pred) {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      if (pred(value)) {
        return rf(acc, value);
      }
      return acc;
    },

    stop,
  });
}

export function findTailTS(pred) {
  return ({ rf, stop }) => {
    let found = false;
    return {
      rf: (acc, value) => {
        if (found) {
          return rf(acc, value);
        }
        if (pred(value)) {
          found = true;
          return rf(acc, value);
        }
        return acc;
      },

      stop,
    };
  };
}

export function takeWhileT(pred) {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      if (pred(value)) {
        return rf(acc, value);
      }
      return stop(acc);
    },

    stop,
  });
}

export function dropWhileTS(pred) {
  return ({ rf, stop }) => {
    let unmatched = false;
    return {
      rf: (acc, value) => {
        if (unmatched) {
          return rf(acc, value);
        }
        if (pred(value)) {
          return acc;
        }
        unmatched = true;
        return rf(acc, value);
      },

      stop,
    };
  };
}

export function uniqueTS() {
  return ({ rf, stop }) => {
    const appeared = new Set();
    return {
      rf: (acc, value) => {
        if (appeared.has(value)) {
          return acc;
        }
        appeared.add(value);
        return rf(acc, value);
      },

      stop,
    };
  };
}

// mapping ================

export function mapT(proc) {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      return rf(acc, proc(value));
    },

    stop,
  });
}

export function flatMapT(proc) {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      return reduce1(rf, acc, proc(value));
    },

    stop,
  });
}

export function mapMulti(proc) {
  return ({ rf, stop }) => ({
    rf: (acc, value) => {
      const tmp = [];

      const add = (v) => {
        tmp.push(v);
      };

      proc(add, value);
      return reduce1(rf, acc, tmp);
    },

    stop,
  });
}

// reduction ================

export function transduce(xform, op, init, iter) {
  const operator = xform(_finalXform(op));
  let acc = init;

  try {
    for (const v of iter) {
      acc = operator.rf(acc, v);
    }
    operator.stop(acc);
  } catch (error) {
    if (!isStopped(error)) {
      throw error;
    }
    return error._result;
  }
}

function _finalXform({ rf, stop }) {
  return {
    rf,
    stop: (acc) => {
      throw new _TransducerStoppedError(stop(acc));
    }
  }
}

export function toArray(xform, iter) {
  return transduce(xform, _toArrayOp, nil, iter);
}

const _toArrayOp = {
  rf: (acc, value) => {
    return cons(value, acc);
  },

  stop: (result) => {
    return [...result].reverse();
  }
};

export function toList(xform, iter) {
  return transduce(xform, _toListOp, nil, iter);
}

const _toListOp = {
  rf: (acc, value) => {
    return cons(value, acc);
  },

  stop: (result) => {
    return lreverseI(result);
  }
};
