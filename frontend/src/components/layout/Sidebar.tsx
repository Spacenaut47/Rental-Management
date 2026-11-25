import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

const links = [
  { to: "/properties", label: "Properties" },
  { to: "/tenants", label: "Tenants" },
  { to: "/units", label: "Units" },
  { to: "/leases", label: "Leases" },
  { to: "/payments", label: "Payments" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/admin/audit", label: "Audit", adminOnly: true },
];

export default function Sidebar() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const link = "block rounded-lg px-3 py-2 hover:bg-gray-100";
  const active = "bg-gray-100 font-semibold";

  return (
    <aside className="hidden w-64 border-r bg-white md:block">
      <div className="p-4 text-sm uppercase tracking-wide text-gray-500">Menu</div>
      <nav className="p-2">
        {links
          .filter((item) => !item.adminOnly || role === "Admin")
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${link} ${isActive ? active : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
