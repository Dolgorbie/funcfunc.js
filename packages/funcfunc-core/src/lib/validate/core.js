import { isPlainObject as isPlainObjectImpl } from "../asfunc";
import { fail, isFailed, isSuccess, reasonOf } from "../failable";

export function validate(validator, target) {
  return validator(target, { target, path: [], validator });
}


export function vall(validators) {
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

export function vallSettled(validators) {
  return (target, detail) => {
    let tmp = target;
    const allReasons = [];

    for (const v of validators) {
      const res = v(tmp, detail);
      if (isFailed(res)) {
        allReasons.push(reasonOf(res));
        continue;
      }
      tmp = res;
    }

    if (allReasons.length === 0) {
      return tmp;
    }
    return fail(allReasons);
  };
}

export function vany(validators) {
  return (target, detail) => {
    const allReasons = [];

    for (const v of validators) {
      const res = v(target, detail);
      if (isSuccess(res)) {
        return res;
      }
      allReasons.push(reasonOf(res));
    }

    return fail(allReasons);
  };
}

export function isTypeof(type) {
  const name = `isTypeof-${type}`
  const tmp = {
    [name]: (target, detail) => {
      return typeof target === type ? target : fail(new ValidationError({ ...detail, validator: tmp[name] }, `expects ${type}, but got ${typeof target}`));
    }
  };
  return tmp[name];
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

export function isPlainObject() {
  return (target, detail) => {
    return isPlainObjectImpl(target) ? target : fail(new ValidationError(detail, "expects plain object"));
  }
}

export function isArray() {
  return (target, detail) => {
    return Array.isArray(target) ? target : fail(new ValidationError(detail, "expects array"));
  };
}

export class ValidationError extends Error {
  constructor(detail, ...args) {
    super(...args);
    this.detail = detail;
  }
}
