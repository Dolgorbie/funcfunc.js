const _call = Function.call;
const _apply = Function.apply;

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

export function mcall(proc, self, ...args) {
  return _apply.call(proc, self, args);
}

export function mcall1(proc, self, arg0) {
  return _call.call(proc, self, arg0);
}

export function mcall2(proc, self, arg0, arg1) {
  return _call.call(proc, self, arg0, arg1);
}

export function mcall3(proc, self, arg0, arg1, arg2) {
  return _call.call(proc, self, arg0, arg1, arg2);
}

export function mcall4(proc, self, arg0, arg1, arg2, arg3) {
  return _call.call(proc, self, arg0, arg1, arg2, arg3);
}

export function xmcall(self, proc, ...args) {
  return _apply.call(proc, self, args);
}

export function xmcall1(self, proc, arg0) {
  return _call.call(proc, self, arg0);
}

export function xmcall2(self, proc, arg0, arg1) {
  return _call.call(proc, self, arg0, arg1);
}

export function xmcall3(self, proc, arg0, arg1, arg2) {
  return _call.call(proc, self, arg0, arg1, arg2);
}

export function xmcall4(self, proc, arg0, arg1, arg2, arg3) {
  return _call.call(proc, self, arg0, arg1, arg2, arg3);
}

export function apply(proc, args) {
  return proc(...args);
}

export function xapply(args, proc) {
  return proc(...args);
}

export function methodToFunc(method) {
  return _call.bind(method);
}

export function newToFunc(clazz) {
  return (...args) => new clazz(...args);
}

export function newToFunc0(clazz) {
  return () => new clazz();
}

export function newToFunc1(clazz) {
  return (arg0) => new clazz(arg0);
}

export function newToFunc2(clazz) {
  return (arg0, arg1) => new clazz(arg0, arg1);
}

export function newToFunc3(clazz) {
  return (arg0, arg1, arg2) => new clazz(arg0, arg1, arg2);
}

export function newToFunc4(clazz) {
  return (arg0, arg1, arg2, arg3) => new clazz(arg0, arg1, arg2, arg3);
}

export function curry2(proc) {
  return (arg0) => (...args) => proc(arg0, ...args);
}

export function curry21(proc) {
  return (arg0) => (arg1) => proc(arg0, arg1);
}

export function curry3(proc) {
  return (arg0) => (arg1) => (...args) => proc(arg0, arg1, ...args);
}

export function curry31(proc) {
  return (arg0) => (arg1) => (arg2) => proc(arg0, arg1, arg2);
}

export function curry4(proc) {
  return (arg0) => (arg1) => (arg2) => (...args) => proc(arg0, arg1, arg2, ...args);
}

export function curry41(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => proc(arg0, arg1, arg2, arg3);
}

export function curry5(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (...args) => proc(arg0, arg1, arg2, arg3, ...args);
}

export function curry51(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => proc(arg0, arg1, arg2, arg3, arg4);
}

export function curry6(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (...args) => proc(arg0, arg1, arg2, arg3, arg4, ...args);
}

export function curry61(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => proc(arg0, arg1, arg2, arg3, arg4, arg5);
}

export function curry7(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (...args) => proc(arg0, arg1, arg2, arg3, arg4, arg5, ...args);
}

export function curry71(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (arg6) => proc(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
}

export function curry8(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (arg6) => (...args) => proc(arg0, arg1, arg2, arg3, arg4, arg5, arg6, ...args);
}

export function curry81(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (arg6) => (arg7) => proc(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
}

export function curry9(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (arg6) => (arg7) => (...args) => proc(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, ...args);
}

export function curry91(proc) {
  return (arg0) => (arg1) => (arg2) => (arg3) => (arg4) => (arg5) => (arg6) => (arg7) => (arg8) => proc(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
}

export function pa(proc, ...args) {
  return (...params) => proc(...args, ...params);
}

export function pa1(proc, ...args) {
  return (param) => proc(...args, param);
}

export function xpa(proc, ...args) {
  return (...params) => proc(...params, ...args);
}

export function xpa1(proc, ...args) {
  return (param) => proc(param, ...args);
}

export function pipe(proc0, ...procs) {
  return (...args) => procs.reduce(xcall1, proc0(...args));
}

export function cmp(...procs) {
  return (arg) => procs.reduceRight(xcall1, arg);
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

export function and2n(pred0, pred1) {
  return (...args) => pred0(...args) && pred1(...args);
}

export function and21(pred0, pred1) {
  return (arg0) => pred0(arg0) && pred1(arg0);
}

export function and22(pred0, pred1) {
  return (arg0, arg1) => pred0(arg0, arg1) && pred1(arg0, arg1);
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

export function or2n(pred0, pred1) {
  return (...args) => pred0(...args) || pred1(...args);
}

export function or21(pred0, pred1) {
  return (arg0) => pred0(arg0) || pred1(arg0);
}

export function or22(pred0, pred1) {
  return (arg0, arg1) => pred0(arg0, arg1) || pred1(arg0, arg1);
}
