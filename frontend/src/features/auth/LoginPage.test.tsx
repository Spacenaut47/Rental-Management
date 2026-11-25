import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import { renderWithProviders } from "../../test/utils";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock("../../services/endpoints/authApi", () => ({
  useLoginMutation: () => [mocks.login, { isLoading: false }],
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<h1>Dashboard</h1>} />
    </Routes>,
    { route: "/login" }
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    mocks.login.mockReset();
  });

  it("shows the server error after a rejected login", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.login.mockReturnValue({
      unwrap: () => Promise.reject({ status: 401, data: { message: "Invalid credentials." } }),
    });

    const { user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
  });

  it("requires both fields before calling the API", async () => {
    const { user } = renderPage();
    await user.clear(screen.getByPlaceholderText("Username or Email"));
    await user.clear(screen.getByPlaceholderText("Password"));
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      screen.getByText("Username/email and password are required.")
    ).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("persists credentials and redirects after login", async () => {
    mocks.login.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          accessToken: "token-123",
          expiresAtUtc: "2027-01-01T00:00:00Z",
          userId: 1,
          username: "admin",
          email: "admin@local.test",
          role: 1,
        }),
    });

    const { store, user } = renderPage();
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(store.getState().auth).toEqual({
      token: "token-123",
      user: {
        userId: 1,
        username: "admin",
        email: "admin@local.test",
        role: "Admin",
      },
    });
    expect(localStorage.getItem("rm_token")).toBe("token-123");
  });
});
