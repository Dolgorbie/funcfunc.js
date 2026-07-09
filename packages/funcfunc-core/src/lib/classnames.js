export function createClassNamesCombinator({ processors = [], merge = simpleMerge } = {}) {
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

export const c = createClassNamesCombinator({ processors: [omitFalsyProcessor] });

export const clegacy = createClassNamesCombinator({ processors: [omitFalsyProcessor, objectKeysProcessor] });

export function cprops(styles) {
  return createClassNamesCombinator({ processors: [createPropProcessor(styles), omitFalsyProcessor] });
}

export function cprefix(prefix) {
  return createClassNamesCombinator({ processors: [omitFalsyProcessor, createPrefixingProcessor(prefix)] });
}

export function cvariants(variantDefs) {
  return createClassNamesCombinator({ processors: [omitFalsyProcessor, createVariantProcessor(variantDefs), omitFalsyProcessor] });
}

export function cbem(prefix) {
  return createClassNamesCombinator({ processors: [createBemProcessor(prefix), omitFalsyProcessor] });
}

export function cautoBem() {
  return createClassNamesCombinator({ processors: [omitFalsyProcessor], merge: autoBemMerge });
}

export const craw = createClassNamesCombinator();

export function omitFalsyProcessor(name) {
  return name || false;
}

export function objectKeysProcessor(name) {
  if (name === null || typeof name !== "object") {
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
  return (prop) => styles[prop] ?? prop;
}

export function createPrefixingProcessor(prefix) {
  return (name) => `${prefix}${name}`;
}

export function createVariantProcessor(variantDefs) {
  return (variant) => {
    if (variant == null || typeof variant !== "object") {
      return variant;
    }

    const keys = Object.keys(variant);
    const { length } = keys;
    for (let i = 0; i < length; ++i) {
      const k = keys[i];
      keys[i] = variantDefs[k][variant[k]];
    }
    return keys;
  };
}

export function createBemProcessor(prefix) {
  return (name) => {
    if (typeof name !== "string" || !name.match(/^(?:--|__)/)) {
      return name;
    }
    return `${prefix}${name}`;
  };
}

export function createRegReplaceProcessor(regex, replace) {
  return (name) => {
    if (typeof name !== "string") {
      return name;
    }
    return name.replace(regex, replace);
  }
}

export function simpleMerge(names) {
  return names.join(" ");
}

export function autoBemMerge(names) {
  const { length } = names;
  if (length === 0) {
    return "";
  }
  const [block] = names;
  const acc = new Array(length);
  acc[0] = block;
  for (let i = 1; i < length; ++i) {
    const name = names[i];
    const isTarget = typeof name === "string" && name.match(/^(?:--|__)/);
    acc[i] = isTarget ? `${block}${name}` : name;
  }
  return acc.join(" ");
}
