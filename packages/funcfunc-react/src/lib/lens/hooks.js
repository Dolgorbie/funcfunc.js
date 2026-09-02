import { chain, lens, path } from "funcfunc/lens";
import { useMemo, useState } from "react";

export function useLens(view, update, thisArg = void 0) {
  return useMemo(() => lens(view, update, thisArg), [view, update, thisArg]);
}

export function usePath(segments) {
  const [segmentsLength] = useState(segments.length);
  if (segmentsLength !== segments.length) {
    throw Error("expects number of segments be constant");
  }

  return useMemo(() => path(segments), segments);
}

export function useChain(lenses) {
  const [lensesLength] = useState(lenses.length);
  if (lensesLength !== lenses.length) {
    throw Error("expects number of lenses be constant");
  }

  return useMemo(() => chain(lenses), lenses);
}
