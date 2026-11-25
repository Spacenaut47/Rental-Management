import { Link } from "react-router-dom";
import { Building2, LogIn, LogOut, UserPlus } from "lucide-react";
import Button from "../ui/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";

export default function Navbar() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-brand)] text-white">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            Rental<span className="text-[var(--color-brand)]">Manager</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/properties" className="hover:underline">
            Properties
          </Link>
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.username} ({user.role})</span>
              <Button onClick={() => dispatch(logout())}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 hover:underline">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 hover:underline">
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
