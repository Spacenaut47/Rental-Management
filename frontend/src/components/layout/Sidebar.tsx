import { NavLink } from "react-router-dom";

const visibleLinks = ["/properties", "/units", "/leases", "/payments", "/maintenance"];

export default function Sidebar() {
  const link = "block rounded-lg px-3 py-2 hover:bg-gray-100";
  const active = "bg-gray-100 font-semibold";
  return (
    <aside className="hidden w-64 border-r bg-white md:block">
      <div className="p-4 text-sm uppercase tracking-wide text-gray-500">Menu</div>
      <nav className="p-2">
        {visibleLinks.map((to) => (
          <NavLink key={to} to={to} className={({isActive}) => `${link} ${isActive ? active : ""}`}>{to}</NavLink>
        ))}
        <NavLink to="/admin/audit" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Audit</NavLink>
      </nav>
    </aside>
  );
}
