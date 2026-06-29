// core ================

const _end = Symbol("end of transducing");

export function stop() {
  return _end;
}

export function isStopped(value) {
  return _end === value;
}

// runner ================

export function transduce(xform, rf, init, iter) {
  const proc = xform(rf);
  for (const v of iter) {
    const res = proc(init, v);
    if (isStopped(res)) {
      break;
    }
    init = res;
  }
  return init;
}

// splicing ================

export function takeTS(count) {
  return (rf) => {
    let i = 0;

    return (acc, value) => {
      if (i >= count) {
        return _end;
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
    for (const value of iter) {
      if (isStopped(value)) {
        return _end;
      }
      acc = rf(acc, value);
    }
    return acc;
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
    return _end;
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
    for (const v of proc(value)) {
      acc = rf(acc, v);
    }
    return acc;
  }
}
