import { pa1 } from "./core";
import { car, cdr, concatI, cons, findTail, isNil, iter, listOf, nil, removeI, reverse, reverseI } from "./list";

export class Queue {
  constructor(...values) {
    this._size = values.length;
    this._values = listOf(...values);
    this._added = nil();
  }

  get size() {
    return this._size;
  }

  add(value) {
    this._size += 1;
    this._added = cons(value, this._added);
    return this;
  }

  pop() {
    if (isNil(this._values)) {
      this._arrange();
    }

    this._size -= 1;
    const value = car(this._values);
    this._values = cdr(this._values);
    return value;
  }

  peek() {
    if (isNil(this._values)) {
      this._arrange();
    }
    return car(this._values);
  }

  has(value) {
    const compare = pa1(Object.is, value)
    return !isNil(findTail(compare, this._values)) || !isNil(findTail(compare, this._added));
  }

  *values() {
    yield* iter(this._values);
    yield* iter(reverse(this._added));
  }

  keys() {
    return this.values();
  }

  *entries() {
    for (const v of this.values()) {
      yield [v, v];
    }
  }

  remove(value) {
    this._arrange();
    this._values = removeI(value, this._values);
  }

  clear() {
    this._size = 0;
    this._values = nil();
    this._added = nil();
  }

  forEach(callback, thisArg = void 0) {
    callback = thisArg === void 0 ? callback : callback.bind(thisArg);
    for (const v of this.values()) {
      callback(v, v, this);
    }
  }

  [Symbol.iterator]() {
    return this.values();
  }

  _arrange() {
    this._values = concatI(this._values, reverseI(this._added));
    this._added = nil();
  }
}
