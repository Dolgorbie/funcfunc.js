import * as A from "./aggregators";
import { createClassNamesCombinator } from "./core";
import * as T from "./transformers";

export const c = createClassNamesCombinator({ transformers: [T.omitFalsy] });

export const clegacy = createClassNamesCombinator({ transformers: [T.omitFalsy, T.collectActiveKeys] });

export function cprops(styles) {
  return createClassNamesCombinator({ transformers: [T.mapObject(styles), T.omitFalsy] });
}

export function cprefix(prefix) {
  return createClassNamesCombinator({ transformers: [T.omitFalsy, T.addPrefix(prefix)] });
}

export function cvariants(variantDefs) {
  return createClassNamesCombinator({ transformers: [T.mapVariants(variantDefs), T.omitFalsy] });
}

export function cbem(prefix) {
  return createClassNamesCombinator({ transformers: [T.addBemBlock(prefix), T.omitFalsy] });
}

export const cautoBem = createClassNamesCombinator({ transformers: [T.omitFalsy], aggregator: A.autoBem });

export const craw = createClassNamesCombinator();
