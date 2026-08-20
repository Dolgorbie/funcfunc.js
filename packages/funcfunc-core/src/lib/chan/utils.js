import { map1, some1 } from "../sequence/array-utils";
import { gmap1 } from "../sequence/iterator-utils";
import { Chan, isEndOfChan } from "./core";

export function merge(sources) {
  const dist = new Chan();

  const abortController = new AbortController();
  const { signal } = abortController;

  dist.addCloseHook(() => {
    abortController.abort();
  });

  (async () => {
    await Promise.allSettled(map1(async (chan) => {
      try {
        for (; ;) {
          const value = await chan.take(signal);
          if (isEndOfChan(value)) {
            return;
          }
          await dist.post({ value, chan });
        }
      } catch (error) {
        dist.close();
        throw error;
      }
    }, sources));
    dist.close();
  })();

  return dist;
}

export function pub(source) {
  const distSet = new Set();

  (async () => {
    for (; ;) {
      const value = await source.take();
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
