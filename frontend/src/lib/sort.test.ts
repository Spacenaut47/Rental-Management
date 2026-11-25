import { describe, expect, it } from "vitest";
import { newestFirst } from "./sort";

describe("newestFirst", () => {
  it("sorts by the provided timestamp descending", () => {
    const items = [
      { id: 1, at: "2026-01-01T00:00:00Z" },
      { id: 2, at: "2026-03-01T00:00:00Z" },
      { id: 3, at: "2026-02-01T00:00:00Z" },
    ];

    expect(newestFirst(items, (item) => item.at).map((item) => item.id)).toEqual([2, 3, 1]);
    expect(items.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("falls back to descending ids when no timestamp is available", () => {
    const items = [{ id: 1 }, { id: 4 }, { id: 2 }];
    expect(newestFirst(items, () => undefined).map((item) => item.id)).toEqual([4, 2, 1]);
  });
});
