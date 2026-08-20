
export function fm(strs, ...toStrFuncs) {
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

export const boolean = fm.b = function boolean(
  prop,
  {
    precision = void 0,
    width = void 0,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    return _applyWidth(!!value + "", precision, width);
  };
}

export const string = fm.s = function string(
  prop,
  {
    precision = void 0,
    width = void 0,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    return _applyWidth(String(value), precision, width);
  };
}

export const character = fm.c = function character(
  prop,
  {
    width = void 0,
  } = {}) {
  return (args) => {
    const value = _findValue(prop, args);
    if (typeof value !== "number") {
      throw TypeError(`expects number, but got: ${value}`);
    }

    return _applyWidth(String.fromCodePoint(value), void 0, width);
  };
}

export const digits = fm.d = function digits(
  prop,
  {
    width = void 0,
    sign = void 0,
    group = false,
  } = {}) {
  return (args) => {
    let value = _findValue(prop, args);
    if (typeof value !== "number") {
      throw TypeError(`expects number, but got: ${value}`);
    }

    const s = Math.sign(value);
    const abs = Math.trunc(Math.abs(value));
    let res = {
      _padS: "",
      _signS: "",
      _padZ: "",
      _body: abs.toString(),
      _signE: "",
      _padE: "",
    };

    res._body = group ? _groupNumStr(res._body) : res._body;
    res = { ...res, ..._signStr(s, sign) };

    if (width) {
      res = { ...res, ..._widthNumStr(res, width) };
    }

    return `${res._padS}${res._signS}${res._padZ}${res._body}${res._signE}${res._padE}`;
  };
};

function _groupNumStr(str) {
  const { length } = str;
  const res = [];
  for (let i = 0; i * 3 < length; ++i) {
    res.push(str.substring(length - 3 * (i + 1), length - 3 * i));
  }
  return res.reverse().join(",");
}

function _signStr(sign, option) {
  if (option === void 0) {
    return sign < 0 ? { _signS: "-" } : {};
  }
  switch (option) {
    case " ":
      return { _signS: sign < 0 ? "-" : " " };
    case "(":
      return sign < 0 ? { _signS: "(", _signE: ")" } : {};
    case "+":
      return { _signS: sign < 0 ? "-" : "+" };
    default:
      throw Error(`unrecognized sign specifier: ${sign}`);
  }
}

function _widthNumStr(acc, { size, pad = "start" }) {
  const { _signS, _body, _signE } = acc;
  const current = _signS.length + _body.length + _signE.length;
  const gap = size - current;
  if (gap <= 0) {
    return;
  }

  switch (pad) {
    case "0":
      return { ...acc, _padZ: "0".repeat(gap) };
    case "end":
      return { ...acc, _padE: " ".repeat(gap) };
    case "start":
      return { ...acc, _padS: " ".repeat(gap) };
    default:
      throw Error(`unrecognized pad specifier: ${pad}`);
  }
}

export const octal = fm.o = function octal(
  prop,
  {
    width = void 0,
    indicator = false,
  } = {}
) {
  return (args) => {
    let value = _findValue(prop, args);
    if (typeof value !== "number") {
      throw TypeError(`expects number, but got: ${value}`);
    }

    value = value >>> 0;
    let res = {
      _ind: indicator ? "0" : "",
      _padS: "",
      _body: value.toString(8),
      _padE: "",
    };

    if (width) {
      const { size, pad } = width;
      const current = res._ind.length + res._body.length;
      const gap = size - current;
      if (gap > 0) {
        switch (pad) {
          case "0":
            res._padS = "0".repeat(gap);
            break;
          case "end":
            res._padE = " ".repeat(gap);
            break;
          case "start":
            res._padS = " ".repeat(gap);
            break;
          default:
            throw Error(`unrecognized pad specifier: ${pad}`);
        }
      }
    }

    return `${res._ind}${res._padS}${res._body}${res._padE}`;
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

function _applyWidth(strValue, precision, width) {
  if (precision !== void 0 && strValue.length > precision) {
    strValue = strValue.substring(0, precision);
  }
  if (width === void 0) {
    return strValue;
  }
  const { size, pad = "start" } = width;
  switch (pad) {
    case "end":
      return strValue.padEnd(size, " ");
    case "start":
      return strValue.padStart(size, " ");
    default:
      throw Error(`unrecognized pad specifier: ${pad}`);
  }
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
