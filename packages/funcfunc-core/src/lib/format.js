export function fmt(strs, ...toStrFuncs) {
  const toStrFuncsLength = toStrFuncs.length;
  const resTemplate = new Array(strs.length + toStrFuncsLength).fill("");
  for (let i = 0; i <= toStrFuncsLength; ++i) {
    resTemplate[i * 2] = strs[i];
  }

  return (...args) => {
    const res = resTemplate.slice();
    for (let i = 0; i < toStrFuncsLength; ++i) {
      res[i * 2 + 1] = toStrFuncs[i](args);
    }
    res[toStrFuncsLength * 2] = strs[toStrFuncsLength];
    return res.join("");
  };
}

export const boolean = fmt.b = function boolean(
  prop,
  {
    width = void 0,
    precision = void 0,
    alignLeft = false,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    return _applyWidth(!!value + "", width, precision, alignLeft);
  };
}

export const string = fmt.s = function string(
  prop,
  {
    width = void 0,
    precision = void 0,
    alignLeft = false,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    return _applyWidth(String(value), width, precision, alignLeft);
  };
}

export const character = fmt.c = function character(
  prop,
  {
    width = void 0,
    alignLeft = false,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    if (typeof value !== "number") {
      throw TypeError(`expects number, but got: ${value}`);
    }

    return _applyWidth(String.fromCodePoint(value), width, void 0, alignLeft);
  };
}

export const digits = fmt.d = function digits(
  prop,
  {
    width = void 0,
    alignLeft = false,
    forceSign = false,
    leadingSpace = false,
    leadingZeros = false,
    grouping = false,
    negativeParentheses = false,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    if (typeof value !== "number") {
      throw TypeError(`expects number, but got: ${value}`);
    }

    const strSign = _strSignOf(value, forceSign, leadingSpace);
    const strValue = Math.trunc(Math.abs(value)) + "";

    if (width === void 0) {
      return `${strSign}${strValue}`;
    }

    if (leadingZeros) {
      return `${strSign}${_applyWidth(strValue, width - strSign.length, void 0, false)}`;
    }

    return String(value).padStart(width, leadingZeros ? "0" : " ");
  };
};

function _findValue(prop, args) {
  if (typeof prop === "number") {
    return args[prop];
  } else if (prop in args[0]) {
    return args[0][prop];
  } else {
    throw Error(`unspecified property ${prop}`);
  }
}

function _applyWidth(strValue, width, precision, alignLeft) {
  if (precision !== void 0 && strValue.length > precision) {
    strValue = strValue.substring(0, precision);
  }
  if (width === void 0) {
    return strValue;
  }
  if (alignLeft) {
    return strValue.padEnd(width, " ");
  }
  return strValue.padStart(width, " ");
}

function _strSignOf(value, forceSign, leadingSpace) {
  if (forceSign && leadingSpace) {
    throw Error("expects `forceSign' or `leadingSpace' be false, but both are true.");
  }

  return value < 0 ? "-"
    : forceSign ? "+"
      : leadingSpace ? " "
        : "";
}
