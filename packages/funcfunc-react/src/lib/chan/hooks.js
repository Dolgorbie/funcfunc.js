import { Chan } from "funcfunc/chan/core";
import { useState } from "react";

export function useChan(init) {
  const [chan] = useState(() => {
    const initParam = typeof init === "function" ? init() : init;
    return new Chan(initParam);
  });

  return chan;
}
