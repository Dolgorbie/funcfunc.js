import { toUInt } from "../asfunc";

export class RingQueue {
  constructor(capacity) {
    this._capacity = toUInt(capacity);
    this._buffer = Array.from({ length: this._capacity });
    this._filled = 0;
    this._popped = 0;
    this._circulated = false;
  }

  get size() {
    const { _capacity, _filled, _popped, _circulated } = this;
    return _circulated ? _capacity - _popped + _filled : _filled - _popped;
  }

  get capacity() {
    return this._capacity;
  }

  add(value) {
    this._refreshAddState();

    this._buffer[this._filled++] = value;

    const { size } = this;
    if (size > this._capacity) {
      this._popped += size - this._capacity;
    }

    return true;
  }

  pop() {
    this._refreshPopState();

    if (this.size === 0) {
      return void 0;
    }

    return this._buffer[this._popped++];
  }

  peek() {
    this._refreshPopState();

    if (this.size === 0) {
      return void 0;
    }

    return this._buffer[this._popped];
  }

  clear() {
    this._filled = 0;
    this._popped = 0;
    this._circulated = false;
  }

  forEach(callback, thisArg = void 0) {
    callback = thisArg === void 0 ? callback : callback.bind(thisArg);
    const { _buffer, _popped, _circulated } = this;

    if (_circulated) {
      const { _filled } = this;
      for (let i = _popped; i < _filled; ++i) {
        callback(_buffer[i]);
      }
      return;
    }

    const { _capacity } = this;
    for (let i = _popped; i < _capacity; ++i) {
      callback(_buffer[i]);
    }
    for (let i = 0; i < _popped; ++i) {
      callback(_buffer[i]);
    }
  }

  _refreshAddState() {
    if (this._filled >= this._capacity) {
      this._filled = 0;
      this._circulated = true;
    }
  }

  _refreshPopState() {
    if (this._circulated && this._popped >= this._capacity) {
      this._popped = 0;
      this._circulated = false;
    }
  }
}
