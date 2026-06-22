export const isArray = Array.isArray;

export const is = Object.is;
export const objectFromEntries = Object.fromEntries;
export const objectEntries = Object.entries;
export const objectKeys = Object.keys;
export const objectValues = Object.values;
export const objectHasOwn = Object.hasOwn;
export const objectPrototypeOf = Object.getPrototypeOf;

export function isNull(x) {
  return x === null;
}

export function isUndef(x) {
  return x === void 0;
}

export function isBigint(x) {
  return typeof x === "bigint";
}

export function isBoolean(x) {
  return typeof x === "boolean";
}

export function isFunction(x) {
  return typeof x === "function";
}

export function isNumber(x) {
  return typeof x === "number";
}

export function isObject(x) {
  return x !== null && typeof x === "object";
}

export function isString(x) {
  return typeof x === "string";
}

export function isSymbol(x) {
  return typeof x === "symbol";
}

export function isInstanceOf(obj, clazz) {
  return obj instanceof clazz;
}

export function isAssignableFrom(clazz, obj) {
  return obj instanceof clazz;
}

export function newInstance(clazz, ...args) {
  return new clazz(...args);
}

export function newInstance0(clazz) {
  return new clazz();
}

export function newInstance1(clazz, arg0) {
  return new clazz(arg0);
}

export function newInstance2(clazz, arg0, arg1) {
  return new clazz(arg0, arg1);
}

export function newInstance3(clazz, arg0, arg1, arg2) {
  return new clazz(arg0, arg1, arg2);
}

export function newInstance4(clazz, arg0, arg1, arg2, arg3) {
  return new clazz(arg0, arg1, arg2, arg3);
}

export function ref(obj, key) {
  return obj[key];
}

export function xref(key, obj) {
  return obj[key];
}

export function add(x0, ...xs) {
  return xs.reduce(add2, x0);
}

export function add2(x0, x1) {
  return x0 + x1;
}

export function sub(x0, ...xs) {
  return xs.reduce(sub2, x0);
}

export function sub2(x0, x1) {
  return x0 - x1;
}

export function mul(x0, ...xs) {
  return xs.reduce(mul2, x0);
}

export function mul2(x0, x1) {
  return x0 * x1;
}

export function div(x0, ...xs) {
  return xs.reduce(div2, x0);
}

export function div2(x0, x1) {
  return x0 / x1;
}

export function quot(x0, ...xs) {
  return xs.reduce(quot2, x0);
}

export function quot2(x0, x1) {
  return (x0 / x1) | 0;
}

export function rem(x0, ...xs) {
  return xs.reduce(rem2, x0);
}

export function rem2(x0, x1) {
  return x0 % x1;
}

export function idiv(x0, ...xs) {
  return xs.reduce(idiv2, x0);
}

export function idiv2(x0, x1) {
  return (x0 - mod2(x0, x1)) / x1;
}

export function mod(x0, ...xs) {
  return xs.reduce(mod2, x0);
}

export function mod2(x0, x1) {
  return ((x0 % x1) + x1) % x1
}

export function toNumber(value) {
  return +value;
}

export function toInt(value) {
  return value | 0;
}

export function toUInt(value) {
  return (value | 0) & ~(value >> 31);
}

export function toString(value) {
  return `${value}`;
}
