import { useState } from "react";
import { useLoginMutation } from "../../services/endpoints/authApi";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials } from "./authSlice";
import Button from "../../components/ui/Button";
import { normalizeRole } from "../../lib/roles";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [usernameOrEmail, setUser] = useState("admin");
  const [password, setPass] = useState("Admin@12345");
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Login</h1>
        <input className="w-full rounded-md border p-2" placeholder="Username or Email" value={usernameOrEmail} onChange={(e)=>setUser(e.target.value)} />
        <input className="w-full rounded-md border p-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPass(e.target.value)} />
        {error ? <div className="text-sm text-red-600">Invalid credentials</div> : null}
        <Button disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</Button>
        <div className="text-sm text-gray-600">
          No account? <Link to="/register" className="text-[var(--color-brand)] hover:underline">Register</Link>
        </div>
      </form>
    </div>
  );
}
