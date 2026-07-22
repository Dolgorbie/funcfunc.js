const _deletedMark = Symbol("deleted item");

export class InfQueue {
  constructor() {
    this._factor = 2;
    const capacity = 1 << this._factor;
    this._indexMask = capacity - 1;
    this._buffer = new Array(capacity);
    this._popped = 0;
    this._added = 0;
    this._deleted = 0;
  }

  get size() {
    return (this._added - this._popped >>> 0) - this._deleted;
  }

  add(value) {
    if ((this._added - this._popped >>> 0) === this._buffer.length) {
      this._expand();
    }

    this._buffer[this._added & this._indexMask] = value;
    this._added = this._added + 1 >>> 0;
    return true;
  }

  pop() {
    for (let i = this._popped; (this._added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const value = this._buffer[i & this._indexMask];
      this._buffer[i & this._indexMask] = void 0;

      if (value !== _deletedMark) {
        this._popped = i + 1 >>> 0;
        return value;
      }

      this._deleted -= 1;
    }

    return void 0;
  }

  peek() {
    const { _popped } = this;

    for (let i = _popped; (this._added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const value = this._buffer[i & this._indexMask];

      if (value !== _deletedMark) {
        return value;
      }

      this._buffer[i & this._indexMask] = void 0;
      this._popped = i;
      this._deleted -= 1;
    }

    return void 0;
  }

  delete(value) {
    for (let i = this._popped; (this._added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const valueI = this._buffer[i & this._indexMask];
      if (Object.is(value, valueI)) {
        this._buffer[i & this._indexMask] = _deletedMark;
        this._deleted += 1;
        return true;
      }
    }
    return false;
  }

  clear() {
    this._factor = 2;
    const capacity = 1 << this._factor;
    this._indexMask = capacity - 1;
    this._buffer = new Array(capacity);
    this._popped = 0;
    this._added = 0;
    this._deleted = 0;
  }

  forEach(callback, thisArg = void 0) {
    for (let i = this._popped; (this._added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const valueI = this._buffer[i & this._indexMask];
      if (valueI === _deletedMark) {
        continue;
      }
      callback.call(thisArg, valueI);
    }
  }

  _expand() {
    const newFactor = this._factor + 1;
    const newCapacity = 1 << newFactor;
    const newIndexMask = newCapacity - 1;
    const newBuffer = new Array(newCapacity);

    let i, j;
    for (i = 0, j = this._popped; (this._added - i >>> 0) > 0; j = j + 1 >>> 0) {
      const value = this._buffer[j & this._indexMask];
      if (value === _deletedMark) {
        continue;
      }
      newBuffer[i++] = value;
    }

    this._factor = newFactor;
    this._indexMask = newIndexMask;
    this._buffer = newBuffer;
    this._popped = 0;
    this._added = i;
  }
}
