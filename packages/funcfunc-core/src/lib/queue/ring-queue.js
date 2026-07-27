import { AbstractQueue } from "./core";

const _deleteMark = Symbol("delete mark");

export class RingQueue extends AbstractQueue {
  _factor = 0;
  _mask = 0;
  _buffer = null;
  _added = 0;
  _popped = 0;
  _deleted = 0;

  constructor(capacityHint = 4, policy = null) {
    super(policy);
    this._reset(_factorFromHint(capacityHint));
  }

  get capacity() {
    return this._buffer.length;
  }

  get filled() {
    return this._added - this._popped >>> 0;
  }

  get size() {
    return this.filled - this._deleted;
  }

  tryAdd(value) {
    if (this.isFull()) {
      return false;
    }

    const { _mask, _buffer, _added } = this;
    _buffer[_added & _mask] = value;
    this._added = _added + 1 >>> 0;
    return true;
  }

  tryPop() {
    const { _mask, _buffer, _added, _popped } = this;
    for (let i = _popped; (_added - i >>> 0) > 0; i = i + 1 >>> 0) {
      const index = i & _mask;
      const value = _buffer[index];

      if (value !== _deleteMark) {
        this._popped = i + 1 >>> 0;
        return { value, success: true };
      }

      _buffer[index] = void 0;
      this._deleted -= 1;
    }
    return { value: void 0, success: false };
  }

  delete(target) {
    const { _mask, _buffer, _added, _popped } = this;
    for (let i = _added; (i - _popped >>> 0) > 0; i = i - 1 >>> 0) {
      const index = (i - 1 >>> 0) & _mask;
      const value = _buffer[index];
      if (Object.is(value, target)) {
        _buffer[index] = _deleteMark;
        return true;
      }
    }
    return false;
  }

  extend(capacityHint) {
    const { _factor, _mask, _buffer, _added, _popped } = this;

    const newFactor = Math.max(_factor * 2, _factorFromHint(capacityHint));
    this._reset(newFactor);

    for (let i = _popped; (_added - _popped >>> 0) > 0; ++i) {
      const index = i & _mask;
      const value = _buffer[index];
      if (value === _deleteMark) {
        continue;
      }
      this.tryAdd(value);
    }
  }

  _reset(factor) {
    const capacity = 1 << factor;

    this._factor = factor;
    this._mask = capacity - 1;
    this._buffer = new Array(capacity);
    this._added = 0;
    this._popped = 0;
    this._deleted = 0;
  }
}

function _factorFromHint(hint) {
  return 31 - Math.clz32(hint);
}
