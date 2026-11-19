import { chain, lens, path } from "funcfunc/lens";
import { every2 } from "funcfunc/sequence/array-utils";
import { useEffect, useMemo, useRef } from "react";

export function useLens(view, update, thisArg = void 0) {
  return useMemo(() => lens(view, update, thisArg), [view, update, thisArg]);
}

export function usePath(segments) {
  const ref = useRef(null);
  if (ref.current == null) {
    ref.current = { _lns: path(segments), _deps: segments };
  }

  const { current } = ref;
  const { _deps } = current;
  const result = _deps.length === segments.length && every2(Object.is, _deps, segments)
    ? current._lns
    : path(segments);

  useEffect(() => {
    ref.current = { _lns: result, _deps: segments };
  }, [result]);

  return result;
}

export function useChain(lenses) {
  const ref = useRef(null);
  if (ref.current == null) {
    ref.current = { _lns: chain(lenses), _deps: lenses };
  }

  const { current } = ref;
  const { _deps } = current;
  const result = _deps.length === lenses.length && every2(Object.is, _deps, lenses)
    ? current._lns
    : chain(lenses);

  useEffect(() => {
    ref.current = { _lns: result, _deps: lenses };
  }, [result]);

  return result;
}
