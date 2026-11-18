import { describe, expect, it } from "vitest";
import { atom, deref, release, retain, swap } from "./core";

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

describe("")
