export type Role = "Admin" | "Manager" | "Staff" | "Tenant";

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  role: Role;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}
