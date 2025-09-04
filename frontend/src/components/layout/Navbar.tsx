import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

export default function Navbar() {
  const { user } = useAppSelector((s: any) => s.auth);
  const dispatch = useAppDispatch();
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">Rental<span className="text-[var(--color-brand)]">Manager</span></Link>
        <nav className="flex items-center gap-3">
          <Link to="/properties" className="hover:underline">Properties</Link>
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.username} ({user.role})</span>
              <Button onClick={() => dispatch(logout())}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
