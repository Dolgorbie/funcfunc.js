import { useMemo } from "react";
import { useAtom, useFocus, usePathFocus, useTrack, useUnsyncedValue, useValue } from "./hooks";

export function WithAtom({ init, children }) {
  const node = useAtom(init);
  return useMemo(() => children ? children(node) : void 0, [children, node]);
}

export function WithValue({ node, children }) {
  const value = useValue(node);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithUnsyncedValue({ node, children }) {
  const value = useUnsyncedValue(node);
  return useMemo(() => children ? children(value) : void 0, [children, value]);
}

export function WithTrack({ nodes, handler, children }) {
  const node = useTrack(handler, nodes);
  return useMemo(() => children ? children(node) : void 0, [children, node]);
}

export function WithFocus({ node, lens, children }) {
  const node = useFocus(node, lens);
  return useMemo(() => children ? children(node) : void 0, [children, node]);
}

export function WithPathFocus({ node, path, children }) {
  const node = usePathFocus(node, path);
  return useMemo(() => children ? children(node) : void 0, [children, node]);
}
