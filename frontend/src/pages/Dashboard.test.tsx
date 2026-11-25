import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { renderWithProviders } from "../test/utils";

const quickLinks: Array<[string, string]> = [
  ["Properties", "/properties"],
  ["Tenants", "/tenants"],
  ["Units", "/units"],
  ["Leases", "/leases"],
  ["Payments", "/payments"],
  ["Maintenance", "/maintenance"],
];

describe("Dashboard", () => {
  it("renders the welcome message", () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Welcome! Use the sidebar to navigate.")).toBeInTheDocument();
  });

  it("links to every management section with an icon", () => {
    renderWithProviders(<Dashboard />);

    for (const [label, href] of quickLinks) {
      const link = screen.getByRole("link", { name: new RegExp(`^${label}`) });
      expect(link).toHaveAttribute("href", href);
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });
});
