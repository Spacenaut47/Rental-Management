import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types/auth";
import authReducer, { logout, setCredentials } from "./authSlice";

const user: AuthUser = {
  userId: 1,
  username: "admin",
  email: "admin@local.test",
  role: "Admin",
};

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores credentials in state and localStorage", () => {
    const state = authReducer(
      { token: null, user: null },
      setCredentials({ token: "token-123", user })
    );

    expect(state).toEqual({ token: "token-123", user });
    expect(localStorage.getItem("rm_token")).toBe("token-123");
    expect(JSON.parse(localStorage.getItem("rm_user")!)).toEqual(user);
  });

  it("clears state and localStorage on logout", () => {
    const signedIn = authReducer(
      { token: null, user: null },
      setCredentials({ token: "token-123", user })
    );

    expect(authReducer(signedIn, logout())).toEqual({ token: null, user: null });
    expect(localStorage.getItem("rm_token")).toBeNull();
    expect(localStorage.getItem("rm_user")).toBeNull();
  });

  it("hydrates from localStorage when the module loads", async () => {
    localStorage.setItem("rm_token", "persisted-token");
    localStorage.setItem("rm_user", JSON.stringify({ ...user, role: 1 }));
    vi.resetModules();

    const { default: freshReducer } = await import("./authSlice");
    const state = freshReducer(undefined, { type: "@@INIT" });

    expect(state.token).toBe("persisted-token");
    expect(state.user?.role).toBe("Admin");
  });
});
