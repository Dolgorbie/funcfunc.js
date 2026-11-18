import { describe, expect, it, vi } from "vitest";
import { atom, deref, effect, release, reset, retain, swap } from "./core";

describe("atom", () => {
  it("should deref", () => {
    const value = { a: 1, b: "b" };
    const node = atom(value);
    retain(node);
    expect(deref(node)).toBe(value);
    release(node);
  });

  it("should swap", () => {
    const before = { a: 1, b: "b" };
    const after = { a: 2, b: "bb" };
    const node = atom(before);
    retain(node);
    expect(deref(node)).toBe(before);

    expect(swap(node, (prev) => {
      expect(prev).toBe(before);
      return after;
    })).toBe(after);

    release(node);
  });
});

describe("effect", () => {
  it("should be called", () => {
    const value = { a: "a" };
    const after = { b: "b" }
    const root = atom(value);

    const acc = [];
    const handler = vi.fn((v) => acc.push(v));
    const eff = effect(handler, root);

    retain(eff);
    expect(handler).toHaveBeenCalledOnce();
    expect(acc).toEqual([value]);

    handler.mockClear();
    reset(root, after);
    expect(handler).toHaveBeenCalledOnce();
    expect(acc).toEqual([value, after]);
  });
});
