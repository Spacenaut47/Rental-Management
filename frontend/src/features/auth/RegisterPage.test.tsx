import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { renderWithProviders } from "../../test/utils";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  error: null as unknown,
}));

vi.mock("../../services/endpoints/authApi", () => ({
  useRegisterMutation: () => [mocks.register, { isLoading: false, error: mocks.error }],
}));

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<h1>Dashboard</h1>} />
    </Routes>,
    { route: "/register" }
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mocks.error = null;
    mocks.register.mockReset();
  });

  it("shows the server error message", async () => {
    mocks.error = { status: 409, data: { message: "Username already exists." } };

    const { user } = renderPage();
    await user.type(screen.getByPlaceholderText("e.g., manager1"), "newuser");
    await user.type(screen.getByPlaceholderText("you@example.com"), "newuser@test.local");
    await user.type(screen.getByPlaceholderText("Strong password"), "Strong@12345");

    expect(screen.getByText("Username already exists.")).toBeInTheDocument();
  });

  it("blocks submission until the password is strong enough", async () => {
    const { user } = renderPage();

    await user.type(screen.getByPlaceholderText("e.g., manager1"), "newuser");
    await user.type(screen.getByPlaceholderText("you@example.com"), "newuser@test.local");
    await user.type(screen.getByPlaceholderText("Strong password"), "weak");

    expect(screen.getByText(/Password must be at least 8 characters\./)).toBeInTheDocument();
    expect(screen.getByText(/Password needs an uppercase letter\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("signs in and redirects after successful registration", async () => {
    mocks.register.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          accessToken: "token-123",
          expiresAtUtc: "2027-01-01T00:00:00Z",
          userId: 9,
          username: "newuser",
          email: "newuser@test.local",
          role: 4,
        }),
    });

    const { store, user } = renderPage();
    await user.type(screen.getByPlaceholderText("e.g., manager1"), "newuser");
    await user.type(screen.getByPlaceholderText("you@example.com"), "newuser@test.local");
    await user.type(screen.getByPlaceholderText("Strong password"), "Strong@12345");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(mocks.register).toHaveBeenCalledWith({
      username: "newuser",
      email: "newuser@test.local",
      password: "Strong@12345",
    });
    expect(store.getState().auth.token).toBe("token-123");
    expect(store.getState().auth.user).toEqual({
      userId: 9,
      username: "newuser",
      email: "newuser@test.local",
      role: "Tenant",
    });
  });
});
