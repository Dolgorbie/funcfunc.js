import { view } from "funcfunc/lens";
import { every2 } from "funcfunc/sequence/array-utils";
import { atom, deref, effect, focus, release, retain, track } from "funcfunc/sigtree/core";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePath } from "../lens/hooks";

export function useAtom(init, initFn = void 0) {
  const [sig] = useState(() => atom(initFn === void 0 ? init : initFn(init)));
  return sig;
}

export function useSigEffect(handler, depSigs) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stateRef = useRef(null);
  if (stateRef.current == null) {
    stateRef.current = {
      _eff: effect((...args) => handlerRef.current(...args), ...depSigs),
      _deps: depSigs,
    }
  }

  const { current } = stateRef;
  const { _deps } = current;
  const eff = _deps.length === depSigs.length && every2(Object.is, _deps, depSigs)
    ? current._eff
    : effect((...args) => handlerRef.current(...args), ...depSigs);

  useEffect(() => {
    stateRef.current = { _eff: eff, _deps: depSigs };
  }, [eff]);

  useLifeCycle(eff);

  return eff;
}

export function useUnsyncedValue(sig) {
  const [state, setState] = useState(() => ({ _sig: sig, _value: deref(sig) }));
  const { _sig, _value } = state;

  let result;
  if (_sig === sig) {
    result = _value;
  } else {
    setState({ _sig: sig, _value: (result = deref(sig)) });
  }

  useSigEffect((nextVal) => {
    setState((prev) => Object.is(prev._value, nextVal) ? prev : { ...prev, _value: nextVal });
  }, [_sig]);

  return result;
}

export function useValue(sig) {
  const subscribe = useCallback((listen) => {
    const eff = effect(listen, sig);
    retain(eff);
    return () => {
      release(eff);
    };

  }, [sig]);

  const getSnapshot = useCallback(() => {
    return deref(sig);
  }, [sig]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useTrack(handler, depSigs) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stateRef = useRef(null);
  if (stateRef.current == null) {
    stateRef.current = {
      _sig: track((...args) => handlerRef.current(...args), ...depSigs),
      _deps: depSigs,
    }
  }

  const { current } = stateRef;
  const { _deps } = current;
  const result = _deps.length === depSigs.length && every2(Object.is, _deps, depSigs)
    ? current._sig
    : track((...args) => handlerRef.current(...args), ...depSigs);

  useEffect(() => {
    stateRef.current = { _sig: result, _deps: depSigs };
  }, [result]);

  useLifeCycle(result);

  return result;
}

export function useFocus(lns, depSig) {
  const sig = useMemo(() => focus(lns, depSig), [lns, depSig]);

  useLifeCycle(sig);

  return sig;
}

export function usePathFocus(depPath, depSig) {
  const lens = usePath(depPath);
  const sig = useMemo(() => focus(lens, depSig), [lens, depSig]);

  useLifeCycle(sig);

  return sig;
}

export function useDirectRef(sig, mappings) {
  const [memoMappings] = useState(mappings)

  return useCallback((dom) => {
    const props = Object.keys(memoMappings);
    const eff = effect((data) => {
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
    }, sig);

    retain(eff);
    return () => {
      release(eff);
    };
  }, [sig, memoMappings]);
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

export function useLifeCycle(sig) {
  useEffect(() => {
    retain(sig)
    return () => {
      release(sig);
    };
  }, [sig]);
}
