import { path, view } from "funcfunc/lens";
import { atom, deref, effect, focus, release, retain, track } from "funcfunc/sigtree";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export function useAtom(init) {
  const [atm] = useState(() => atom(typeof init === "function" ? init() : init));
  return atm;
}

export function useFastValue(node) {
  const prevAtomRef = useRef(node);
  const [value, setValue] = useState(() => deref(node));
  const eff = useMemo(() => effect((value) => setValue(() => value), node), [node]);

  useEffect(() => {
    retain(eff);
    return () => {
      release(eff);
    };
  }, [eff]);

  if (prevAtomRef.current !== node) {
    prevAtomRef.current = node;
    return deref(node);
  }

  return value;
}

export function useValue(node) {
  const subscribe = useCallback((listen) => {
    const eff = effect(listen, node);
    retain(eff);
    return () => {
      release(eff);
    };
  }, [node]);

  const getSnapshot = useCallback(() => deref(node), [node]);

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
  const fc = useMemo(() => focus(path(...depPaths), node), [node, ...depPaths]);

  useEffect(() => {
    retain(fc);
    return () => {
      release(fc);
    };
  }, [fc]);

  return fc;
}

export function useDirectRef(node, mappings) {
  const effRef = useRef();

  return useCallback((dom) => {
    if (dom == null) {
      if (effRef.current != null) {
        release(effRef.current);
        effRef.current = null;
      }
      return;
    }

    const props = Object.keys(mappings);
    const eff = effRef.current = effect((data) => {
      for (const p of props) {
        const getter = mappings[p];
        if (getter == null) {
          continue;
        }

        switch (typeof getter) {
          case "number":
          case "string":
          case "symbol": {
            dom[p] = data[p];
            break;
          }
          case "function": {
            dom[p] = getter(data);
            break;
          }
          case "object": {
            dom[p] = view(getter, data);
            break;
          }
          default: {
            throw Error("unrecognized mapping");
          }
        }
      }
    }, node);

    retain(eff);
    return () => {
      release(eff);
    };
  }, [node, mappings]);
}
