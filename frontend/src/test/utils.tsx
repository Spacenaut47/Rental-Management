import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "../features/auth/authSlice";
import { baseApi } from "../services/baseApi";
import type { AuthState, AuthUser, Role } from "../types/auth";

type Options = {
  auth?: AuthState;
  route?: string;
};

export function authState(role: Role, overrides: Partial<AuthUser> = {}): AuthState {
  return {
    token: "test-token",
    user: {
      userId: 1,
      username: "admin",
      email: "admin@local.test",
      role,
      ...overrides,
    },
  };
}

export function makeStore(auth?: AuthState) {
  return configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    preloadedState: auth ? { auth } : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const store = makeStore(options.auth);
  const user = userEvent.setup();

  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[options.route ?? "/"]}>{ui}</MemoryRouter>
    </Provider>
  );

  return { ...result, store, user };
}
