import { pa2 } from "../core";
import { map1 } from "../delay";
import { lconcatI, lforEach1, listOf } from "../sequence/list";

export class Hierarchy {
  _superToSub = new Map();
  _subToSuper = new Map();
  _deriveListMap = new Map();

  constructor() { }

  derive(sub, sup) {
    const { _superToSub, _subToSuper } = this

    let registeredSubs = _superToSub.get(sup);
    if (registeredSubs == null) {
      _superToSub.set(sup, (registeredSubs = []));
    }
    registeredSubs.push(sub);

    let registeredSups = _subToSuper.get(sub);
    if (registeredSups == null) {
      _subToSuper.set(sub, (registeredSups = []));
    }
    registeredSups.push(sup);

    this.resetRankList(sub);
  }

  resetRankList(target) {
    const { _superToSub, _deriveListMap: _rankListMap } = this;

    _rankListMap.delete(target);

    const subs = _superToSub.get(target);
    if (subs == null) {
      return;
    }

    lforEach1((sub) => this.resetRankList(sub), subs)
  }

  findSupers(target) {
    const { _deriveListMap } = this;

    let result = _deriveListMap.get(target);
    if (result == null) {
      _deriveListMap.set(target, (result = _sort(this._subToSuper, target)))
    }

    return result;
  }
}

function _sort(relMap, target) {
  const visitSet = new Set();
  return _sortImpl(visitSet, relMap, target);
}

function _sortImpl(visitSet, relMap, target) {
  if (visitSet.has(target)) {
    throw Error("expects DAG, but found cycles");
  }
  visitSet.add(target);

  const relatives = relMap.get(target);

  if (relatives == null) {
    return listOf(target);
  }

  return lconcatI(target, ...map1(pa2(_sortImpl, visitSet, relMap), relatives))
}
