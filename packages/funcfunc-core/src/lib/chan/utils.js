import { gmap1 } from "../sequence/iterator-utils";
import { Chan, isEndOfChan } from "./core";

export function merge(options) {
  const toChan = new Chan(options);
  const fromChanMap = new Map();

  const run = (chan, signal) => {
    (async () => {
      while (fromChanMap.has(chan)) {
        const value = await chan.take(signal);
        if (isEndOfChan(value)) {
          fromChanMap.delete(chan);
          if (fromChanMap.size === 0) {
            toChan.close();
          }
          return;
        }
        await toChan.post(value);
      }
    })();
  };

  return {
    chan: toChan,

    pub: (chan) => {
      if (fromChanMap.has(chan)) {
        return;
      }
      const ctrl = new AbortController()
      fromChanMap.set(chan, ctrl);
      run(chan, ctrl.signal);
    },

    unpub: (chan) => {
      const ctrl = fromChanMap.get(chan);
      if (ctrl != null) {
        ctrl.abort();
        fromChanMap.delete(chan);
      }
    },
  };
}

export function mult(fromChan) {
  const distSet = new Set();

  const run = async () => {
    while (distSet.size > 0) {
      const value = await fromChan.take();
      if (isEndOfChan(value)) {
        for (const dist of distSet) {
          dist.close();
        }
        distSet.clear();
        return;
      }

      const rejectedChans = [];

      await Promise.allSettled(gmap1(async (dist) => {
        try {
          await dist.post(value);
        } catch (error) {
          rejectedChans.push(dist);
          throw error;
        }
      }, distSet));

      for (const c of rejectedChans) {
        distSet.delete(c);
      }
    }
  };

  return {
    sub: (chan) => {
      distSet.add(chan);
      if (distSet.size === 1) {
        run();
      }
    },

    unsub: (chan) => {
      return distSet.delete(chan);
    },
  };
}
