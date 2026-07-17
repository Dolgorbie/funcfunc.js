
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
    this._input.push(value);
    return true;
  }

  pop() {
    if (this._refreshRequired()) {
      this._refresh();
    }
    return this._output.pop();
  }

  peek() {
    if (this._refreshRequired()) {
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
      if (i in _input && Object.is(_input[i], value)) {
        delete _input[i];
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
    callback = thisArg === void 0 ? callback : callback.bind(thisArg);
    const { _output, _input } = this;

    const nOut = _output.length;
    for (let i = nOut - 1; i >= 0; --i) {
      callback(_output[i]);
    }

    const nIn = _input.length;
    for (let i = 0; i < nIn; ++i) {
      if (i in _input) {
        callback(_input[i]);
      }
    }
  }

  _refreshRequired() {
    return this._output.length === 0;
  }

  _refresh() {
    const { _output, _input } = this;
    const nOut = _output.length;
    const nIn = _input.length;
    const newOutput = [];

    for (let i = nIn - 1; i >= 0; --i) {
      if (i in _input) {
        newOutput.push(_input[i]);
      }
    }

    for (let i = 0; i < nOut; ++i) {
      newOutput.push(_output[i]);
    }

    this._emptyCellCount = 0;
    this._output = newOutput;
  }
}
