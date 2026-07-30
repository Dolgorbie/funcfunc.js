export interface LensLike<T = unknown, A = unknown> {
  ref<T_ extends T, A_ extends A>(target: T_): A_;
  upd<T_ extends T, A_ extends A>(target: T_, value: A_): T_;
}

export const idlens: LensLike;

export function lens<T, A>(ref: LensLike<T, A>["ref"], upd: LensLike<T, A>["upd"]): LensLike<T, A>;

export function isLens(x: unknown): x is LensLike;

export function ref<T, A>(lns: LensLike<T, A>, target: T): A;

export function xref<T, A>(target: T, lns: LensLike<T, A>): A;

export function upd<T, A>(lns: LensLike<T, A>, target: T, value: A): T;

export function xupd<T, A>(target: T, lns: LensLike<T, A>, value: A): T;

export function swap<T, A>(lns: LensLike<T, A>, target: T, swapper: Swapper<A>): T;

export function xswap<T, A>(target: T, lns: LensLike<T, A>, swapper: Swapper<A>): T;

export interface Swapper<A = unknown> {
  <A_ extends A>(before: A_): A_;
}

export function chain(): LensLike;
export function chain<T0, A0>(lens0: LensLike<T0, A0>): LensLike<T0, A0>;
export function chain<T0, A0, A1>(lens0: LensLike<T0, A0>, lens1: LensLike<A0, A1>): LensLike<T0, A1>;
export function chain<T0, A0, A1, A2>(lens0: LensLike<T0, A0>, lens1: LensLike<A0, A1>, lens2: LensLike<A1, A2>): LensLike<T0, A2>;
export function chain<T0, A0, A1, A2, A3>(lens0: LensLike<T0, A0>, lens1: LensLike<A0, A1>, lens2: LensLike<A1, A2>, lens3: LensLike<A2, A3>): LensLike<T0, A3>;

export function pathLens(): LensLike;
export function pathLens<P0>(prop0: P0): LensLike<Record<P0>, unknown>;
