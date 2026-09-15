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

export class OpBase {
  op = null;

  constructor(op) {
    this.op = op;
  }

  rf(acc, value) {
    return this.op.rf(acc, value);
  }

  opend(result) {
    return this.op.opend(result);
  }
}

// splicing ================

export function takeTS(count) {
  return (op) => {
    return new _TakeOp(op, count);
  };
}

class _TakeOp extends OpBase {
  _count = 0;
  _i = 0;

  constructor(op, count) {
    super(op);
    this._count = count;
  }

  rf(acc, value) {
    if (this._i >= this._count) {
      stop();
    }
    this._i += 1;
    return this.op.rf(acc, value);
  }
}

export function dropTS(count) {
  return (op) => {
    return _DropOp(op, count);
  };
}

class _DropOp extends OpBase {
  _count = 0;
  _i = 0;

  constructor(op, count) {
    super(op);
    this._count = count;
  }

  rf(acc, value) {
    if (this._i < this._count) {
      this._i += 1;
      return acc;
    }
    return this.op.rf(acc, value);
  }
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

export function transduce(xform, op, init, iter) {
  const operator = xform(op);
  let acc = init;

  try {
    for (const v of iter) {
      acc = operator.rf(acc, v);
    }
    stop();
  } catch (error) {
    if (!isStopped(error)) {
      throw error;
    }
    return operator.opend(acc);
  }
}

export function toList(xform, iter) {
  return transduce(xform, _ToListOp._singleton, nil, iter);
}

class _ToListOp extends OpBase {
  static _singleton = new _ToListOp();

  constructor() {
    super(null);
  }

  rf(acc, value) {
    return cons(value, acc);
  }

  opend(result) {
    return lreverseI(result);
  }
}
