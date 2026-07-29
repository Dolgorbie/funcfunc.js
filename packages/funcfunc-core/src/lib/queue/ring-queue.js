const _deleteMark = Symbol("delete mark");

export class RingQueue {
  _drop = false;
  _factor = 0;
  _mask = 0;
  _buffer = null;
  _pushed = 0;
  _popped = 0;
  _deleted = 0;

  constructor(capacityHint = 4, drop = false) {
    this._drop = drop;
    this._reset(_factorFromHint(capacityHint));
  }

  get capacity() {
    return this._buffer.length;
  }

  get filled() {
    return this._pushed - this._popped >>> 0;
  }

  get size() {
    return this.filled - this._deleted;
  }

  push(value) {
    if (this.filled === this.capacity) {
      if (!this._drop) {
        return false;
      }
      this.pop();
    }

    const { _mask, _buffer, _pushed } = this;
    _buffer[_pushed & _mask] = value;
    this._pushed = _pushed + 1 >>> 0;
    return true;
  }

  pop() {
    const { _mask, _buffer, _pushed, _popped } = this;

    for (let i = _popped; (_pushed - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask;
      const value = _buffer[index];

      _buffer[index] = void 0;

      if (value !== _deleteMark) {
        this._popped = i + 1 >>> 0;
        return value;
      }

      this._deleted -= 1;
    }

    return void 0;
  }

  peek() {
    const { _mask, _buffer, _pushed, _popped } = this;

    for (let i = _popped; (_pushed - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask;
      const value = _buffer[index];

      if (value !== _deleteMark) {
        return value;
      }
    }

    return void 0;
  }

  delete(target) {
    const { _mask, _buffer, _pushed, _popped } = this;

    for (let i = _popped; (_pushed - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask;
      const value = _buffer[index];

      if (Object.is(value, target)) {
        _buffer[index] = _deleteMark;
        this._deleted += 1;
        return true;
      }
    }
    return false;
  }

  extend(capacityHint) {
    const { _factor, _mask, _buffer, _pushed, _popped } = this;
    const newFactor = Math.max(_factor + 1, _factorFromHint(capacityHint));

    this._reset(newFactor);

    for (let i = _popped; (_pushed - i >>> 0) > 0; ++i) {
      const index = i & _mask;
      const value = _buffer[index];

      if (value === _deleteMark) {
        continue;
      }

      this.push(value);
    }
  }

  _reset(factor) {
    const capacity = 1 << factor;

    this._factor = factor;
    this._mask = capacity - 1;
    this._buffer = new Array(capacity);
    this._pushed = 0;
    this._popped = 0;
    this._deleted = 0;
  }
}

function _factorFromHint(hint) {
  if (hint <= 0) {
    throw Error(`expects hint be larger than 0, but got ${hint}`);
  }
  return 32 - Math.clz32(hint - 1);
}
