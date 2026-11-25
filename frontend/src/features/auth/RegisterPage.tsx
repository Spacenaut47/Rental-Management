import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../services/endpoints/authApi";
import Button from "../../components/ui/Button";
import AuthShell from "../../components/layout/AuthShell";
import { getErrorMessage } from "../../lib/errors";
import { normalizeRole } from "../../lib/roles";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";

export default function RegisterPage() {
  const [register, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const clientIssues = useMemo(() => {
    const issues: string[] = [];
    if (form.username.trim().length < 3) issues.push("Username must be at least 3 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) issues.push("Email is not valid.");
    if (form.password.length < 8) issues.push("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(form.password)) issues.push("Password needs an uppercase letter.");
    if (!/[a-z]/.test(form.password)) issues.push("Password needs a lowercase letter.");
    if (!/[0-9]/.test(form.password)) issues.push("Password needs a digit.");
    if (!/[^a-zA-Z0-9]/.test(form.password)) issues.push("Password needs a special character.");
    return issues;
  }, [form]);

  const serverErrorText = useMemo(
    () => getErrorMessage(error, "Registration failed."),
    [error]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientIssues.length) return;
    try {
      const res = await register(form).unwrap();
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
      navigate("/");
    } catch (err) {
      console.error("Register failed", err);
    }
  };

  return (
    <AuthShell
      title="Register"
      subtitle="Create an account to start managing rentals."
      footer={
        <>
          Already registered? <Link to="/login" className="font-medium text-brand hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="field">
          <label htmlFor="register-username" className="field-label">Username</label>
          <input
            id="register-username"
            className="field-input"
            placeholder="e.g., manager1"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            minLength={3}
          />
        </div>

        <div className="field">
          <label htmlFor="register-email" className="field-label">Email</label>
          <input
            id="register-email"
            className="field-input"
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="register-password" className="field-label">Password</label>
          <input
            id="register-password"
            className="field-input"
            placeholder="Strong password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <p className="text-xs text-slate-400">
            Must include: 8+ chars, uppercase, lowercase, digit, special character.
          </p>
        </div>

        {clientIssues.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {clientIssues.map((message) => (
              <div key={message}>• {message}</div>
            ))}
          </div>
        )}

        {serverErrorText && clientIssues.length === 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700">
            {serverErrorText}
          </div>
        )}

        <Button disabled={isLoading || clientIssues.length > 0} className="w-full">
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
    </AuthShell>
  );
}
