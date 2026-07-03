export function doNothing() {
}

export function itself(x) {
  return x;
}

export function constant(x) {
  return () => x;
}

export function call(proc, ...args) {
  return proc(...args);
}

export function call1(proc, arg0) {
  return proc(arg0);
}

export function call2(proc, arg0, arg1) {
  return proc(arg0, arg1);
}

export function call3(proc, arg0, arg1, arg2) {
  return proc(arg0, arg1, arg2);
}

export function call4(proc, arg0, arg1, arg2, arg3) {
  return proc(arg0, arg1, arg2, arg3);
}

export function xcall(arg0, proc, ...args) {
  return proc(arg0, ...args);
}

export function xcall1(arg0, proc) {
  return proc(arg0);
}

export function xcall2(arg0, proc, arg1) {
  return proc(arg0, arg1);
}

export function xcall3(arg0, proc, arg1, arg2) {
  return proc(arg0, arg1, arg2);
}

export function xcall4(arg0, proc, arg1, arg2, arg3) {
  return proc(arg0, arg1, arg2, arg3);
}

export function apply(proc, args) {
  return proc(...args);
}

export function xapply(args, proc) {
  return proc(...args);
}

export function methodF(method) {
  return (self, ...args) => method.call(self, ...args);
}

export function methodF0(method) {
  return (self) => method.call(self);
}

export function methodF1(method) {
  return (self, arg0) => method.call(self, arg0);
}

export function methodF2(method) {
  return (self, arg0, arg1) => method.call(self, arg0, arg1);
}

export function methodF3(method) {
  return (self, arg0, arg1, arg2) => method.call(self, arg0, arg1, arg2);
}

export function methodF4(method) {
  return (self, arg0, arg1, arg2, arg3) => method.call(self, arg0, arg1, arg2, arg3);
}

export function refF(methodName) {
  return (self, ...args) => self[methodName](...args);
}

export function refF0(methodName) {
  return (self) => self[methodName]();
}

export function refF1(methodName) {
  return (self, arg0) => self[methodName](arg0);
}

export function refF2(methodName) {
  return (self, arg0, arg1) => self[methodName](arg0, arg1);
}

export function refF3(methodName) {
  return (self, arg0, arg1, arg2) => self[methodName](arg0, arg1, arg2);
}

export function refF4(methodName) {
  return (self, arg0, arg1, arg2, arg3) => self[methodName](arg0, arg1, arg2, arg3);
}

export function newF(clazz) {
  return (...args) => new clazz(...args);
}

export function newF0(clazz) {
  return () => new clazz();
}

export function newF1(clazz) {
  return (arg0) => new clazz(arg0);
}

export function newF2(clazz) {
  return (arg0, arg1) => new clazz(arg0, arg1);
}

export function newF3(clazz) {
  return (arg0, arg1, arg2) => new clazz(arg0, arg1, arg2);
}

export function newF4(clazz) {
  return (arg0, arg1, arg2, arg3) => new clazz(arg0, arg1, arg2, arg3);
}

export function curry2(proc) {
  return (arg0) => (...args) => proc(arg0, ...args);
}

export function curry3(proc) {
  return (arg0) => (arg1) => (...args) => proc(arg0, arg1, ...args);
}

export function curry4(proc) {
  return (arg0) => (arg1) => (arg2) => (...args) => proc(arg0, arg1, arg2, ...args);
}

export function uncurry2(proc) {
  return (arg0, ...args) => proc(arg0)(...args);
}

export function uncurry3(proc) {
  return (arg0, arg1, ...args) => proc(arg0)(arg1)(...args);
}

export function uncurry4(proc) {
  return (arg0, arg1, arg2, ...args) => proc(arg0)(arg1)(arg2)(...args);
}

export function pa(proc, ...args) {
  return (...params) => proc(...args, ...params);
}

export function pa1(proc, ...args) {
  return (param0) => proc(...args, param0);
}

export function pa2(proc, ...args) {
  return (param0, param1) => proc(...args, param0, param1);
}

