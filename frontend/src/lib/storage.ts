// src/lib/storage.ts
import { normalizeRole } from "./roles";

const TOKEN_KEY = "rm_token";
const USER_KEY = "rm_user";

export const saveAuth = (token: string, user: unknown) => {
  try {
    const u = user as any;
    if (u) {
      const normalized = { ...u, role: normalizeRole(u.role) };
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

export const loadAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  try {
    const user = raw ? JSON.parse(raw) : null;
    if (user && user.role !== undefined) {
      user.role = normalizeRole(user.role);
    }
    return { token, user };
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
