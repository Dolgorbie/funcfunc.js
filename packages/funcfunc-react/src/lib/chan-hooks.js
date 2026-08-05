import { Chan, post, take } from "funcfunc/chan/core";
import { useCallback, useState } from "react";

export function useChan(init) {
  const [chan] = useState(() => {
    const initParam = typeof init === "function" ? init() : init;
    return new Chan(initParam);
  });

  const postEvent = useCallback((event) => post(chan, event), [chan]);
  const takeEvent = useCallback(() => take(chan, event), [chan]);

  return [chan, postEvent];
}
