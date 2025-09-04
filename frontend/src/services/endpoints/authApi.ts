import { baseApi } from "../baseApi";
import type { Role } from "../../types/auth";

type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  userId: number;
  username: string;
  email: string;
  role: Role;
};

type LoginRequest = { usernameOrEmail: string; password: string };
type RegisterRequest = { username: string; email: string; password: string; role: number };

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    me: build.query<{ id: number; username: string; email: string; role: Role; createdAt: string }, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Me"],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi;
