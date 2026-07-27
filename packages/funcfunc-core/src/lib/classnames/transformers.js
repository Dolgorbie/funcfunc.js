export function omitFalsy(name) {
  return name || [];
}

export function collectActiveKeys(name) {
  if (name === null || typeof name !== "object") {
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
    if (variants == null || typeof variants !== "object") {
      return variants;
    }

    const keys = Object.keys(variants);
    const { length } = keys;
    for (let i = 0; i < length; ++i) {
      const keyI = keys[i];
      if (!(keyI in variantDefs)) {
        console.warn("unrecognized key", keyI);
        continue;
      }

      const defK = variantDefs[keyI];
      const varI = variants[keyI];
      if (!(varI in defK)) {
        console.warn("unrecognized variant", defK, varI);
        continue;
      }

      keys[i] = defK[varI];
    }
    return keys;
  };
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
