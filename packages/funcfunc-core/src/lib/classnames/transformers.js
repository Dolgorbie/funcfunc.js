import { isPlainObject } from "../asfunc";

export function omitFalsy(name) {
  return name || [];
}

export function collectActiveKeys(name) {
  if (!isPlainObject(name)) {
    return name;
  }

  const keys = Object.keys(name)
  const acc = new Array(keys.length);
  let i = 0;
  for (const k of keys) {
    if (k !== "" && name[k]) {
      acc[i++] = k;
    }
  }
  acc.length = i;
  return acc;
}

export function mapObject(styles) {
  return (prop) => styles[prop] ?? prop;
}

export function addPrefix(prefix) {
  return (name) => `${prefix}${name}`;
}

export function mapVariants(variantDefs) {
  return (variants) => {
    if (!isPlainObject(variants)) {
      return variants;
    }

    const acc = [];
    _loopMapVariants(acc, variants, Object.keys(variants), variantDefs);
    return acc;
  };
}

function _loopMapVariants(acc, variants, categories, defs) {
  for (const cat of categories) {
    if (!(cat in defs)) {
      continue;
    }

    const varStyles = defs[cat];
    const varName = variants[cat];
    if (!(varName in varStyles)) {
      console.warn("unrecognized variant", varStyles, varName);
      continue;
    }

    const style = varStyles[varName];
    if (Array.isArray(style)) {
      for (const s of style) {
        _pushMapVariantsResult(acc, variants, categories, s);
      }
      continue;
    }
    _pushMapVariantsResult(acc, variants, categories, style);
  }
}

function _pushMapVariantsResult(acc, variants, categories, style) {
  if (isPlainObject(style)) {
    _loopMapVariants(acc, variants, categories, style);
    return;
  }

  acc.push(style);
}

export function addBemBlock(block) {
  return (name) => {
    if (typeof name !== "string" || !name.match(/^(?:--|__)/)) {
      return name;
    }
    return `${block}${name}`;
  };
}

export function replaceRegex(regex, replace) {
  return (name) => {
    if (typeof name !== "string") {
      return name;
    }
    return name.replace(regex, replace);
  };
}
