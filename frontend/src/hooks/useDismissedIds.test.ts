import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDismissedIds } from "./useDismissedIds";

describe("useDismissedIds", () => {
  it("hides an id after it is dismissed", () => {
    const { result } = renderHook(() => useDismissedIds());

    expect(result.current.isDismissed(7)).toBe(false);

    act(() => result.current.dismiss(7));

    expect(result.current.isDismissed(7)).toBe(true);
    expect(result.current.isDismissed(8)).toBe(false);
  });
});
