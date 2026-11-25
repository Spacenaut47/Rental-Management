import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import Navbar from "./Navbar";
import { authState, renderWithProviders } from "../../test/utils";

describe("Navbar", () => {
  it("shows login and registration links when signed out", () => {
    renderWithProviders(<Navbar />, { auth: { token: null, user: null } });

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  });

  it("shows the signed-in user and a logout button", () => {
    renderWithProviders(<Navbar />, { auth: authState("Admin") });

    expect(screen.getByText("Hi, admin (Admin)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
  });

  it("signs the user out when logout is clicked", async () => {
    const { store, user } = renderWithProviders(<Navbar />, { auth: authState("Manager") });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(store.getState().auth).toEqual({ token: null, user: null });
    expect(localStorage.getItem("rm_token")).toBeNull();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
  });
});
