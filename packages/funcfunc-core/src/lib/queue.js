import { reverseIter } from "./arrays";

export class Queue {
  constructor(...values) {
    this._values = values.reverse();
    this._added = [];
  }

  get size() {
    return this._values.length + this._added.length;
  }

  add(value) {
    this._added.push(value);
    return this;
  }

  pop() {
    if (this._values.length === 0) {
      this._arrange();
    }
    return this._values.pop();
  }

  peek() {
    if (this._values.length === 0) {
      this._arrange();
    }
    return this._values[0];
  }

  has(value) {
    return this._values.includes(value) || this._added.includes(value);
  }

  values() {
    this._arrange();
    return reverseIter(this._values);
  }

  keys() {
    return this.values();
  }

  *entries() {
    for (const v of this.values()) {
      yield [v, v];
    }
  }

  clear() {
    this._values = [];
    this._added = [];
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
    if (this._added.length === 0) {
      return;
    }

    const newValues = this._added.reverse();
    for (const oldValue of this._values) {
      newValues.push(oldValue);
    }
    this._values = newValues;
    this._added = [];
  }
}
