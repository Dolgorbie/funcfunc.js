const _deletedMark = Symbol("deleted item");

export class InfQueue {
  constructor(sizeFactor = 2) {
    this._initFactor = sizeFactor;
    this._reset(sizeFactor);
  }

  get size() {
    return (this._added - this._popped >>> 0) - this._deleted;
  }

  add(value) {
    if ((this._added - this._popped >>> 0) === this._buffer.length) {
      this._expand();
    }

    const { _added } = this;

    this._buffer[_added & this._mask] = value;
    this._added = _added + 1 >>> 0;
    return true;
  }

  pop() {
    const { _mask, _buffer, _popped, _added } = this;

    for (let i = _popped; (_added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask
      const value = _buffer[index];

      _buffer[index] = void 0;

      if (value !== _deletedMark) {
        this._popped = i + 1 >>> 0;
        return value;
      }

      this._deleted -= 1;
    }

    return void 0;
  }

  peek() {
    const { _mask, _buffer, _popped, _added } = this;

    for (let i = _popped; (_added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const value = _buffer[i & _mask];
      if (value !== _deletedMark) {
        return value;
      }
    }

    return void 0;
  }

  delete(target) {
    const { _mask, _buffer, _popped, _added } = this;

    for (let i = _popped; (_added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask;
      const value = _buffer[index];
      if (Object.is(target, value)) {
        _buffer[index] = _deletedMark;
        this._deleted += 1;
        return true;
      }
    }
    return false;
  }

  clear() {
    this._reset(this._initFactor);
  }

  _reset(factor) {
    const capacity = 1 << this.factor;

    this._factor = factor;
    this._mask = capacity - 1;

    this._buffer = new Array(capacity);
    this._popped = 0;
    this._added = 0;
    this._deleted = 0;
  }

  _expand() {
    const { _factor, _mask, _buffer, _popped, _added } = this;

    this._reset(_factor + 1);

    const { _buffer: newBuffer } = this;

    let i, j;
    for (i = _popped, j = 0; (_added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const value = _buffer[i & _mask];
      if (value === _deletedMark) {
        continue;
      }
      newBuffer[j++] = value;
    }

    this._added = j;
  }
}
