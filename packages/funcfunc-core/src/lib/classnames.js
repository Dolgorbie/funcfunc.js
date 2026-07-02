export function genc({ processors = [], merge = simpleMerge } = {}) {
  return (...names) => {
    const acc = [];
    _loopNames(acc, processors, 0, names);
    return merge(acc);
  }
}

function _loopNames(acc, processors, offsetProcs, names) {
  for (const name of names) {
    if (name === false) {
      continue;
    }
    if (Array.isArray(name)) {
      _loopNames(acc, processors, offsetProcs, name);
      continue;
    }
    _loopProcs(acc, processors, offsetProcs, name);
  }
}

function _loopProcs(acc, processors, offsetProcs, name) {
  const { length } = processors;
  for (let i = offsetProcs; i < length; ++i) {
    const proc = processors[i];
    name = proc(name);
    if (name === false) {
      return;
    }
    if (Array.isArray(name)) {
      _loopNames(acc, processors, i + 1, name);
      return;
    }
  }
  acc.push(name);
}

export const c = genc({ processors: [omitFalsyProcessor] });

export const clegacy = genc({ processors: [omitFalsyProcessor, objectKeysProcessor] });

export function cprops(styles) {
  return genc({ processors: [createPropProcessor(styles), omitFalsyProcessor] });
}

export function cprefix(prefix) {
  return genc({ processors: [omitFalsyProcessor, createPrefixingProcessor(prefix)] });
}

export const craw = genc();

export function omitFalsyProcessor(name) {
  return name || false;
}

export function objectKeysProcessor(name) {
  if (name == null || typeof name !== "object") {
    return name;
  }
  const keys = Object.keys(name)
  const acc = new Array(keys.length);
  let i = 0;
  for (const k of keys) {
    if (k !== "" && name[k]) {
      acc[i++] = k;
    }
  }
  acc.length = i;
  return acc;
}

export function createPropProcessor(styles) {
  return (prop) => styles[prop] ?? prop
}

export function createPrefixingProcessor(prefix) {
  return (name) => `${prefix}${name}`
}

export function simpleMerge(names) {
  return names.join(" ");
}
