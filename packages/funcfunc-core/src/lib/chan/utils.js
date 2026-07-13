import { map1 } from "../arrays";
import { isEndOfChan } from "./core";

export function merge(output, options = {}, ...inputs) {
  const {
    autoClose = false
  } = options;

  const abortTakeController = new AbortController();
  const { signal: abortTakeSignal } = abortTakeController;
  const abortPostController = new AbortController();
  const { signal: abortPostSignal } = abortPostController;

  (async () => {
    try {
      await Promise.all(map1(async (chan) => {
        for (; ;) {
          const value = await chan.take(abortTakeSignal);
          if (isEndOfChan(value)) {
            return;
          }

          await output.post({ value, chan }, abortPostSignal);
        }
      }, inputs));
    } catch (error) {
      abortTakeController.abort(error);
      abortPostController.abort(error);
    } finally {
      if (autoClose) {
        if (autoClose instanceof AbortController) {
          autoClose.abort(Error("all input chans was closed"));
        } else {
          output.close();
        }
      }
    }
  })();

  return output;
}
