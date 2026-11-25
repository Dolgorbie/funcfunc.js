import { useMemo } from "react";
import { useAtom, useFocus, usePathFocus, useTrack, useUnsyncedValue, useValue } from "./hooks";

export function WithAtom({ init, children }) {
  const atom = useAtom(init);
  return useMemo(() => children ? children(atom) : void 0, [children, atom]);
}

export function WithValue({ sig, children }) {
  const value = useValue(sig);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithUnsyncedValue({ sig, children }) {
  const value = useUnsyncedValue(sig);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithTrack({ sigs, handler, children }) {
  const track = useTrack(handler, sigs);
  return useMemo(() => children ? children(track) : void 0, [children, track]);
}

export function WithFocus({ sig, lens, children }) {
  const focus = useFocus(lens, sig);
  return useMemo(() => children ? children(focus) : void 0, [children, focus]);
}

export function WithPathFocus({ sig, path, children }) {
  const focus = usePathFocus(path, sig);
  return useMemo(() => children ? children(focus) : void 0, [children, focus]);
}
