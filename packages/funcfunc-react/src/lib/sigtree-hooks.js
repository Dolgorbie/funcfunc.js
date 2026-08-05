import { pathLens } from "funcfunc/lens";
import { atom, deref, effect, focus, release, retain, track } from "funcfunc/sigtree";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export function useAtom(init) {
  const [atm] = useState(() => atom(typeof init === "function" ? init() : init));
  return atm;
}

export function useFastValue(atm) {
  const prevAtomRef = useRef();
  const [value, setValue] = useState();
  const eff = useMemo(() => effect((value) => setValue(() => value), atm), [atm]);

  useEffect(() => {
    retain(eff);
    return () => {
      release(eff);
    };
  }, [eff]);

  if (prevAtomRef.current === void 0 || prevAtomRef.current !== atm) {
    prevAtomRef.current = atm;
    return deref(atm);
  }

  return value;
}

export function useValue(atm) {
  const subscribe = useCallback((listen) => {
    const eff = effect(listen, atm);
    retain(eff);
    return () => {
      release(eff);
    };
  }, [atm]);

  const getSnapshot = useCallback(() => deref(atm), [atm]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useTrack(handler, depNodes) {
  const node = useMemo(() => track(handler, ...depNodes), [handler, ...depNodes]);

  useEffect(() => {
    retain(node);
    return () => {
      release(node);
    };
  }, [node]);

  return node;
}

export function useFocus(lns, node) {
  const fc = useMemo(() => focus(lns, node), [lns, node]);

  useEffect(() => {
    retain(fc);
    return () => {
      release(fc);
    };
  }, [fc]);

  return fc;
}

export function usePathFocus(node, depPaths) {
  const fc = useMemo(() => focus(pathLens(...depPaths), node), [node, ...depPaths]);

  useEffect(() => {
    retain(fc);
    return () => {
      release(fc);
    };
  }, [fc]);

  return fc;
}
