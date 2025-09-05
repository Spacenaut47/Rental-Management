// src/pages/LeasesPage.tsx
import { useState } from "react";
import {
  useListLeasesQuery,
  useCreateLeaseMutation,
  useDeleteLeaseMutation,
} from "../services/endpoints/leasesApi";
import { useListUnitsQuery } from "../services/endpoints/unitsApi";
import { useListTenantsQuery } from "../services/endpoints/tenantsApi";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

export default function LeasesPage() {
  const [filters, setFilters] = useState<{ unitId?: number; tenantId?: number; active?: boolean }>({});
  const { data, isLoading, isError, refetch } = useListLeasesQuery(filters);

  const { data: unitsData } = useListUnitsQuery(undefined);
  const { data: tenantsData } = useListTenantsQuery(undefined);

  const [createLease, { isLoading: creating }] = useCreateLeaseMutation();
  const [deleteLease] = useDeleteLeaseMutation();

  // optimistic local leases
  const [optimisticLeases, setOptimisticLeases] = useState<any[]>([]);

  const [form, setForm] = useState({
    unitId: 1,
    tenantId: 1,
    monthlyRent: 1200,
    securityDeposit: 1200,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createLease(form as any).unwrap();
      setOptimisticLeases((cur) => {
        if (cur.some((c) => c.id === created.id)) return cur;
        return [created, ...cur];
      });
      await refetch();
    } catch (err) {
      console.error("Create lease failed", err);
      let msg = "Failed to create lease.";
      const anyErr = err as any;
      if (anyErr?.data) msg += " " + JSON.stringify(anyErr.data);
      alert(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete lease?")) return;
    try {
      await deleteLease(id).unwrap();
      setOptimisticLeases((cur) => cur.filter((l) => l.id !== id));
      await refetch();
    } catch (err) {
      console.error("Delete lease failed", err);
      alert("Failed to delete lease.");
    }
  };

  // merge server + optimistic
  const serverLeases = data ?? [];
  const merged = new Map<number, any>();
  optimisticLeases.forEach((l) => merged.set(l.id, l));
  serverLeases.forEach((l: any) => merged.set(l.id, l));
  const leases = Array.from(merged.values());

  const tenantName = (tenantId?: number | null) => {
    if (!tenantId) return "-";
    const t = tenantsData?.find((x) => x.id === tenantId);
    if (!t) return `#${tenantId}`;
    return `${t.firstName} ${t.lastName}`;
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Leases</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="lease-filter-unit" className="text-xs font-medium text-gray-600">Unit ID</label>
            <input
              id="lease-filter-unit"
              className="w-36 rounded-md border p-2"
              placeholder="e.g., 1"
              type="number"
              onChange={(e) => setFilters(f => ({ ...f, unitId: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="lease-filter-tenant" className="text-xs font-medium text-gray-600">Tenant ID</label>
            <input
              id="lease-filter-tenant"
              className="w-36 rounded-md border p-2"
              placeholder="e.g., 1"
              type="number"
              onChange={(e) => setFilters(f => ({ ...f, tenantId: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="lease-filter-active" className="text-xs font-medium text-gray-600">Status</label>
            <select
              id="lease-filter-active"
              className="rounded-md border p-2"
              onChange={(e) => setFilters(f => ({ ...f, active: e.target.value === "" ? undefined : e.target.value === "true" }))}
            >
              <option value="">Any</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <Button onClick={() => refetch()} aria-label="Apply lease filters">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin", "Manager"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Lease</h2>
            <div className="mb-3 grid grid-cols-2 gap-3 rounded-md border bg-gray-50 p-3 text-sm">
              <div>
                <div className="mb-1 font-medium">Choose Unit</div>
                <select
                  id="lease-unit-select"
                  className="w-full rounded-md border p-2"
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: Number(e.target.value) })}
                >
                  {unitsData?.map(u => (
                    <option key={u.id} value={u.id}>
                      Unit #{u.id} — {u.unitNumber} (Property #{u.propertyId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1 font-medium">Choose Tenant</div>
                <select
                  id="lease-tenant-select"
                  className="w-full rounded-md border p-2"
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: Number(e.target.value) })}
                >
                  {tenantsData?.map(t => (
                    <option key={t.id} value={t.id}>
                      Tenant #{t.id} — {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label htmlFor="lease-rent" className="text-sm font-medium">Monthly Rent (₹)</label>
                <input
                  id="lease-rent"
                  className="rounded-md border p-2"
                  type="number"
                  min={0}
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="lease-deposit" className="text-sm font-medium">Security Deposit (₹)</label>
                <input
                  id="lease-deposit"
                  className="rounded-md border p-2"
                  type="number"
                  min={0}
                  value={form.securityDeposit}
                  onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create lease">{creating ? "Creating..." : "Create Lease"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Leases List</h2>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load leases.</p> : (
            <ul className="divide-y">
              {leases.map((l: any) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">
                      Lease #{l.id} — Unit #{l.unitId} • Tenant {tenantName(l.tenantId)}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{l.monthlyRent} rent • ₹{l.securityDeposit} deposit • {l.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <RoleGate allow={["Admin"]}>
                    <button
                      aria-label={`Delete lease ${l.id}`}
                      className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(l.id)}
                    >
                      Delete
                    </button>
                  </RoleGate>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
