import { map1, some1 } from "../sequence/array-utils";
import { gmap1 } from "../sequence/iterator-utils";
import { isEndOfChan } from "./core";

export function merge(toChan) {
  const fromChanSet = new Set();

  const abortController = new AbortController();
  const { signal } = abortController;

  toChan.addCloseHook(() => {
    abortController.abort();
  });

  const run = async () => {
    await Promise.allSettled(map1(async (chan) => {
      for (; ;) {
        const value = await chan.take(signal);
        if (isEndOfChan(value)) {
          return;
        }
        await toChan.post({ value, chan });
      }
    }, fromChanSet));
    toChan.close();
  };

  return {
    chan: toChan,

    pub: (chan) => {
      fromChanSet.add(chan);
      if (fromChanSet.size === 1) {
        run();
      }
    },

    unpub: (chan) => {
      return fromChanSet.delete(chan);
    },
  };
}

export function mult(fromChan) {
  const distSet = new Set();

  (async () => {
    for (; ;) {
      const value = await fromChan.take();
      if (isEndOfChan(value)) {
        for (const dist of distSet) {
          dist.close();
        }
        return;
      }

      const result = await Promise.allSettled(gmap1(async (dist) => {
        await dist.post(value);
      }, distSet));

      if (some1(({ status }) => status === "rejected", result)) {
        return;
      }
    }
  })();

  return {
    sub: (chan) => {
      distSet.add(chan);
    },
    unsub: (chan) => {
      return distSet.delete(chan);
    },
  };
}
