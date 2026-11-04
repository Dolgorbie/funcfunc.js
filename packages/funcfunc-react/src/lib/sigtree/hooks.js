import { view } from "funcfunc/lens";
import { every2 } from "funcfunc/sequence/array-utils";
import { atom, derefForce, effect, focus, release, retain, track } from "funcfunc/sigtree";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePath } from "../lens/hooks";

export function useAtom(init, initFn = void 0) {
  const [node] = useState(() => atom(initFn === void 0 ? init : initFn(init)));
  return node;
}

export function useSigEffect(handler, depNodes) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const [state, setState] = useState(null);

  let eff;
  if (state != null && state._depNodes.length === depNodes.length && every2(Object.is, state._depNodes, depNodes)) {
    eff = state._eff;
  } else {
    eff = effect((...args) => handlerRef.current(...args), ...depNodes);
    setState({ _eff: eff, _depNodes: depNodes });
  }

  useLifeCycle(eff);

  return eff;
}

export function useUnsyncedValue(node) {
  const [state, setState] = useState(null);

  let value;
  if (state != null && Object.is(state._node, node)) {
    value = state._value;
  } else {
    value = derefForce(node);
    setState({ _node: node, _value: value });
  }

  useSigEffect((value) => setState((prev) => Object.is(value, prev.value) ? prev : ({ _node: prev._node, _value: value })), [node])

  return value;
}

export function useValue(node) {
  const subscribe = useCallback((listen) => {
    const eff = effect(listen, node);
    return _doLifeCycleEffect(eff);
  }, [node]);

  const getSnapshot = useCallback(() => derefForce(node), [node]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useTrack(handler, depNodes) {
  const [{ _depNodesLength }] = useState({ _depNodesLength: depNodes.length });
  if (_depNodesLength !== depNodes.length) {
    throw Error("expects number of depNodes be constant");
  }

  const memoDepNodes = useMemo(() => depNodes, depNodes)
  const node = useMemo(() => track(handler, ...memoDepNodes), [handler, memoDepNodes]);

  useLifeCycle(node);

  return node;
}

export function useFocus(lns, depNode) {
  const node = useMemo(() => focus(lns, depNode), [lns, depNode]);

  useLifeCycle(node);

  return node;
}

export function usePathFocus(depPath, depNode) {
  const lens = usePath(depPath);
  const node = useMemo(() => focus(lens, depNode), [lens, depNode]);

  useLifeCycle(node);

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
            dom[p] = data[getter];
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

export function useLifeCycle(node) {
  useEffect(() => {
    return _doLifeCycleEffect(node);
  }, [node]);
}

function _doLifeCycleEffect(node) {
  retain(node);
  return () => {
    release(node);
  };
}
