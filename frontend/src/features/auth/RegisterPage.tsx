// src/features/auth/RegisterPage.tsx
import { useState, useMemo } from "react";
import { useRegisterMutation } from "../../services/endpoints/authApi";
import Button from "../../components/ui/Button";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";

type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: 3, // Staff default
  });

  // Basic client checks to prevent obvious 400s
  const clientIssues = useMemo(() => {
    const issues: string[] = [];
    if (form.username.trim().length < 3)
      issues.push("Username must be at least 3 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      issues.push("Email is not valid.");
    if (form.password.length < 8)
      issues.push("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(form.password))
      issues.push("Password needs an uppercase letter.");
    if (!/[a-z]/.test(form.password))
      issues.push("Password needs a lowercase letter.");
    if (!/[0-9]/.test(form.password)) issues.push("Password needs a digit.");
    if (!/[^a-zA-Z0-9]/.test(form.password))
      issues.push("Password needs a special character.");
    return issues;
  }, [form]);

  const serverErrorText = useMemo(() => {
    if (!error) return "";
    const e = error as FetchBaseQueryError | SerializedError;
    if ("data" in e && e.data) {
      const d = e.data as ProblemDetails | any[];
      if ((d as ProblemDetails).errors) {
        const errs = (d as ProblemDetails).errors!;
        return Object.values(errs).flat().join("\n");
      }
      if (Array.isArray(d)) {
        return d
          .map((x: any) => x?.errorMessage ?? JSON.stringify(x))
          .join("\n");
      }
      return (
        (d as ProblemDetails).detail ||
        (d as ProblemDetails).title ||
        "Registration failed."
      );
    }
    return "Registration failed.";
  }, [error]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientIssues.length) return;
    try {
      await register(form).unwrap();
      // Redirect to login
      navigate("/login");
    } catch (err) {
      console.error("Register failed", err);
      if (!error) alert("Registration failed. See console for details.");
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Register</h1>

        <label className="block text-sm font-medium">Username</label>
        <input
          className="w-full rounded-md border p-2"
          placeholder="e.g., manager1"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          minLength={3}
        />

        <label className="block text-sm font-medium">Email</label>
        <input
          className="w-full rounded-md border p-2"
          placeholder="you@example.com"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          className="w-full rounded-md border p-2"
          placeholder="Strong password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <p className="text-xs text-gray-600">
          Must include: 8+ chars, uppercase, lowercase, digit, special
          character.
        </p>

        <label className="block text-sm font-medium">Role</label>
        <select
          className="w-full rounded-md border p-2"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}
        >
          <option value={2}>Manager</option>
          <option value={3}>Staff</option>
          <option value={4}>Tenant</option>
        </select>

        {/* Client-side errors */}
        {clientIssues.length > 0 && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-800">
            {clientIssues.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}

        {/* Server-side errors */}
        {serverErrorText && clientIssues.length === 0 && (
          <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 whitespace-pre-line">
            {serverErrorText}
          </div>
        )}

        <Button disabled={isLoading || clientIssues.length > 0}>
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
    </div>
  );
}
