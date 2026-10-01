export function createClassNamesCombinator({ transformers = [], aggregator = defaultAggregator } = {}) {
  return (...names) => {
    const acc = [];
    _loopNames(acc, transformers, 0, names);
    return aggregator(acc);
  }
}

function _loopNames(acc, transformers, offsetTranses, names) {
  const { length } = names;
  for (let i = 0; i < length; ++i) {
    const n = names[i];
    if (Array.isArray(n)) {
      _loopNames(acc, transformers, offsetTranses, n);
      continue;
    }
    _loopTranses(acc, transformers, offsetTranses, n);
  }
}

function _loopTranses(acc, transformers, offsetTranses, name) {
  const { length } = transformers;
  for (let i = offsetTranses; i < length; ++i) {
    const trans = transformers[i];
    name = trans(name);
    if (Array.isArray(name)) {
      _loopNames(acc, transformers, i + 1, name);
      return;
    }
  }
  acc.push(name);
}

export function defaultAggregator(names) {
  return names.join(" ");
}
