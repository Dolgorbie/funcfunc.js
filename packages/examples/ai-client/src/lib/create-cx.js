import { createClassNamesCombinator } from "funcfunc/classnames/core";
import { mapObject, mapVariants, omitFalsy } from "funcfunc/classnames/transformers";
import { undefMap1 } from "funcfunc/nullable";

export function createCx(cssModule, variantDefs = void 0) {
  return createClassNamesCombinator({
    transformers: [...(undefMap1(mapVariants, variantDefs) ?? []), mapObject(cssModule), omitFalsy]
  })
}
