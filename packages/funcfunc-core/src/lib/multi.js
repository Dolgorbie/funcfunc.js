import { is } from "./asfunc";
import { car, cdr, flatMap1, isPair, map1 } from "./list";

export function multi({ dispatch, defaultImpl = _defaultImpl }) {
  const implMap = new Map();

  function _doMethod(...args) {
    const keys = isa(dispatch(...args));
    for (const k of keys) {
      const impl = implMap.get(k);
      if (impl != null) {
        return impl(...args);
      }
    }
    return defaultImpl(...args);
  }

  _doMethod.reg = (key, impl) => {
    implMap.set(key, impl);
    return _doMethod;
  };

  return _doMethod;
}

export function derive(parent, child) {
  let uppers = _hierarchy.get(child);
  if (uppers == null) {
    _hierarchy.set(child, uppers = [child]);
  }

  if (uppers.every((u) => !is(u, parent))) {
    uppers.push(parent);
  }
}

/*
{
  superA1: (superA1 (superA1a) (superA1b)),
  superA1a: (superA1a)
  superA1b: (superA1b)
  superA2: (superA2 (superA2a) (superA2b)),
  superA2a: (superA2a),
  superA2b: (superA2b),
  superB1: (superB1),
  superB2: (superB2),
  classA: (classA (superA1 (superA1a) (superA1b)) (superA2 (superA2a) (superA2b))),
  classB: (classB (superB1) (superB2)),
}
*/
const _hierarchy = new Map();

export function* traverseHierarchy(hierarchy) {
  const current = car(hierarchy);
  yield current;
  for (let ancestors = cdr(hierarchy); isPair(ancestors); ancestors = flatMap1(cdr, ancestors)) {
    const parents = map1(car, ancestors);
    yield* parents;
  }
}

export function isa()

function _defaultImpl() {
  throw TypeError("Not implemented");
}
