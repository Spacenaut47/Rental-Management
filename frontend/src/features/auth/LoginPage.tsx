// src/features/auth/LoginPage.tsx
import { useState } from "react";
import { useLoginMutation } from "../../services/endpoints/authApi";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import Button from "../../components/ui/Button";
import { normalizeRole } from "../../lib/roles";
import { getErrorMessage } from "../../lib/errors";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [usernameOrEmail, setUser] = useState("admin");
  const [password, setPass] = useState("Admin@12345");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!usernameOrEmail.trim() || !password) {
      setLocalError("Username/email and password are required.");
      return;
    }

    try {
      const res = await login({ usernameOrEmail, password }).unwrap();
      dispatch(
        setCredentials({
          token: res.accessToken,
          user: {
            userId: res.userId,
            username: res.username,
            email: res.email,
            role: normalizeRole(res.role),
          },
        })
      );
      nav("/");
    } catch (err) {
      console.error("Login error:", err);
      setLocalError(getErrorMessage(err, "Invalid credentials or server error."));
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Login</h1>

        <label className="block text-sm font-medium">Username or Email</label>
        <input
          className="w-full rounded-md border p-2"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUser(e.target.value)}
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          className="w-full rounded-md border p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPass(e.target.value)}
        />

        {/* Local validation / server error */}
        {localError ? <div className="text-sm text-red-600 whitespace-pre-line">{localError}</div> : null}

        <Button disabled={isLoading} className="w-full">
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="text-sm text-gray-600">
          No account? <Link to="/register" className="text-[var(--color-brand)] hover:underline">Register</Link>
        </div>
      </form>
    </div>
  );
}
