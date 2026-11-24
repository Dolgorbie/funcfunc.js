import { view } from "funcfunc/lens";
import { every2 } from "funcfunc/sequence/array-utils";
import { atom, deref, effect, focus, release, retain, track } from "funcfunc/sigtree/core";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePath } from "../lens/hooks";

export function useAtom(init, initFn = void 0) {
  const [node] = useState(() => atom(initFn === void 0 ? init : initFn(init)));
  return node;
}

export function useSigEffect(handler, depNodes) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stateRef = useRef(null);
  if (stateRef.current == null) {
    stateRef.current = {
      _eff: effect((...args) => handlerRef.current(...args), ...depNodes),
      _deps: depNodes,
    }
  }

  const { current } = stateRef;
  const { _deps } = current;
  const eff = _deps.length === depNodes.length && every2(Object.is, _deps, depNodes)
    ? current._eff
    : effect((...args) => handlerRef.current(...args), ...depNodes);

  useEffect(() => {
    stateRef.current = { _eff: eff, _deps: depNodes };
  }, [eff]);

  useLifeCycle(eff);

  return eff;
}

export function useUnsyncedValue(node) {
  const [state, setState] = useState(null);

  let value;
  if (state != null && Object.is(state._node, node)) {
    value = state._value;
  } else {
    value = deref(node);
    setState({ _node: node, _value: value });
  }

  useSigEffect((value) => setState((prev) => Object.is(value, prev._value) ? prev : ({ _node: prev._node, _value: value })), [node])

  return value;
}

export function useValue(node) {
  const retainedRef = useRef(false);

  const subscribe = useCallback((listen) => {
    const eff = effect(listen, node);

    retain(eff);
    retainedRef.current = true;

    return () => {
      retainedRef.current = false;
      release(eff);
    };

  }, [node]);

  const getSnapshot = useCallback(() => {
    if (retainedRef.current) {
      return deref(node);
    } else {
      return deref(node)
    }
  }, [node]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useTrack(handler, depNodes) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stateRef = useRef(null);
  if (stateRef.current == null) {
    stateRef.current = {
      _node: track((...args) => handlerRef.current(...args), ...depNodes),
      _deps: depNodes,
    }
  }

  const { current } = stateRef;
  const { _deps } = current;
  const result = _deps.length === depNodes.length && every2(Object.is, _deps, depNodes)
    ? current._node
    : track((...args) => handlerRef.current(...args), ...depNodes);

  useEffect(() => {
    stateRef.current = { _node: result, _deps: depNodes };
  }, [result]);

  useLifeCycle(result);

  return result;
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
  const [memoMappings] = useState(mappings)

  return useCallback((dom) => {
    if (dom == null) {
      if (effRef.current != null) {
        release(effRef.current);
        effRef.current = null;
      }
      return;
    }

    const props = Object.keys(memoMappings);
    const eff = effRef.current = effect((data) => {
      for (const p of props) {
        const getter = memoMappings[p];
        if (getter == null) {
          continue;
        }

        switch (typeof getter) {
          case "number":
          case "string":
          case "symbol": {
            replaceAttr(dom, p, data[getter]);
            break;
          }
          case "function": {
            replaceAttr(dom, p, getter(data));
            break;
          }
          case "object": {
            replaceAttr(dom, p, view(getter, data));
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
  }, [node, memoMappings]);
}

function replaceAttr(dom, param, value) {
  switch (param) {
    case "children":
      if (value === false || value == null) {
        dom.replaceChildren();
        break;
      }
      if (Array.isArray(value)) {
        dom.replaceChildren(...value);
        break;
      }
      dom.replaceChildren(value);
      break;
    default:
      dom[param] = value;
  }
}

export function useLifeCycle(node) {
  useEffect(() => {
    retain(node)
    return () => {
      release(node);
    };
  }, [node]);
}
