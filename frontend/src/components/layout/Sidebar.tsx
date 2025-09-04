import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const link = "block rounded-lg px-3 py-2 hover:bg-gray-100";
  const active = "bg-gray-100 font-semibold";
  return (
    <aside className="hidden w-64 border-r bg-white md:block">
      <div className="p-4 text-sm uppercase tracking-wide text-gray-500">Menu</div>
      <nav className="p-2">
        <NavLink to="/properties" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Properties</NavLink>
        <NavLink to="/tenants" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Tenants</NavLink>
        <NavLink to="/units" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Units</NavLink>
        <NavLink to="/leases" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Leases</NavLink>
        <NavLink to="/payments" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Payments</NavLink>
        <NavLink to="/maintenance" className={({isActive}) => `${link} ${isActive ? active : ""}`}>Maintenance</NavLink>
      </nav>
    </aside>
  );
}
