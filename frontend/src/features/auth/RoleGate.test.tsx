import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import RoleGate from "./RoleGate";
import { renderWithProviders } from "../../test/utils";
import type { AuthState, Role } from "../../types/auth";

const authFor = (role: Role): AuthState => ({
  token: "token",
  user: { userId: 1, username: "user", email: "user@test.local", role },
});

describe("RoleGate", () => {
  it("renders children for an allowed role", () => {
    renderWithProviders(
      <RoleGate allow={["Admin", "Manager"]}>
        <p>Restricted content</p>
      </RoleGate>,
      { auth: authFor("Admin") }
    );

    expect(screen.getByText("Restricted content")).toBeInTheDocument();
  });

  it("hides children for a disallowed role", () => {
    renderWithProviders(
      <RoleGate allow={["Admin"]}>
        <p>Restricted content</p>
      </RoleGate>,
      { auth: authFor("Staff") }
    );

    expect(screen.queryByText("Restricted content")).not.toBeInTheDocument();
  });

  it("hides children when signed out", () => {
    renderWithProviders(
      <RoleGate allow={["Admin", "Manager", "Staff", "Tenant"]}>
        <p>Restricted content</p>
      </RoleGate>,
      { auth: { token: null, user: null } }
    );

    expect(screen.queryByText("Restricted content")).not.toBeInTheDocument();
  });
});
