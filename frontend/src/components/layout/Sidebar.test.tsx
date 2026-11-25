import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { authState, renderWithProviders } from "../../test/utils";

describe("Sidebar", () => {
  it("shows every section to an administrator", () => {
    renderWithProviders(<Sidebar />, { auth: authState("Admin") });

    const links: Array<[string, string]> = [
      ["Properties", "/properties"],
      ["Tenants", "/tenants"],
      ["Units", "/units"],
      ["Leases", "/leases"],
      ["Payments", "/payments"],
      ["Maintenance", "/maintenance"],
      ["Audit", "/admin/audit"],
    ];

    for (const [label, href] of links) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("hides the audit section from non-administrators", () => {
    renderWithProviders(<Sidebar />, { auth: authState("Manager") });

    expect(screen.getByRole("link", { name: "Properties" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Audit" })).not.toBeInTheDocument();
  });

  it("marks the current route as active", () => {
    renderWithProviders(<Sidebar />, {
      auth: authState("Admin"),
      route: "/units",
    });

    expect(screen.getByRole("link", { name: "Units" })).toHaveClass("font-semibold");
    expect(screen.getByRole("link", { name: "Properties" })).not.toHaveClass("font-semibold");
  });
});
