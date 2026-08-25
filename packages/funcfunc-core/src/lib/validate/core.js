import { fail, isFailed, isSuccess, reasonOf } from "../failable";

export function all(...validators) {
  return (target, detail) => {
    let tmp = target;

    for (const v of validators) {
      const res = v(tmp, detail);
      if (isFailed(res)) {
        return res;
      }
      tmp = res;
    }

    return tmp;
  };
}

export function allSettled(...validators) {
  return (target, detail) => {
    let tmp = target;
    const allReasons = [];

    for (const v of validators) {
      const res = v(tmp, detail);
      if (isFailed(res)) {
        allReasons.push(...reasonOf(res));
        continue;
      }
      tmp = res;
    }

    if (allReasons.length === 0) {
      return tmp;
    }
    return fail(...allReasons);
  };
}

export function any(...validators) {
  return (target, detail) => {
    const allReasons = [];

    for (const v of validators) {
      const res = v(target, detail);
      if (isSuccess(res)) {
        return res;
      }
      allReasons.push(...reasonOf(res));
    }

    return fail(...allReasons);
  };
}

export function isTypeof(type) {
  return (target, detail) => {
    return typeof target === type ? target : fail(new ValidationError(detail, `expects ${type}, but got ${typeof target}`));
  };
}

export const isBoolean = isTypeof("boolean");
export const isNumber = isTypeof("number");
export const isBigint = isTypeof("bigint");
export const isString = isTypeof("string");
export const isSymbol = isTypeof("symbol");
export const isFunction = isTypeof("function");

export function isNull() {
  return (target, detail) => {
    return target === null ? target : fail(new ValidationError(detail, "expects null"));
  };
}

export function nonNull() {
  return (target, detail) => {
    return target === null ? fail(new ValidationError(detail, "expects non-null")) : target;
  };
}

export function isUndef() {
  return (target, detail) => {
    return target === void 0 ? target : fail(new ValidationError(detail, "expects undefined"));
  };
}

export function nonUndef() {
  return (target, detail) => {
    return target === void 0 ? fail(new ValidationError(detail, "expects non-undefined")) : target;
  };
}

export function isNullish() {
  return (target, detail) => {
    return target == null ? target : fail(new ValidationError(detail, "expects null or undefined"));
  };
}

export function nonNullish() {
  return (target, detail) => {
    return target == null ? fail(new ValidationError(detail, "expects non-null nor non-undefined")) : target;
  };
}

export function isObject() {
  return (target, detail) => {
    return target != null && typeof target === "object" ? target : fail(new ValidationError(detail, "expects object"));
  };
}

export function isArray() {
  return (target, detail) => {
    return Array.isArray(target) ? target : fail(new ValidationError(detail, "expects array"));
  };
}

export function isIterOf(validator) {
  return (target, detail) => {
    const allReasons = [];
    let i = 0;
    for (const e of target) {
      const res = validator(e, { ...detail, value: e, path: [...detail.path, i] })
      if (isFailed) {
        allReasons.push(...reasonOf(res));
      }
      i += 1;
    }
    return allReasons.length === 0 ? target : fail(...allReasons);
  };
}

export class ValidationError extends Error {
  constructor(detail, ...args) {
    super(...args);
    this.detail = detail;
  }
}
