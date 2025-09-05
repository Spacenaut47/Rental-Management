// src/lib/roles.ts
export type RoleName = "Admin" | "Manager" | "Staff" | "Tenant";

export function normalizeRole(role: unknown): RoleName {
  if (typeof role === "string") {
    const s = role.trim().toLowerCase();
    if (s === "admin" || s === "1") return "Admin";
    if (s === "manager" || s === "2") return "Manager";
    if (s === "staff" || s === "3") return "Staff";
    if (s === "tenant" || s === "4") return "Tenant";

    console.warn("normalizeRole: unknown role string from server:", role);
    return "Tenant";
  }

  if (typeof role === "number") {
    if (role === 1) return "Admin";
    if (role === 2) return "Manager";
    if (role === 3) return "Staff";
    if (role === 4) return "Tenant";
  }

  console.warn("normalizeRole: unexpected role value from server:", role);
  return "Tenant";
}
