import { flatMap1, forEach1, map1 } from "../array-utils";
import { asyncFailable, force, isFailed, reasons } from "../failable";
import { isEndOfChan, TakeError } from "./core";

export function merge(output, ...inputs) {
  const abortTakeController = new AbortController();
  const { signal: abortTakeSignal } = abortTakeController;

  const abortPostController = new AbortController();
  const { signal: abortPostSignal } = abortPostController;

  (async () => {
    try {
      await Promise.all(map1(async (chan) => {
        for (; ;) {
          const value = await asyncFailable(chan.take(abortTakeSignal));
          if (isFailed(value)) {
            const rss = reasons(value);
            if (rss.length === 1 && rss[0] instanceof TakeError) {
              return;
            }
            force(value);
          }
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
      forEach1((chan) => chan.close(), inputs);
    }
    output.close();
  })();

  return output;
}

export function mult(input, options = {}, ...outputs) {
  const {
    closeInput = false,
    closeOutputs = false,
    earlyStop = false,
  } = options;

  const abortTakeController = new AbortController();
  const { signal: abortTakeSignal } = abortTakeController;
  const abortPostController = new AbortController();
  const { signal: abortPostSignal } = abortPostController;

  (async () => {
    try {
      for (; ;) {
        const value = await input.take(abortTakeSignal);
        if (isEndOfChan(value)) {
          return;
        }

        const res = await Promise.allSettled(map1(async (chan) => {
          await chan.post(value, abortPostSignal);
        }, outputs));

        const errors = flatMap1((({ status, reason }) => status === "fulfilled" ? [] : [reason], res));
        if (earlyStop && errors.length > 0) {
          throw new AggregateError(errors);
        }
        if (errors.length === outputs.length) {
          throw new AggregateError(errors);
        }
      }
    } catch (error) {
      abortTakeController.abort(error);
      abortPostController.abort(error);
    } finally {
      if (closeInput) {
        if (closeInput instanceof AbortController) {
          closeInput.abort(Error("all output chans was closed."));
        } else {
          input.close();
        }
      }
      if (closeOutputs) {
        if (closeOutputs instanceof AbortController) {
          closeOutputs.abort(Error("the input chan was closed."));
        } else {
          forEach1((chan) => chan.close(), outputs);
        }
      }
    }
  })();

  return input;
}
