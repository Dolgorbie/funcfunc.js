import { view } from "funcfunc/lens";
import { atom, deref, effect, focus, release, retain, track } from "funcfunc/sigtree";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePath } from "../lens/hooks";

export function useAtom(init, initFn = void 0) {
  const [node] = useState(() => atom(initFn === void 0 ? init : initFn(init)));
  return node;
}

export function useSigEffect(handler, depNodes) {
  const [{ _depNodesLength }] = useState({ _depNodesLength: depNodes.length });
  if (_depNodesLength !== depNodes.length) {
    throw Error("expects number of depNodes be constant");
  }

  const memoDepNodes = useMemo(() => depNodes, depNodes);
  const eff = useMemo(() => effect(handler, ...memoDepNodes), [handler, memoDepNodes]);

  _useLifeCycle(eff);

  return eff;
}

export function useUnsyncedValue(node) {
  const prevAtomRef = useRef(node);
  const [{ _value }, setValue] = useState(() => ({ _value: deref(node) }));
  const eff = useMemo(() => effect((_value) => setValue({ _value }), node), [node]);

  _useLifeCycle(eff);

  if (prevAtomRef.current !== node) {
    prevAtomRef.current = node;
    return deref(node);
  }

  return _value;
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
  const [{ _depNodesLength }] = useState({ _depNodesLength: depNodes.length });
  if (_depNodesLength !== depNodes.length) {
    throw Error("expects number of depNodes be constant");
  }

  const memoDepNodes = useMemo(() => depNodes, depNodes)
  const node = useMemo(() => track(handler, ...memoDepNodes), [handler, memoDepNodes]);

  _useLifeCycle(node);

  return node;
}

export function useFocus(depNode, lns) {
  const node = useMemo(() => focus(lns, depNode), [lns, depNode]);

  _useLifeCycle(node);

  return node;
}

export function usePathFocus(depNode, depPath) {
  const lens = usePath(depPath);
  const node = useMemo(() => focus(lens, depNode), [depNode, lens]);

  _useLifeCycle(node);

  return node;
}

export function useDirectRef(node, mappings) {
  const effRef = useRef();
  const [{ _memoMappings }] = useState({ _memoMappings: mappings })

  return useCallback((dom) => {
    if (dom == null) {
      if (effRef.current != null) {
        release(effRef.current);
        effRef.current = null;
      }
      return;
    }

    const props = Object.keys(_memoMappings);
    const eff = effRef.current = effect((data) => {
      for (const p of props) {
        const getter = _memoMappings[p];
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
  }, [node, _memoMappings]);
}

export function _useLifeCycle(node) {
  _useLifeCycle(node);
}
