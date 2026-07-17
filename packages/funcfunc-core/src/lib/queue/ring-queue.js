import { toUInt } from "../asfunc";

export class RingQueue {
  constructor(capacity) {
    if (capacity < 2) {
      throw RangeError();
    }

    this._capacity = toUInt(capacity);
    this._buffer = Array.from({ length: this._capacity });
    this._filled = 1;
    this._popped = 0;
  }

  get size() {
    const { _filled, _popped } = this;
    if (_popped < _filled) {
      return _filled - _popped - 1;
    }
    const { _capacity } = this;
    return _capacity - _popped + _filled - 1;
  }

  get capacity() {
    return this._capacity;
  }

  add(value) {
    this._buffer[this._filled++] = value;

    return true;
  }

  pop() {
    return this._buffer[this._popped++];
  }

  peek() {
    if (this._capacity - this._popped === 1) {
      this._popped = 0;
    }

    if (this._filled - this._popped === 1) {
      return void 0;
    }

    return this._buffer[this._popped + 1];
  }

  clear() {
    this._filled = 1;
    this._popped = 0;
  }

  forEach(callback, thisArg = void 0) {
    callback = thisArg === void 0 ? callback : callback.bind(thisArg);
    const { _buffer, _filled, _popped } = this;

    if (_filled - _popped > 1) {
      for (let i = _popped + 1; i < _filled; ++i) {
        callback(_buffer[i]);
      }
      return;
    }

    const { _capacity } = this;
    for (let i = _popped + 1; i < _capacity; ++i) {
      callback(_buffer[i]);
    }
    for (let i = 0; i < _filled; ++i) {
      callback(_buffer[i]);
    }
  }
}
