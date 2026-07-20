export class RingQueue {
  constructor(sizeFactor) {
    if (sizeFactor < 0) {
      throw RangeError();
    }

    this._factor = sizeFactor >>> 0;
    this._capacity = 1 << this._factor;
    this._modMask = this._capacity - 1;

    this._buffer = new Array(this._capacity);
    this._filled = 0;
    this._popped = 0;
  }

  get size() {
    return (this._filled - this._popped) >>> 0;
  }

  get capacity() {
    return this._capacity;
  }

  add(value) {
    const { _capacity, _modMask, _buffer, _filled } = this;

    if (this.size === _capacity) {
      const { _popped } = this;
      _buffer[_popped & _modMask] = void 0;
      this._popped = (_popped + 1) >>> 0;
    }

    _buffer[_filled & _modMask] = value;
    this._filled = (_filled + 1) >>> 0;

    return true;
  }

  pop() {
    if (this.size === 0) {
      return void 0;
    }

    const { _modMask, _buffer, _popped } = this;

    const index = _popped & _modMask
    const value = _buffer[index];

    _buffer[index] = void 0;
    this._popped = (_popped + 1) >>> 0;

    return value;
  }

  peek() {
    if (this.size === 0) {
      return void 0;
    }

    return this._buffer[this._popped & this._modMask];
  }

  clear() {
    this._buffer = new Array(this._capacity);
    this._filled = 0;
    this._popped = 0;
  }

  forEach(callback, thisArg = void 0) {
    const { _modMask, _buffer, _filled, _popped } = this;

    for (let i = _popped; ((_filled - i) >>> 0) > 0; ++i) {
      callback.call(thisArg, _buffer[i & _modMask]);
    }
  }
}
