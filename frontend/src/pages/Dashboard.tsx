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
import StatCard from "../components/ui/StatCard";
import { useListLeasesQuery } from "../services/endpoints/leasesApi";
import { useListPropertiesQuery } from "../services/endpoints/propertiesApi";
import { useListTenantsQuery } from "../services/endpoints/tenantsApi";
import { useListUnitsQuery } from "../services/endpoints/unitsApi";

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
  const { data: properties } = useListPropertiesQuery();
  const { data: tenants } = useListTenantsQuery();
  const { data: units } = useListUnitsQuery();
  const { data: leases } = useListLeasesQuery();

  const stats = [
    {
      label: "Properties",
      value: properties?.length,
      hint: properties ? "Managed locations" : "Loading…",
      icon: Building2,
    },
    {
      label: "Tenants",
      value: tenants?.length,
      hint: tenants ? "Registered people" : "Loading…",
      icon: Users,
    },
    {
      label: "Occupied units",
      value: units?.filter((unit) => unit.isOccupied).length,
      hint: units ? `${units.length} total units` : "Loading…",
      icon: DoorOpen,
    },
    {
      label: "Active leases",
      value: leases?.filter((lease) => lease.isActive).length,
      hint: leases ? "Current agreements" : "Loading…",
      icon: FileText,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome! Use the sidebar to navigate.</p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
          Rental operations
        </span>
      </div>

      <section aria-label="Workspace summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Quick actions</h2>
        <span className="text-xs text-slate-400">Open a section</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="panel group flex items-start gap-3 p-4 transition hover:border-brand/40 hover:shadow-md"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-medium text-slate-900">{label}</span>
              <span className="block text-sm text-slate-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
