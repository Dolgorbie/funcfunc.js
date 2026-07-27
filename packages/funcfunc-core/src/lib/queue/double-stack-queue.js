import { AbstractQueue } from "./core";

const _deleteMark = Symbol("delete mark");

export class DStackQueue extends AbstractQueue {
  _leftBuffer = null;
  _rightBuffer = null;
  _leftSize = 0;
  _rightSize = 0;
  _deleted = 0;

  constructor(capacity = 2, policy = null) {
    super(policy);
    this._reset(capacity);
  }

  get capacity() {
    return this._leftBuffer.length + this._rightBuffer.length;
  }

  get filled() {
    return this._leftSize + this._rightSize;
  }

  get size() {
    return this.filled - this._deleted;
  }

  tryAdd(value) {
    const { _rightSize } = this;

    if (this._leftSize === 0 && _rightSize === 0) {
      this._leftBuffer[0] = value;
      this._leftSize += 1;
      return true;
    }

    const { _rightBuffer } = this;
    const _rightCapacity = _rightBuffer.length;

    if (_rightSize === _rightCapacity) {
      return false;
    }

    _rightBuffer[_rightSize] = value;
    this._rightSize += 1;
    return true;
  }

  tryPop() {
    const [leftSize, value, recycled] = _tryPopSub(this._deleted, this._leftSize, this._leftBuffer);
    if (leftSize >= 0) {
      this._leftSize = leftSize;
      this._deleted -= recycled;
      return { value, success: true };
    }

    this._swap();
    const [nextLeftSize, nextValue, nextRecycled] = _tryPopSub(this._deleted, this._leftSize, this._leftBuffer);
    if (nextLeftSize >= 0) {
      this._leftSize = nextLeftSize;
      this._deleted -= nextRecycled;
      return { value: nextValue, success: true };
    }
    this._leftSize = 0;
    this._deleted = 0;
    return { value: void 0, success: false };
  }

  _swap() {
    const { _leftBuffer, _rightBuffer, _rightSize } = this;
    const _leftCapacity = _leftBuffer.length;

    let currentRightSize = _rightSize;
    let i;
    for (i = 0; i < _leftCapacity; ++i) {
      const [nextRightSize, value] = _tryPopSub(currentRightSize, _rightBuffer);
      if (nextRightSize < 0) {
        break;
      }
      currentRightSize = nextRightSize;
      _leftBuffer[i] = value;
    }

    this._leftSize = i;
    this._rightSize = 0;
    this._deleted = 0;
  }

  _reset(capacity) {
    const rightCap = capacity / 2 | 0;
    const leftCap = capacity - rightCap;

    this._leftBuffer = new Array(leftCap);
    this._rightBuffer = new Array(rightCap);
    this._leftSize = 0;
    this._rightSize = 0;
    this._deleted = 0;
  }
}


function _tryPopSub(size, buffer) {
  let recycled = 0;
  for (let i = size - 1; i >= 0; --i) {
    const value = buffer[i];
    buffer[i] = void 0;
    if (value !== _deleteMark) {
      return [i, value, recycled];
    }
    recycled += 1;
  }
  return [-1, void 0, recycled];
}
