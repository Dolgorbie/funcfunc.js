
export function genc({ processors = [], merge = _defaultMerge } = {}) {
  return (...names) => {
    const acc = [];
    _loop(0, processors, acc, names);
    return merge(acc);
  }
}

function _loop(procid, processors, acc, names) {
  const nNames = names.length;
  Outer: for (let i = 0; i < nNames; ++i) {
    let name = names[i];

    if (Array.isArray(name)) {
      _loop(procid, processors, acc, name);
      continue;
    }

    const nProcessors = processors.length;
    for (let j = procid; j < nProcessors; ++j) {
      const proc = processors[j];
      name = proc(name);
      if (name === false) {
        continue Outer;
      }
      if (Array.isArray(name)) {
        _loop(j + 1, processors, acc, name);
        continue Outer;
      }
    }

    if (name !== false) {
      acc.push(name);
    }
  }
}

export const c = genc();

export const clegacy = genc({ preprocess: _legacyPreprocess });

export function cprops(styles) {
  return genc({ postprocess: (prop) => prop && (styles[prop] ?? prop) });
}

export function cprefix(prefix) {
  return genc({ postprocess: (name) => name && `${prefix}${name}` });
}

function _defaultMerge(names) {
  return names.join(" ");
}

function _legacyPreprocess(name) {
  if (name == null || typeof name !== "object" || Array.isArray(name)) {
    return name;
  }
  const keys = Object.keys(name)
  const acc = new Array(keys.length);
  let i = 0;
  for (const k of keys) {
    if (name[k]) {
      acc[i++] = k;
    }
  }
  acc.length = i;
  return acc;
}
