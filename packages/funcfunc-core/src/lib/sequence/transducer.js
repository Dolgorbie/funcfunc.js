import { reduce1 } from "./array-utils";
import { greduce1 } from "./iterator-utils";
import { cons, lreverseI, nil } from "./list";

// core ================

class TransducerStoppedError extends Error {
  constructor(...args) {
    super(...args);
  }
}

export function stop() {
  throw new TransducerStoppedError();
}

export function isStopped(error) {
  return error instanceof TransducerStoppedError;
}

// splicing ================

export function takeTS(count) {
  return ({ rf, opend }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        if (i >= count) {
          stop();
        }
        i += 1;
        return rf(acc, value);
      },

      opend,
    };
  };
}

export function dropTS(count) {
  return ({ rf, opend }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        if (i < count) {
          i += 1;
          return acc;
        }
        return rf(acc, value);
      },

      opend,
    };
  };
}

// composition ================

export function flatT() {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      return greduce1((acc, value) => rf(acc, value), acc, value);
    },

    opend,
  });
}

export function entriesTS() {
  return ({ rf, opend }) => {
    let i = 0;
    return {
      rf: (acc, value) => {
        return rf(acc, [i++, value]);
      },

      opend,
    };
  };
}

// filtering ================

export function filterT(pred) {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      if (pred(value)) {
        return rf(acc, value);
      }
      return acc;
    },

    opend,
  });
}

export function findTailTS(pred) {
  return ({ rf, opend }) => {
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

      opend,
    };
  };
}

export function takeWhileT(pred) {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      if (pred(value)) {
        return rf(acc, value);
      }
      stop();
    },

    opend,
  });
}

export function dropWhileTS(pred) {
  return ({ rf, opend }) => {
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

      opend,
    };
  };
}

export function uniqueTS() {
  return ({ rf, opend }) => {
    const appeared = new Set();
    return {
      rf: (acc, value) => {
        if (appeared.has(value)) {
          return acc;
        }
        appeared.add(value);
        return rf(acc, value);
      },

      opend,
    };
  };
}

// mapping ================

export function mapT(proc) {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      return rf(acc, proc(value));
    },

    opend,
  });
}

export function flatMapT(proc) {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      return reduce1(rf, acc, proc(value));
    },

    opend,
  });
}

export function mapMulti(proc) {
  return ({ rf, opend }) => ({
    rf: (acc, value) => {
      const tmp = [];

      const add = (v) => {
        tmp.push(v);
      };

      proc(add, value);
      return reduce1(rf, acc, tmp);
    },

    opend,
  });
}

// reduction ================

export function transduce(xform, op, init, iter) {
  const operator = xform(op);
  let acc = init;

  try {
    for (const v of iter) {
      acc = operator.rf(acc, v);
    }
    return operator.opend(acc);
  } catch (error) {
    if (!isStopped(error)) {
      throw error;
    }
    return operator.opend(acc);
  }
}

export function toArray(xform, iter) {
  return transduce(xform, _toArrayOp, nil, iter);
}

const _toArrayOp = {
  rf: (acc, value) => {
    return cons(value, acc);
  },

  opend: (result) => {
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

  opend: (result) => {
    return lreverseI(result);
  }
};
