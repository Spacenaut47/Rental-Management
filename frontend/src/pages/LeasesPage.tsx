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
  const [filters, setFilters] = useState<{unitId?: number; tenantId?: number; active?: boolean}>({});
  const { data, isLoading, isError, refetch } = useListLeasesQuery(filters);

  // Helpers
  const { data: unitsData } = useListUnitsQuery(undefined);
  const { data: tenantsData } = useListTenantsQuery(undefined);

  const [createLease, { isLoading: creating }] = useCreateLeaseMutation();
  const [deleteLease] = useDeleteLeaseMutation();

  const [form, setForm] = useState({
    unitId: 1,
    tenantId: 1,
    startDateUtc: new Date().toISOString(),
    endDateUtc: new Date(Date.now() + 365*24*3600*1000).toISOString(),
    monthlyRent: 1200,
    securityDeposit: 1200,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLease(form).unwrap();
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Leases</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="lease-filter-unit" className="text-xs font-medium text-gray-600">Unit ID</label>
            <input id="lease-filter-unit" className="w-36 rounded-md border p-2" placeholder="e.g., 1" type="number" onChange={(e)=>setFilters(f=>({...f, unitId: e.target.value?Number(e.target.value):undefined}))}/>
          </div>
          <div className="flex flex-col">
            <label htmlFor="lease-filter-tenant" className="text-xs font-medium text-gray-600">Tenant ID</label>
            <input id="lease-filter-tenant" className="w-36 rounded-md border p-2" placeholder="e.g., 1" type="number" onChange={(e)=>setFilters(f=>({...f, tenantId: e.target.value?Number(e.target.value):undefined}))}/>
          </div>
          <div className="flex flex-col">
            <label htmlFor="lease-filter-active" className="text-xs font-medium text-gray-600">Status</label>
            <select id="lease-filter-active" className="rounded-md border p-2" onChange={(e)=>setFilters(f=>({...f, active: e.target.value===""?undefined: e.target.value==="true"}))}>
              <option value="">Any</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <Button onClick={()=>refetch()} aria-label="Apply lease filters">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Lease</h2>

            {/* ID helpers */}
            <div className="mb-3 grid grid-cols-2 gap-3 rounded-md border bg-gray-50 p-3 text-sm">
              <div>
                <div className="mb-1 font-medium">Choose Unit</div>
                <label htmlFor="lease-unit-select" className="sr-only">Unit</label>
                <select
                  id="lease-unit-select"
                  className="w-full rounded-md border p-2"
                  value={form.unitId}
                  onChange={(e)=>setForm({...form, unitId: Number(e.target.value)})}
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
                <label htmlFor="lease-tenant-select" className="sr-only">Tenant</label>
                <select
                  id="lease-tenant-select"
                  className="w-full rounded-md border p-2"
                  value={form.tenantId}
                  onChange={(e)=>setForm({...form, tenantId: Number(e.target.value)})}
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
                <label htmlFor="lease-start" className="text-sm font-medium">Start (ISO)</label>
                <input id="lease-start" className="rounded-md border p-2" placeholder="YYYY-MM-DDTHH:mm:ssZ" value={form.startDateUtc} onChange={(e)=>setForm({...form, startDateUtc:e.target.value})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="lease-end" className="text-sm font-medium">End (ISO)</label>
                <input id="lease-end" className="rounded-md border p-2" placeholder="YYYY-MM-DDTHH:mm:ssZ" value={form.endDateUtc} onChange={(e)=>setForm({...form, endDateUtc:e.target.value})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="lease-rent" className="text-sm font-medium">Monthly Rent (₹)</label>
                <input id="lease-rent" className="rounded-md border p-2" type="number" min={0} value={form.monthlyRent} onChange={(e)=>setForm({...form, monthlyRent:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="lease-deposit" className="text-sm font-medium">Security Deposit (₹)</label>
                <input id="lease-deposit" className="rounded-md border p-2" type="number" min={0} value={form.securityDeposit} onChange={(e)=>setForm({...form, securityDeposit:Number(e.target.value)})}/>
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create lease">{creating ? "Creating..." : "Create Lease"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Leases List (IDs shown)</h2>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load leases.</p> : (
            <ul className="divide-y">
              {data?.map((l)=>(
                <li key={l.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">Lease #{l.id} — Unit #{l.unitId} • Tenant #{l.tenantId}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(l.startDateUtc).toLocaleDateString()} → {new Date(l.endDateUtc).toLocaleDateString()} • ₹{l.monthlyRent} rent • ₹{l.securityDeposit} deposit • {l.isActive?"Active":"Inactive"}
                    </div>
                  </div>
                  <RoleGate allow={["Admin"]}>
                    <button
                      aria-label={`Delete lease ${l.id}`}
                      className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                      onClick={()=>deleteLease(l.id).unwrap().then(()=>refetch())}
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
