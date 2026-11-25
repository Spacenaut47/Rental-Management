import { NavLink } from "react-router-dom";
import {
  Building2,
  DoorOpen,
  FileText,
  ScrollText,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppSelector } from "../../app/hooks";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const workspaceLinks: NavItem[] = [
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/units", label: "Units", icon: DoorOpen },
  { to: "/leases", label: "Leases", icon: FileText },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
];

const adminLinks: NavItem[] = [{ to: "/admin/audit", label: "Audit", icon: ScrollText }];

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <nav className="space-y-1 p-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brand-soft font-semibold text-brand-dark"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-brand" : "text-slate-400"}`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const showAdmin = role === "Admin";

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-surface md:block">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
      </div>
      <NavItems items={workspaceLinks} />
      {showAdmin ? (
        <>
          <div className="border-t border-line px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Administration</p>
          </div>
          <NavItems items={adminLinks} />
        </>
      ) : null}
    </aside>
  );
}
