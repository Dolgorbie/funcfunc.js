const _deleted = Symbol("deleted item");

export class InfQueue {
  constructor() {
    this._output = [];
    this._input = [];
    this._emptyCellCount = 0;
  }

  get size() {
    return this._output.length + this._input.length - this._emptyCellCount;
  }

  add(value) {
    const { _output, _input } = this;

    if (_input.length === 0 && _output.length === 0) {
      _output.unshift(value);
      return true;
    }

    _input.push(value);
    return true;
  }

  pop() {
    if (this._output.length === 0) {
      this._refresh();
    }
    return this._output.pop();
  }

  peek() {
    if (this._output.length === 0) {
      this._refresh();
    }

    const { _output } = this;
    const { length } = _output;
    return length === 0 ? void 0 : _output[length - 1];
  }

  delete(value) {
    const { _output } = this;
    const nOut = _output.length;
    for (let i = nOut - 1; i >= 0; --i) {
      if (Object.is(_output[i], value)) {
        _output.splice(i, 1);
        return true;
      }
    }

    const { _input } = this;
    const nIn = _input.length;
    for (let i = 0; i < nIn; ++i) {
      if (Object.is(_input[i], value)) {
        _input[i] = _deleted;
        this._emptyCellCount += 1;
        return true;
      }
    }

    return false;
  }

  clear() {
    this._output.length = 0;
    this._input.length = 0;
    this._emptyCellCount = 0;
  }

  forEach(callback, thisArg = void 0) {
    const { _output, _input } = this;

    const nOut = _output.length;
    for (let i = nOut - 1; i >= 0; --i) {
      callback.call(thisArg, _output[i]);
    }

    const nIn = _input.length;
    for (let i = 0; i < nIn; ++i) {
      if (_input[i] !== _deleted) {
        callback.call(thisArg, _input[i]);
      }
    }
  }

  _refresh() {
    const { _output, _input } = this;
    const nIn = _input.length;

    for (let i = nIn - 1; i >= 0; --i) {
      if (_input[i] !== _deleted) {
        _output.push(_input[i]);
      }
    }

    this._input = [];
    this._emptyCellCount = 0;
  }
}
