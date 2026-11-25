import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { authState, renderWithProviders } from "../../test/utils";

const routes = (
  <Routes>
    <Route
      path="/private"
      element={
        <ProtectedRoute>
          <h1>Private page</h1>
        </ProtectedRoute>
      }
    />
    <Route path="/login" element={<h1>Login page</h1>} />
  </Routes>
);

describe("ProtectedRoute", () => {
  it("redirects signed-out users to the login page", () => {
    renderWithProviders(routes, {
      route: "/private",
      auth: { token: null, user: null },
    });

    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it("renders the route for signed-in users", () => {
    renderWithProviders(routes, {
      route: "/private",
      auth: authState("Manager"),
    });

    expect(screen.getByRole("heading", { name: "Private page" })).toBeInTheDocument();
  });
});
