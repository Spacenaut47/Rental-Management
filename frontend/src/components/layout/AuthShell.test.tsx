import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthShell from "./AuthShell";

describe("AuthShell", () => {
  it("renders an accessible auth panel with its footer", () => {
    render(
      <AuthShell title="Login" subtitle="Welcome back" footer={<a href="/register">Register</a>}>
        <form>
          <button type="submit">Sign In</button>
        </form>
      </AuthShell>
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
  });
});
