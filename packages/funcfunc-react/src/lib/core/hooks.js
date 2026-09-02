import { cmp, methodF, newF, pa, pipe, refF, xpa } from "funcfunc/core";
import { useMemo, useState } from "react";

export function useMethodF(method) {
  return useMemo(() => methodF(method), [method]);
}


export function useRefF(methodName) {
  return useMemo(() => refF(methodName), [methodName]);
}

export function useNewF(methodName) {
  return useMemo(() => newF(methodName), [methodName]);
}

export function usePa(proc, ...args) {
  const [argsLength] = useState(args.length);
  if (argsLength !== args.length) {
    throw Error("expects number of args be constant");
  }

  const memoArgs = useMemo(() => args, args);
  return useMemo(() => pa(proc, ...memoArgs), [proc, memoArgs]);
}

export function useXpa(proc, ...args) {
  const [argsLength] = useState(args.length);
  if (argsLength !== args.length) {
    throw Error("expects number of args be constant");
  }

  const memoArgs = useMemo(() => args, args);
  return useMemo(() => xpa(proc, ...memoArgs), [proc, memoArgs]);
}

export function usePipe(...procs) {
  const [procsLength] = useState(procs.length);
  if (procsLength !== procs.length) {
    throw Error("expects number of procs be constant");
  }

  return useMemo(() => pipe(...procs), procs);
}

export function useCmp(...procs) {
  const [procsLength] = useState(procs.length);
  if (procsLength !== procs.length) {
    throw Error("expects number of procs be constant");
  }

  return useMemo(() => cmp(...procs), procs);
}
