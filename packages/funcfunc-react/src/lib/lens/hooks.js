import { chain, lens, path } from "funcfunc/lens";
import { useMemo } from "react";

export function useLens(view, update, thisArg = void 0) {
  return useMemo(() => lens(view, update, thisArg), [view, update, thisArg]);
}

export function usePath(segments) {
  return useMemo(() => path(segments), segments);
}

export function useChain(lenses) {
  return useMemo(() => chain(lenses), lenses);
}
