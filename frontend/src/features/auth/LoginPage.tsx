import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../services/endpoints/authApi";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import Button from "../../components/ui/Button";
import AuthShell from "../../components/layout/AuthShell";
import { normalizeRole } from "../../lib/roles";
import { getErrorMessage } from "../../lib/errors";

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
    <AuthShell
      title="Login"
      subtitle="Sign in to manage your rental portfolio."
      footer={
        <>
          No account? <Link to="/register" className="font-medium text-brand hover:underline">Register</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="field">
          <label htmlFor="login-username" className="field-label">Username or Email</label>
          <input
            id="login-username"
            className="field-input"
            placeholder="Username or Email"
            value={usernameOrEmail}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="login-password" className="field-label">Password</label>
          <input
            id="login-password"
            className="field-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        {localError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700">
            {localError}
          </p>
        ) : null}

        <Button disabled={isLoading} className="w-full">
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthShell>
  );
}