export function pa3(proc, ...args) {
  return (param0, param1, param2) => proc(...args, param0, param1, param2);
}

export function pa4(proc, ...args) {
  return (param0, param1, param2, param3) => proc(...args, param0, param1, param2, param3);
}

export function xpa(proc, ...args) {
  return (...params) => proc(...params, ...args);
}

export function xpa1(proc, ...args) {
  return (param0) => proc(param0, ...args);
}

export function xpa2(proc, ...args) {
  return (param0, params1) => proc(param0, params1, ...args);
}

export function xpa3(proc, ...args) {
  return (param0, params1, param2) => proc(param0, params1, param2, ...args);
}

export function xpa4(proc, ...args) {
  return (param0, params1, param2, param3) => proc(param0, params1, param2, param3, ...args);
}

export function pipe(...procs) {
  const { length } = procs;
  if (length === 0) {
    return itself;
  }
  return (...args) => {
    let res = procs[0](...args);
    for (let i = 1; i < length; ++i) {
      res = procs[i](res);
    }
    return res;
  };
}

export function cmp(...procs) {
  const { length } = procs;
  if (length === 0) {
    return itself;
  }
  return (...args) => {
    let res = procs[length - 1](...args);
    for (let i = length - 2; i >= 0; --i) {
      res = procs[i](res);
    }
    return res;
  };
}

export function not(pred) {
  return (...args) => !pred(...args);
}

export function not1(pred) {
  return (arg0) => !pred(arg0);
}

export function not2(pred) {
  return (arg0, arg1) => !pred(arg0, arg1);
}

export function not3(pred) {
  return (arg0, arg1, arg2) => !pred(arg0, arg1, arg2);
}

export function not4(pred) {
  return (arg0, arg1, arg2, arg3) => !pred(arg0, arg1, arg2, arg3);
}

export function and(...preds) {
  const n = preds.length;

  return (...args) => {
    let result = true;

    for (let i = 0; i < n; ++i) {
      result = preds[i](...args);
      if (!result) {
        return result;
      }
    }

    return result;
  };
}

export function and1(...preds) {
  const n = preds.length;

  return (arg0) => {
    let result = true;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0);
      if (!result) {
        return result;
      }
    }

    return result;
  };
}

export function and2(...preds) {
  const n = preds.length;

  return (arg0, arg1) => {
    let result = true;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1);
      if (!result) {
        return result;
      }
    }

    return result;
  };
}

export function and3(...preds) {
  const n = preds.length;

  return (arg0, arg1, arg2) => {
    let result = true;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1, arg2);
      if (!result) {
        return result;
      }
    }

    return result;
  };
}

export function and4(...preds) {
  const n = preds.length;

  return (arg0, arg1, arg2, arg3) => {
    let result = true;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1, arg2, arg3);
      if (!result) {
        return result;
      }
    }

    return result;
  };
}

export function or(...preds) {
  const n = preds.length;

  return (...args) => {
    let result = false;

    for (let i = 0; i < n; ++i) {
      result = preds[i](...args);
      if (result) {
        return result;
      }
    }

    return result;
  };
}

export function or1(...preds) {
  const n = preds.length;

  return (arg0) => {
    let result = false;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0);
      if (result) {
        return result;
      }
    }

    return result;
  };
}

export function or2(...preds) {
  const n = preds.length;

  return (arg0, arg1) => {
    let result = false;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1);
      if (result) {
        return result;
      }
    }

    return result;
  };
}

export function or3(...preds) {
  const n = preds.length;

  return (arg0, arg1, arg2) => {
    let result = false;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1, arg2);
      if (result) {
        return result;
      }
    }

    return result;
  };
}

export function or4(...preds) {
  const n = preds.length;

  return (arg0, arg1, arg2, arg3) => {
    let result = false;

    for (let i = 0; i < n; ++i) {
      result = preds[i](arg0, arg1, arg2, arg3);
      if (result) {
        return result;
      }
    }

    return result;
  };
}
