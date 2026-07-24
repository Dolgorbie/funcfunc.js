import { fail, isFailed, isSuccess, reasons } from "../failable";

export function all(...validators) {
  return (target) => {
    let tmp = target;

    for (const v of validators) {
      const res = v(tmp);
      if (isFailed(res)) {
        return res;
      }
      tmp = res;
    }

    return tmp;
  };
}

export function allSettled(...validators) {
  return (target) => {
    let tmp = target;
    const allReasons = [];

    for (const v of validators) {
      const res = v(tmp);
      if (isFailed(res)) {
        allReasons.push(...reasons(res));
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
  return (target) => {
    const allReasons = [];

    for (const v of validators) {
      const res = v(target);
      if (isSuccess(res)) {
        return res;
      }
      allReasons.push(...reasons(res));
    }

    return fail(...allReasons);
  };
}

export function isTypeof(type) {
  return (target) => {
    return typeof target === type ? target : fail(new ValidationError(target, `expects ${type}, but got ${typeof target}`));
  };
}

export const isBoolean = isTypeof("boolean");
export const isNumber = isTypeof("number");
export const isBigint = isTypeof("bigint");
export const isString = isTypeof("string");
export const isSymbol = isTypeof("symbol");
export const isFunction = isTypeof("function");

export function isNull(target) {
  return target === null ? target : fail(new ValidationError(target, "expects null"));
}

export function nonNull(target) {
  return target === null ? fail(new ValidationError(target, "expects non-null")) : target;
}

export function isUndef(target) {
  return target === void 0 ? target : fail(new ValidationError(target, "expects undefined"));
}

export function nonUndef(target) {
  return target === void 0 ? fail(new ValidationError(target, "expects non-undefined")) : target;
}

export function isNullish(target) {
  return target == null ? target : fail(new ValidationError(target, "expects null or undefined"));
}

export function nonNullish(target) {
  return target == null ? fail(new ValidationError(target, "expects non-null nor non-undefined")) : target;
}

export function isObject(target) {
  return target != null && typeof target === "object" ? target : fail(new ValidationError(target, "expects object"));
}

export function isArray(target) {
  return Array.isArray(target) ? target : fail(new ValidationError(target, "expects array"));
}

export function isIterOf(validator) {
  return (target) => {
    const allReasons = [];
    let i = 0;
    for (const e of target) {
      const res = validator(e)
      if (isFailed) {
        allReasons.push(...reasons(res));
      }
      i += 1;
    }
    return allReasons.length === 0 ? target : fail(...allReasons);
  };
}

export class ValidationError extends Error {
  constructor(target, ...args) {
    super(...args);
    this.target = target;
  }
}
