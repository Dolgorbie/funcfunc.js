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

export function call0(proc) {
  return proc();
}

export function call1(proc, arg0) {
  return proc(arg0);
}

export function call2(proc, arg0, arg1) {
  return proc(arg0, arg1);
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

export function apply(proc, args) {
  return proc(...args);
}

export function xapply(args, proc) {
  return proc(...args);
}

export function refP(prop) {
  return (self) => self[prop];
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
  switch (args.length) {
    case 0: return proc;
    case 1: return pa1(proc, args[0]);
    case 2: return pa2(proc, args[0], args[1]);
    default: return _paN(proc, args);
  }
}

export function pa1(proc, arg0) {
  return (...params) => proc(arg0, ...params);
}

export function pa2(proc, arg0, arg1) {
  return (...params) => proc(arg0, arg1, ...params);
}

function _paN(proc, args) {
  return (...params) => proc(...args, ...params);
}

export function xpa(proc, ...args) {
  switch (args.length) {
    case 0: return proc;
    case 1: return xpa1(proc, args[0]);
    case 2: return xpa2(proc, args[0], args[1]);
    default: return _xpaN(proc, args);
  }
}

export function xpa1(proc, arg0) {
  return (...parans) => proc(...parans, arg0);
}

export function xpa2(proc, arg0, arg1) {
  return (...parans) => proc(...parans, arg0, arg1);
}

function _xpaN(proc, args) {
  return (...params) => proc(...params, ...args);
}

export function pipe(proc0, ...procs) {
  switch (procs.length) {
    case 0: return proc0;
    case 1: return pipe2(proc0, procs[0]);
    default: return _pipeN(proc0, procs);
  }
}

export function pipe2(proc0, proc1) {
  return (...args) => proc1(proc0(...args));
}

function _pipeN(proc0, procs) {
  return (...args) => {
    const { length } = procs;
    let res = proc0(...args);
    for (let i = 0; i < length; ++i) {
      res = procs[i](res);
    }
    return res;
  };
}

export function cmp(proc0, ...procs) {
  switch (procs.length) {
    case 0: return proc0;
    case 1: return cmp2(proc0, procs[0]);
    default: return _cmpN(proc0, procs);
  }
}

export function cmp2(proc0, proc1) {
  return (arg) => proc0(proc1(arg));
}

function _cmpN(proc0, procs) {
  const { length } = procs;
  let res = proc0;
  for (let i = 0; i < length; ++i) {
    res = cmp2(res, procs[i]);
  }
  return res;
}

export function ctiv(proc, ...args) {
  switch (args.length) {
    case 0: return ctiv0(proc);
    case 1: return ctiv1(proc, args[0]);
    case 2: return ctiv2(proc, args[0], args[1]);
    default: return _ctivN(proc, args);
  }
}

export function ctiv0(proc) {
  return (cont) => cont(proc());
}

export function ctiv1(proc, arg0) {
  return (cont) => cont(proc(arg0));
}

export function ctiv2(proc, arg0, arg1) {
  return (cont) => cont(proc(arg0, arg1));
}

function _ctivN(proc, args) {
  return (cont) => cont(proc(...args));
}

export function ctivSplice(proc, ...args) {
  switch (args.length) {
    case 0: return ctivSplice0(proc);
    case 1: return ctivSplice1(proc, args[0]);
    case 2: return ctivSplice2(proc, args[0], args[1]);
    default: return _ctivSpliceN(proc, args);
  }
}

export function ctivSplice0(proc) {
  return (cont) => cont(...proc());
}

export function ctivSplice1(proc, arg0) {
  return (cont) => cont(...proc(arg0));
}

export function ctivSplice2(proc, arg0, arg1) {
  return (cont) => cont(...proc(arg0, arg1));
}

function _ctivSpliceN(proc, args) {
  return (cont) => cont(...proc(...args));
}

export function bictiv(proc, ...args) {
  switch (args.length) {
    case 0: return bictiv0(proc);
    case 1: return bictiv1(proc, args[0]);
    case 2: return bictiv2(proc, args[0], args[1]);
    default: return _bictivN(proc, args);
  }
}

export function bictiv0(proc) {
  return (resolve, reject) => {
    try {
      return resolve(proc());
    } catch (error) {
      return reject(error);
    }
  };
}

export function bictiv1(proc, arg0) {
  return (resolve, reject) => {
    try {
      return resolve(proc(arg0));
    } catch (error) {
      return reject(error);
    }
  };
}

export function bictiv2(proc, arg0, arg1) {
  return (resolve, reject) => {
    try {
      return resolve(proc(arg0, arg1));
    } catch (error) {
      return reject(error);
    }
  };
}

function _bictivN(proc, args) {
  return (resolve, reject) => {
    try {
      return resolve(proc(...args));
    } catch (error) {
      return reject(error);
    }
  };
}

export function bictivSplice(proc, ...args) {
  switch (args.length) {
    case 0: return bictivSplice0(proc);
    case 1: return bictivSplice1(proc, args[0]);
    case 2: return bictivSplice2(proc, args[0], args[1]);
    default: return _bictivSpliceN(proc, args);
  }
}

export function bictivSplice0(proc) {
  return (resolve, reject) => {
    try {
      return resolve(...proc());
    } catch (error) {
      return reject(error);
    }
  }
}

export function bictivSplice1(proc, arg0) {
  return (resolve, reject) => {
    try {
      return resolve(...proc(arg0));
    } catch (error) {
      return reject(error);
    }
  }
}

export function bictivSplice2(proc, arg0, arg1) {
  return (resolve, reject) => {
    try {
      return resolve(...proc(arg0, arg1));
    } catch (error) {
      return reject(error);
    }
  }
}

function _bictivSpliceN(proc, args) {
  return (resolve, reject) => {
    try {
      return resolve(...proc(...args));
    } catch (error) {
      return reject(error);
    }
  }
}

export function not(pred) {
  return (...args) => !pred(...args);
}

export function and(pred0, ...preds) {
  switch (preds.length) {
    case 0: return pred0;
    case 1: return and2(pred0, preds[0]);
    default: return _andN(pred0, preds);
  }
}

export function and2(pred0, pred1) {
  return (...args) => pred0(...args) && pred1(...args);
}

function _andN(pred0, preds) {
  return (...args) => {
    const { length } = preds;
    let res = pred0(...args);
    for (let i = 0; i < length; ++i) {
      if (!res) {
        break;
      }
      res = preds[i](...args);
    }
    return res;
  };
}


export function or(pred0, ...preds) {
  switch (preds.length) {
    case 0: return pred0;
    case 1: return or2(pred0, preds[0]);
    default: return _orN(pred0, preds);
  }
}

export function or2(pred0, pred1) {
  return (...args) => pred0(...args) || pred1(...args);
}

function _orN(pred0, preds) {
  return (...args) => {
    const { length } = preds;
    let res = pred0(...args);
    for (let i = 0; i < length; ++i) {
      if (res) {
        break;
      }
      res = preds[i](...args);
    }
    return res;
  };
}
