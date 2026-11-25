import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, loadAuth, saveAuth } from "./storage";
import type { AuthUser } from "../types/auth";

const user: AuthUser = {
  userId: 4,
  username: "alice",
  email: "alice@test.local",
  role: "Manager",
};

describe("auth storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips the token and user", () => {
    saveAuth("token-123", user);

    expect(loadAuth()).toEqual({ token: "token-123", user });
  });

  it("normalizes a numeric role before persisting", () => {
    saveAuth("token-123", { ...user, role: 1 });

    const stored = JSON.parse(localStorage.getItem("rm_user")!);
    expect(stored.role).toBe("Admin");
    expect(loadAuth().user?.role).toBe("Admin");
  });

  it("returns no user when storage is empty", () => {
    expect(loadAuth()).toEqual({ token: null, user: null });
  });

  it("rejects malformed stored users", () => {
    localStorage.setItem("rm_token", "token-123");
    localStorage.setItem("rm_user", JSON.stringify({ username: "alice" }));

    expect(loadAuth()).toEqual({ token: "token-123", user: null });
  });

  it("clears corrupted JSON and keeps the token", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("rm_token", "token-123");
    localStorage.setItem("rm_user", "{not-json");

    expect(loadAuth()).toEqual({ token: "token-123", user: null });
    expect(localStorage.getItem("rm_user")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("clears both stored values", () => {
    saveAuth("token-123", user);
    clearAuth();

    expect(localStorage.getItem("rm_token")).toBeNull();
    expect(localStorage.getItem("rm_user")).toBeNull();
  });
});
