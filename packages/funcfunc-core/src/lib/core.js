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

export function curry21(proc) {
  return (arg0) => (args1) => proc(arg0, args1);
}

export function curry2N(proc) {
  return (arg0) => (...arg1) => proc(arg0, ...arg1);
}

export function curry31(proc) {
  return (arg0) => (arg1) => (arg2) => proc(arg0, arg1, arg2);
}

export function curry3N(proc) {
  return (arg0) => (arg1) => (...args) => proc(arg0, arg1, ...args);
}

export function uncurry21(proc) {
  return (arg0, arg1) => proc(arg0)(arg1);
}

export function uncurry2N(proc) {
  return (arg0, ...args) => proc(arg0)(...args);
}

export function uncurry31(proc) {
  return (arg0, arg1, arg2) => proc(arg0)(arg1)(arg2);
}

export function uncurry3N(proc) {
  return (arg0, arg1, ...args) => proc(arg0)(arg1)(...args);
}

export function pa(proc, ...args) {
  switch (args.length) {
    case 0: return proc;
    case 1: return pa1N(proc, args[0]);
    case 2: return pa2N(proc, args[0], args[1]);
    case 3: return pa3N(proc, args[0], args[1], args[2]);
    default: return _paNN(proc, args);
  }
}

export function pa11(proc, arg0) {
  return (param0) => proc(arg0, param0);
}

export function pa12(proc, arg0) {
  return (param0, param1) => proc(arg0, param0, param1);
}

export function pa13(proc, arg0) {
  return (param0, param1, param2) => proc(arg0, param0, param1, param2);
}

export function pa1N(proc, arg0) {
  return (...params) => proc(arg0, ...params);
}

export function pa21(proc, arg0, arg1) {
  return (param0) => proc(arg0, arg1, param0);
}

export function pa22(proc, arg0, arg1) {
  return (param0, param1) => proc(arg0, arg1, param0, param1);
}

export function pa23(proc, arg0, arg1) {
  return (param0, param1, param2) => proc(arg0, arg1, param0, param1, param2);
}

export function pa2N(proc, arg0, arg1) {
  return (...params) => proc(arg0, arg1, ...params);
}

export function pa31(proc, arg0, arg1, arg2) {
  return (param0) => proc(arg0, arg1, arg2, param0);
}

export function pa32(proc, arg0, arg1, arg2) {
  return (param0, param1) => proc(arg0, arg1, arg2, param0, param1);
}

export function pa33(proc, arg0, arg1, arg2) {
  return (param0, param1, param2) => proc(arg0, arg1, arg2, param0, param1, param2);
}

export function pa3N(proc, arg0, arg1, arg2) {
  return (...params) => proc(arg0, arg1, arg2, ...params);
}

export function paN1(proc, ...args) {
  return (param0) => proc(...args, param0);
}

export function paN2(proc, ...args) {
  return (param0, param1) => proc(...args, param0, param1);
}

export function paN3(proc, ...args) {
  return (param0, param1, param2) => proc(...args, param0, param1, param2);
}

function _paNN(proc, args) {
  return (...params) => proc(...args, ...params);
}

export function xpa(proc, ...args) {
  switch (args.length) {
    case 0: return proc;
    case 1: return xpa1N(proc, args[0]);
    case 2: return xpa2N(proc, args[0], args[1]);
    case 3: return xpa3N(proc, args[0], args[1], args[2]);
    default: return _xpaNN(proc, args);
  }
}

export function xpa11(proc, arg0) {
  return (param0) => proc(param0, arg0);
}

export function xpa12(proc, arg0) {
  return (param0, params1) => proc(param0, params1, arg0);
}

export function xpa13(proc, arg0) {
  return (param0, params1, param2) => proc(param0, params1, param2, arg0);
}

export function xpa1N(proc, arg0) {
  return (...parans) => proc(...parans, arg0);
}

export function xpa21(proc, arg0, arg1) {
  return (param0) => proc(param0, arg0, arg1);
}

export function xpa22(proc, arg0, arg1) {
  return (param0, params1) => proc(param0, params1, arg0, arg1);
}

export function xpa23(proc, arg0, arg1) {
  return (param0, params1, param2) => proc(param0, params1, param2, arg0, arg1);
}

export function xpa2N(proc, arg0, arg1) {
  return (...parans) => proc(...parans, arg0, arg1);
}

export function xpa31(proc, arg0, arg1, arg2) {
  return (param0) => proc(param0, arg0, arg1, arg2);
}

export function xpa32(proc, arg0, arg1, arg2) {
  return (param0, params1) => proc(param0, params1, arg0, arg1, arg2);
}

export function xpa33(proc, arg0, arg1, arg2) {
  return (param0, params1, param2) => proc(param0, params1, param2, arg0, arg1, arg2);
}

export function xpa3N(proc, arg0, arg1, arg2) {
  return (...parans) => proc(...parans, arg0, arg1, arg2);
}

export function xpaN1(proc, ...args) {
  return (param0) => proc(param0, ...args);
}

export function xpaN2(proc, ...args) {
  return (param0, params1) => proc(param0, params1, ...args);
}

export function xpaN3(proc, ...args) {
  return (param0, params1, param2) => proc(param0, params1, param2, ...args);
}

function _xpaNN(proc, args) {
  return (...params) => proc(...params, ...args);
}

export function pipe(...procs) {
  switch (procs.length) {
    case 0: return itself;
    case 1: return procs[0];
    case 2: return pipe2N(procs[0], procs[1]);
    case 3: return pipe3N(procs[0], procs[1], procs[2]);
    default: return _pipeNN(procs);
  }
}

export function pipe21(proc0, proc1) {
  return (arg0) => proc1(proc0(arg0));
}

export function pipe22(proc0, proc1) {
  return (arg0, arg1) => proc1(proc0(arg0, arg1));
}

export function pipe23(proc0, proc1) {
  return (arg0, arg1, arg2) => proc1(proc0(arg0, arg1, arg2));
}

export function pipe2N(proc0, proc1) {
  return (...args) => proc1(proc0(...args));
}

export function pipe31(proc0, proc1, proc2) {
  return (arg0) => proc2(proc1(proc0(arg0)));
}

export function pipe32(proc0, proc1, proc2) {
  return (arg0, arg1) => proc2(proc1(proc0(arg0, arg1)));
}

export function pipe33(proc0, proc1, proc2) {
  return (arg0, arg1, arg2) => proc2(proc1(proc0(arg0, arg1, arg2)));
}

export function pipe3N(proc0, proc1, proc2) {
  return (...args) => proc2(proc1(proc0(...args)));
}

export function pipeN1(...procs) {
  const { length } = procs;
  if (length === 0) {
    return itself;
  }
  return (arg0) => {
    let res = arg0;
    for (let i = 0; i < length; ++i) {
      res = procs[i](res);
    }
    return res;
  };
}

export function pipeN2(...procs) {
  const { length } = procs;
  if (length === 0) {
    return itself;
  }
  return (arg0, arg1) => {
    let res = procs[0](arg0, arg1);
    for (let i = 1; i < length; ++i) {
      res = procs[i](res);
    }
    return res;
  };
}

export function pipeN3(...procs) {
  const { length } = procs;
  if (length === 0) {
    return itself;
  }
  return (arg0, arg1, arg2) => {
    let res = procs[0](arg0, arg1, arg2);
    for (let i = 1; i < length; ++i) {
      res = procs[i](res);
    }
    return res;
  };
}

function _pipeNN(procs) {
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
