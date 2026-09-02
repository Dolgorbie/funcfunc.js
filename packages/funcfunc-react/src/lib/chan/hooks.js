import { Chan } from "funcfunc/chan/core";
import { useEffect, useState } from "react";

export function useChan(init, initFn = void 0) {
  const [chan] = useState(() => {
    const initParam = initFn === void 0 ? init : initFn(init);
    return new Chan(initParam);
  });

  useEffect(() => {
    return () => {
      chan.close();
    };
  }, [chan]);

  return chan;
}
