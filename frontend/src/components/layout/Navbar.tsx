import { Link } from "react-router-dom";
import { Building2, LogIn, LogOut, UserPlus } from "lucide-react";
import Button from "../ui/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

export default function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white shadow-sm">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            Rental<span className="text-brand">Manager</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/properties" className="text-slate-600 transition hover:text-brand">
            Properties
          </Link>
          {user ? (
            <>
              <span className="hidden text-slate-500 sm:inline">Hi, {user.username} ({user.role})</span>
              <Button variant="secondary" onClick={() => dispatch(logout())}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-slate-600 transition hover:text-brand">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 text-slate-600 transition hover:text-brand">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
