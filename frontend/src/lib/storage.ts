// src/lib/storage.ts
import { normalizeRole } from "./roles";
import type { AuthUser } from "../types/auth";

const TOKEN_KEY = "rm_token";
const USER_KEY = "rm_user";

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.userId === "number" &&
    typeof user.username === "string" &&
    typeof user.email === "string"
  );
};

export const saveAuth = (token: string, user: unknown) => {
  try {
    if (user && typeof user === "object") {
      const stored = user as Record<string, unknown>;
      const normalized = { ...stored, role: normalizeRole(stored.role) };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      return;
    }
  } catch (err) {
    // fallthrough to raw storage
    console.warn("saveAuth: failed to normalize user role", err);
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const loadAuth = (): { token: string | null; user: AuthUser | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (isAuthUser(parsed)) {
      return {
        token,
        user: { ...parsed, role: normalizeRole(parsed.role) },
      };
    }
    return { token, user: null };
  } catch (err) {
    console.warn("loadAuth: corrupted user JSON in localStorage — clearing it", err);
    localStorage.removeItem(USER_KEY);
    return { token, user: null };
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
