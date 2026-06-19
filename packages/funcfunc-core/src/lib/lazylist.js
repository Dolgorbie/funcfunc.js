import { car, cdr, isPair, Pair } from "./conslist";
import { delay } from "./delay";

export function lcons(x, thunk) {
  return new Pair(x, delay(thunk));
}

export function lmap1(proc, list0) {
  if (isPair(list0)) {
    return lcons(proc(car(list0)), () => lmap1(proc, cdr(list0)));
  }
  return null;
}
