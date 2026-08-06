export function fmt(strs, ...toStrFuncs) {
  const toStrFuncsLength = toStrFuncs.length;
  const resTemplate = new Array(strs.length + toStrFuncsLength).fill("");
  for (let i = 0; i <= toStrFuncsLength; ++i) {
    resTemplate[i * 2] = strs[i];
  }

  return (arg) => {
    const res = resTemplate.slice();
    for (let i = 0; i < toStrFuncsLength; ++i) {
      res[i * 2 + 1] = toStrFuncs[i](arg);
    }
    res[toStrFuncsLength * 2] = strs[toStrFuncsLength];
    return res.join("");
  };
}

export const boolean = fmt.b = function boolean(prop) {
  return (...args) => {
    let value;
    if (typeof prop === "number") {
      value = args[0];
    } else if (prop in args[0]) {
      value = args[0][prop];
    } else {
      return "";
    }

    return (!!value) + "";
  };
}

export const string = fmt.s = function string(prop) {
  return (...args) => {
    let value;
    if (typeof prop === "number") {
      value = args[0];
    } else if (prop in args[0]) {
      value = args[0][prop];
    } else {
      return "";
    }

    return String(value);
  };
}

export const digits = fmt.d = function digits(prop, length, fillString = "") {
  return (obj) => {
    if (!(prop in obj)) {
      return "";
    }

    const value = obj[prop];
    if (typeof value !== "number" && typeof value !== "bigint") {
      throw TypeError(`expects number or bigint, but got ${value}`);
    }

    if (length === void 0) {
      return String(value);
    }

    return String(value).padStart(length, fillString);
  };
};
