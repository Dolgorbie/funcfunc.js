export function createClassNamesCombinator({ transformers = [], aggregator = defaultAggregator } = {}) {
  return (...names) => {
    const acc = [];
    _loopNames(acc, transformers, 0, names);
    return aggregator(acc);
  }
}

function _loopNames(acc, transformers, offsetTs, names) {
  for (const name of names) {
    if (name === false) {
      continue;
    }
    if (Array.isArray(name)) {
      _loopNames(acc, transformers, offsetTs, name);
      continue;
    }
    _loopTranses(acc, transformers, offsetTs, name);
  }
}

function _loopTranses(acc, transformers, offsetTranses, name) {
  const { length } = transformers;
  for (let i = offsetTranses; i < length; ++i) {
    const trans = transformers[i];
    name = trans(name);
    if (name === false) {
      return;
    }
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
