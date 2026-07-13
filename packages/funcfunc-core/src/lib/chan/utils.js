import { map1 } from "../arrays";
import { isEndOfChan, PostError } from "./core";

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
        try {
          for (; ;) {
            const value = await chan.take(abortTakeSignal);

            if (isEndOfChan(value)) {
              return { _success: true, _chan: chan };
            }

            await output.post({ value, chan }, abortPostSignal);
          }
        } catch (error) {
          if (error instanceof PostError) {
            abortTakeController.abort(error);
            return { _success: false, _chan: chan, _reason: error };
          }
          return { _success: false, _chan: chan, _reason: error };
        }
      }, inputs));
    } catch (error) {
      abortTakeController.abort(error);
      abortPostController.abort(error);
    } finally {
      if (autoClose) {
        if (autoClose instanceof AbortController) {
          autoClose.abort();
        } else {
          output.close();
        }
      }
    }
  })();

  return output;
}
