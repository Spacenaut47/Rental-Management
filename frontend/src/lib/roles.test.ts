import { describe, expect, it, vi } from "vitest";
import { normalizeRole } from "./roles";

describe("normalizeRole", () => {
  it("maps numeric role values", () => {
    expect(normalizeRole(1)).toBe("Admin");
    expect(normalizeRole(2)).toBe("Manager");
    expect(normalizeRole(3)).toBe("Staff");
    expect(normalizeRole(4)).toBe("Tenant");
  });

  it("maps case-insensitive role names", () => {
    expect(normalizeRole("Admin")).toBe("Admin");
    expect(normalizeRole(" manager ")).toBe("Manager");
    expect(normalizeRole("STAFF")).toBe("Staff");
    expect(normalizeRole("tenant")).toBe("Tenant");
  });

  it("accepts numeric strings from the wire", () => {
    expect(normalizeRole("1")).toBe("Admin");
    expect(normalizeRole("4")).toBe("Tenant");
  });

  it("falls back to Tenant and warns for unknown values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(normalizeRole("owner")).toBe("Tenant");
    expect(normalizeRole(99)).toBe("Tenant");
    expect(normalizeRole(null)).toBe("Tenant");
    expect(warn).toHaveBeenCalledTimes(3);
  });
});
