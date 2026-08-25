import { fail, isSuccess, orDefault } from "../failable";

const _deleteMark = Symbol("delete mark");

export class DStackQueue {
  _leftBuffer = [];
  _rightBuffer = [];
  _deleted = 0;

  constructor() {
  }

  get capacity() {
    return Number.POSITIVE_INFINITY
  }

  get filled() {
    return this._leftBuffer.length + this._rightBuffer.length;
  }

  get size() {
    return this.filled - this._deleted;
  }

  push(value) {
    const { _leftBuffer, _rightBuffer } = this;

    if (_rightBuffer.length === 0 && _leftBuffer.length === 0) {
      _leftBuffer.push(value);
    } else {
      _rightBuffer.push(value);
    }
    return true;
  }

  pop() {
    const value = this._tryPop();
    if (isSuccess(value)) {
      return value;
    }
    this.flush();
    return orDefault(this._tryPop(), void 0);
  }

  delete(target) {
    const { _leftBuffer, _rightBuffer } = this;
    const leftLength = _leftBuffer.length;
    const rightLength = _rightBuffer.length;

    for (let i = rightLength - 1; i >= 0; --i) {
      const value = _rightBuffer[i];
      if (Object.is(value, target)) {
        _rightBuffer[i] = _deleteMark;
        this._deleted += 1;
        return true;
      }
    }

    for (let i = 0; i < leftLength; ++i) {
      const value = _leftBuffer[i];
      if (Object.is(value, target)) {
        _leftBuffer[i] = _deleteMark;
        this._deleted += 1;
        return true;
      }
    }

    return false;
  }

  flush() {
    const { _leftBuffer, _rightBuffer } = this;
    const leftLength = _leftBuffer.length;
    const rightLength = _rightBuffer.length;

    const buffer = [];

    for (let i = rightLength - 1; i >= 0; --i) {
      const value = _rightBuffer[i];
      if (value === _deleteMark) {
        this._deleted -= 1;
        continue;
      }
      buffer.push(value);
    }

    for (let i = 0; i < leftLength; ++i) {
      const value = _leftBuffer[i];
      if (value === _deleteMark) {
        this._deleted -= 1;
        continue;
      }
      buffer.push(value);
    }

    this._leftBuffer = buffer;
    this._rightBuffer = [];
  }

  _tryPop() {
    const { _leftBuffer } = this;
    while (_leftBuffer.length > 0) {
      const value = _leftBuffer.pop();

      if (value !== _deleteMark) {
        return value;
      }
      this._deleted -= 1;
    }

    return fail(void 0);
  }
}
