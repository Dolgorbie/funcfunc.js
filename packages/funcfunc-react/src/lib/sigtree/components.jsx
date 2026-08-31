import { useMemo } from "react";
import { useAtom, useFocus, usePathFocus, useTrack, useUnsyncedValue, useValue } from "./hooks";

export function WithAtom({ init, children }) {
  const atom = useAtom(init);
  return useMemo(() => children ? children(atom) : void 0, [children, atom]);
}

export function WithValue({ atom, children }) {
  const value = useValue(atom);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithUnsyncedValue({ atom, children }) {
  const value = useUnsyncedValue(atom);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithTrack({ atoms, handler, children }) {
  const trk = useTrack(handler, atoms);
  return useMemo(() => children ? children(trk) : void 0, [children, trk]);
}

export function WithFocus({ atom, lens, children }) {
  const fc = useFocus(lens, atom);
  return useMemo(() => children ? children(fc) : void 0, [children, fc]);
}

export function WithPathFocus({ atom, paths, children }) {
  const fc = usePathFocus(atom, paths);
  return useMemo(() => children ? children(fc) : void 0, [children, fc]);
}
