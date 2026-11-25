import { Link } from "react-router-dom";
import {
  Building2,
  DoorOpen,
  FileText,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickLink = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  { to: "/properties", label: "Properties", description: "Buildings and addresses", icon: Building2 },
  { to: "/tenants", label: "Tenants", description: "People and contact details", icon: Users },
  { to: "/units", label: "Units", description: "Availability and rent", icon: DoorOpen },
  { to: "/leases", label: "Leases", description: "Tenant and unit agreements", icon: FileText },
  { to: "/payments", label: "Payments", description: "Rent records and totals", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", description: "Requests and resolutions", icon: Wrench },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="mb-3 text-2xl font-bold">Dashboard</h1>
      <p className="text-gray-600">Welcome! Use the sidebar to navigate.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-[var(--color-brand)] group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-sm text-gray-600">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
