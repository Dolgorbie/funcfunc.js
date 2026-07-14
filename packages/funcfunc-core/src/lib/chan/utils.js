import { forEach1, map1 } from "../arrays";
import { isEndOfChan } from "./core";

export function merge(output, options = {}, ...inputs) {
  const {
    closeOutput = false,
    closeInputs = false,
    earlyStop = false,
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
            if (earlyStop) {
              throw Error("an input chan was closed.");
            }
            return;
          }

          await output.post({ value, chan }, abortPostSignal);
        }
      }, inputs));
    } catch (error) {
      abortTakeController.abort(error);
      abortPostController.abort(error);
    } finally {
      if (closeInputs) {
        if (closeInputs instanceof AbortController) {
          closeInputs.abort(Error("the output chan was closed."));
        } else {
          forEach1((chan) => chan.close(), inputs);
        }
      }
      if (closeOutput) {
        if (closeOutput instanceof AbortController) {
          closeOutput.abort(Error("all input chans was closed."));
        } else {
          output.close();
        }
      }
    }
  })();

  return output;
}

export function tee(input, options = {}, ...outputs) {
  const {
    closeInput = false,
    closeOutputs = false,
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

        await Promise.any(map1(async (chan) => {
          await chan.post(value, abortPostSignal);
        }, outputs));
      }
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
