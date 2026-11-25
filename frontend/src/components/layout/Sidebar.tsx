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
  adminOnly?: boolean;
};

const links: NavItem[] = [
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/units", label: "Units", icon: DoorOpen },
  { to: "/leases", label: "Leases", icon: FileText },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/admin/audit", label: "Audit", icon: ScrollText, adminOnly: true },
];

export default function Sidebar() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const link =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100";
  const active = "bg-gray-100 font-semibold text-gray-900";

  return (
    <aside className="hidden w-64 border-r bg-white md:block">
      <div className="p-4 text-sm uppercase tracking-wide text-gray-500">Menu</div>
      <nav className="p-2">
        {links
          .filter((item) => !item.adminOnly || role === "Admin")
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${link} ${isActive ? active : ""}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-[var(--color-brand)]" : "text-gray-400"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}
