export function thread(proc, ...args) {
  const abortController = new AbortController();

  const param = {
    signal: abortController.signal,
    run: (proc, ...args) => {
      proc(param, ...args);
    },
  };

  const promise = proc(param, ...args);

  return { abortController, promise };
}
