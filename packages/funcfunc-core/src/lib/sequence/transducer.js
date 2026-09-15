// core ================

import { reduce1 } from "./array-utils";
import { greduce1 } from "./iterator-utils";

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
  return (rf) => {
    let i = 0;

    return (acc, value) => {
      if (i >= count) {
        stop();
      }
      i += 1;
      return rf(acc, value);
    };
  };
}

export function dropTS(count) {
  return (rf) => {
    let i = 0;

    return (acc, value) => {
      if (i < count) {
        i += 1;
        return acc;
      }
      return rf(acc, value);
    };
  };
}

// composition ================

export function flatT() {
  return (rf) => (acc, iter) => {
    return greduce1(rf, acc, iter);
  };
}

export function entriesTS() {
  return (rf) => {
    let i = 0;

    return (acc, value) => {
      return rf(acc, [i++, value]);
    };
  };
}

// filtering ================

export function filterT(pred) {
  return (rf) => (acc, value) => {
    if (pred(value)) {
      return rf(acc, value);
    }
    return acc;
  };
}

export function findTailTS(pred) {
  return (rf) => {
    let found = false;

    return (acc, value) => {
      if (found) {
        return rf(acc, value);
      }
      if (pred(value)) {
        found = true;
        return rf(acc, value);
      }
      return acc;
    };
  };
}

export function takeWhileT(pred) {
  return (rf) => (acc, value) => {
    if (pred(value)) {
      return rf(acc, value);
    }
    return stop();
  };
}

export function dropWhileTS(pred) {
  return (rf) => {
    let unmatched = false;

    return (acc, value) => {
      if (unmatched) {
        return rf(acc, value);
      }
      if (pred(value)) {
        return acc;
      }
      unmatched = true;
      return rf(acc, value);
    };
  };
}

export function uniqueTS() {
  return (rf) => {
    const appeared = new Set();

    return (acc, value) => {
      if (appeared.has(value)) {
        return acc;
      }
      appeared.add(value);
      return rf(acc, value);
    };
  };
}

// mapping ================

export function mapT(proc) {
  return (rf) => (acc, value) => {
    return rf(acc, proc(value));
  };
}

export function flatMapT(proc) {
  return (rf) => (acc, value) => {
    return reduce1(rf, acc, proc(value));
  }
}

export function mapMulti(proc) {
  return (rf) => (acc, value) => {
    const tmp = [];

    const add = (v) => {
      tmp.push(v);
    };

    proc(add, value);
    return reduce1(rf, acc, tmp);
  }
}

// reduction ================

export function transduce(xform, rf, init, iter) {
  let acc = init;
  try {
    const proc = xform(rf);
    for (const v of iter) {
      acc = proc(acc, v);
    }
    stop();
  } catch (error) {
    if (!isStopped(error)) {
      throw error;
    }
    return acc;
  }
}

export function toList(xform, iter) {

}

function _toListXform(rf) {
  return (acc, value) => {

  }
}
