
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
    const { _values } = this;
    if (_values.length > 0) {
      return this._values.pop();
    }
    this._values = this._added.reverse();
    this._added = [];
  }

  delete(value) {
    let index = this._values.lastIndexOf(value);
    if (index >= 0) {
      this._values.splice(index, 1);
      return true;
    }

    index = this._added.indexOf(value);
    if (index >= 0) {
      this._added.splice(index, 1);
      return true;
    }

    return false;
  }

  has(value) {
    this._values.includes(value) || this._added.includes(value);
  }

  *values() {
    const { _values } = this;
    const nValues = _values.length;
    for (let i = nValues - 1; i >= 0; --i) {
      yield _values[i];
    }

    yield* this._added;
  }

  keys() {
    return this.values();
  }

  *entries() {
    for (const v of this.values()) {
      yield* [v, v];
    }
  }

  clear() {
    this._values = [];
    this._added = [];
  }

  forEach(callback, thisArg = void 0) {
    callback = thisArg === void 0 ? callback : callback.bind(thisArg);
    for (const v of this._values()) {
      callback(v);
    }
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
