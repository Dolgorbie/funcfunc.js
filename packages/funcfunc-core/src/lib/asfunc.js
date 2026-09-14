export const is = Object.is;

export function eq(x, y) {
  return x === y;
}

export function like(x, y) {
  return x == y;
}

export function same(x, y) {
  return x === y || x !== x && y !== y;
}

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
  return x != null && typeof x === "object";
}

export function isString(x) {
  return typeof x === "string";
}

export function isSymbol(x) {
  return typeof x === "symbol";
}

export function isPlainObject(x) {
  return x != null && typeof x === "object" && Object.getPrototypeOf(x) === Object.prototype;
}

export const isArray = Array.isArray;

export function isArrayLike(x) {
  return x != null && typeof x === "object" && typeof x.length === "number";
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

export function ref(obj, key) {
  return obj[key];
}

export function xref(key, obj) {
  return obj[key];
}

export function radd(x0, x1) {
  return x0 + x1;
}

export function rsub(x0, x1) {
  return x0 - x1;
}

export function rmul(x0, x1) {
  return x0 * x1;
}

export function rdiv(x0, x1) {
  return x0 / x1;
}

export function iadd(x0, x1) {
  return (x0 + x1) | 0;
}

export function isub(x0, x1) {
  return (x0 - x1) | 0;
}

export function imul(x0, x1) {
  return (x0 * x1) | 0;
}

export function iquot(x0, x1) {
  return (x0 / x1) | 0;
}

export function irem(x0, x1) {
  return x0 % x1;
}

export function idiv(x0, x1) {
  return (x0 - imod(x0, x1)) / x1;
}

export function imod(x0, x1) {
  return ((x0 % x1) + x1) % x1
}

export function toNumber(value) {
  return +value;
}

export function toInt(value) {
  return value | 0;
}

export function toUInt(value) {
  return (value >>> 0) & ~(value >> 31);
}

export function toBoolean(value) {
  return !!value;
}

export function toString(value) {
  return String(value);
}
