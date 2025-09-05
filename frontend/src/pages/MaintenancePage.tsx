// src/pages/MaintenancePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  useListMaintenanceQuery,
  useCreateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from "../services/endpoints/maintenanceApi";
import { useListPropertiesQuery } from "../services/endpoints/propertiesApi";
import { useListUnitsQuery } from "../services/endpoints/unitsApi";
import { useListTenantsQuery } from "../services/endpoints/tenantsApi";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

export default function MaintenancePage() {
  const [filters, setFilters] = useState<{ propertyId?: number; unitId?: number; tenantId?: number }>({ propertyId: 1 });
  const { data, isLoading, isError, refetch } = useListMaintenanceQuery(filters);

  const { data: propsData, refetch: refetchProps } = useListPropertiesQuery();
  const { data: unitsData, refetch: refetchUnits } = useListUnitsQuery(undefined);
  const { data: tenantsData, refetch: refetchTenants } = useListTenantsQuery(undefined);

  const [createItem, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateItem] = useUpdateMaintenanceMutation();
  const [deleteItem] = useDeleteMaintenanceMutation();

  const [form, setForm] = useState({
    propertyId: propsData && propsData.length > 0 ? propsData[0].id : 1,
    unitId: undefined as number | undefined,
    tenantId: undefined as number | undefined,
    title: "",
    description: "",
    priority: 2,
  });

  useEffect(() => {
    if (propsData && propsData.length > 0 && !form.propertyId) {
      setForm((f) => ({ ...f, propertyId: propsData[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsData]);

  const unitsForProperty = useMemo(() => {
    if (!unitsData) return [];
    if (!form.propertyId) return unitsData;
    return unitsData.filter((u) => u.propertyId === Number(form.propertyId));
  }, [unitsData, form.propertyId]);

  useEffect(() => {
    if (form.unitId && form.propertyId) {
      const ok = unitsForProperty.some((u) => u.id === form.unitId);
      if (!ok) setForm((f) => ({ ...f, unitId: undefined }));
    }
  }, [form.propertyId, unitsForProperty, form.unitId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      propertyId: Number(form.propertyId),
      title: form.title,
      description: form.description,
      priority: Number(form.priority),
    };
    if (form.unitId) payload.unitId = Number(form.unitId);
    if (form.tenantId) payload.tenantId = Number(form.tenantId);

    try {
      await createItem(payload).unwrap();
      setForm((f) => ({ ...f, title: "", description: "" }));
      await refetch();
    } catch (err) {
      console.error("Create maintenance failed", err);
      alert("Failed to create maintenance request.");
    }
  };

  useEffect(() => {
    refetchProps();
    refetchUnits();
    refetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMark = async (id: number, status: number, item: any) => {
    try {
      await updateItem({ id, body: { title: item.title, description: item.description ?? "", priority: item.priority, status } }).unwrap();
      await refetch();
    } catch (err) {
      console.error("Update maintenance failed", err);
      alert("Failed to update request.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete maintenance request?")) return;
    try {
      await deleteItem(id).unwrap();
      await refetch();
    } catch (err) {
      console.error("Delete maintenance failed", err);
      alert("Failed to delete request.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-prop" className="text-xs font-medium text-gray-600">Property ID</label>
            <input
              id="mnt-filter-prop"
              className="w-36 rounded-md border p-2"
              placeholder="e.g., 1"
              type="number"
              min={1}
              value={filters.propertyId ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, propertyId: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-unit" className="text-xs font-medium text-gray-600">Unit ID</label>
            <input
              id="mnt-filter-unit"
              className="w-36 rounded-md border p-2"
              placeholder="optional"
              type="number"
              min={1}
              value={filters.unitId ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, unitId: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-tenant" className="text-xs font-medium text-gray-600">Tenant ID</label>
            <input
              id="mnt-filter-tenant"
              className="w-36 rounded-md border p-2"
              placeholder="optional"
              type="number"
              min={1}
              value={filters.tenantId ?? ""}
              onChange={(e) => setFilters(f => ({ ...f, tenantId: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <Button onClick={() => refetch()} aria-label="Apply maintenance filters">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager","Staff"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Maintenance Request</h2>
            <div className="mb-4 rounded-md border bg-gray-50 p-3">
              <div className="mb-2 font-medium">Choose IDs (live)</div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col">
                  <label htmlFor="mnt-prop-select" className="text-sm font-medium">Property</label>
                  <select id="mnt-prop-select" className="rounded-md border p-2" value={form.propertyId} onChange={(e) => setForm(f => ({ ...f, propertyId: Number(e.target.value) }))}>
                    {propsData?.map(p => (
                      <option key={p.id} value={p.id}>#{p.id} — {p.name}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-600 mt-1">Selected: #{form.propertyId}</div>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="mnt-unit-select" className="text-sm font-medium">Unit (by Property)</label>
                  <select id="mnt-unit-select" className="rounded-md border p-2" value={form.unitId ?? ""} onChange={(e) => setForm(f => ({ ...f, unitId: e.target.value ? Number(e.target.value) : undefined }))}>
                    <option value="">— none —</option>
                    {unitsForProperty.map(u => (<option key={u.id} value={u.id}>#{u.id} — {u.unitNumber}</option>))}
                  </select>
                  <div className="text-xs text-gray-600 mt-1">{form.unitId ? `Selected: #${form.unitId}` : "No unit selected"}</div>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="mnt-tenant-select" className="text-sm font-medium">Tenant</label>
                  <select id="mnt-tenant-select" className="rounded-md border p-2" value={form.tenantId ?? ""} onChange={(e) => setForm(f => ({ ...f, tenantId: e.target.value ? Number(e.target.value) : undefined }))}>
                    <option value="">— none —</option>
                    {tenantsData?.map(t => (<option key={t.id} value={t.id}>#{t.id} — {t.firstName} {t.lastName}</option>))}
                  </select>
                  <div className="text-xs text-gray-600 mt-1">{form.tenantId ? `Selected: #${form.tenantId}` : "No tenant selected"}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col">
                <label htmlFor="mnt-title" className="text-sm font-medium">Title</label>
                <input id="mnt-title" className="rounded-md border p-2" placeholder="Short summary" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div className="flex flex-col">
                <label htmlFor="mnt-priority" className="text-sm font-medium">Priority</label>
                <select id="mnt-priority" className="rounded-md border p-2" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: Number(e.target.value) }))}>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Urgent</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2 flex flex-col">
                <label htmlFor="mnt-desc" className="text-sm font-medium">Description</label>
                <textarea id="mnt-desc" className="rounded-md border p-2" placeholder="Details..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <div className="mt-3">
              <Button disabled={creating} aria-label="Create maintenance request">{creating ? "Creating..." : "Create Request"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Requests List (IDs shown)</h2>

          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load.</p> : (
            <ul className="divide-y">
              {data?.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">#{m.id} — {m.title} <span className="text-sm text-gray-500">• Priority {m.priority} • Status {m.status}</span></div>
                    <div className="text-sm text-gray-600">
                      Property #{m.propertyId}{m.unitId ? ` • Unit #${m.unitId}` : ""}{m.tenantId ? ` • Tenant #${m.tenantId}` : ""} • {new Date(m.createdAtUtc).toLocaleString()}
                    </div>

                    <RoleGate allow={["Admin","Manager"]}>
                      <div className="mt-2 flex gap-2">
                        <button aria-label={`Mark request ${m.id} in progress`} onClick={() => handleMark(m.id, 2, m)} className="rounded-md px-3 py-1 text-sm text-blue-700 hover:bg-blue-50">Mark In&nbsp;Progress</button>

                        <button aria-label={`Mark request ${m.id} resolved`} onClick={() => handleMark(m.id, 4, m)} className="rounded-md px-3 py-1 text-sm text-green-700 hover:bg-green-50">Mark Resolved</button>
                      </div>
                    </RoleGate>
                  </div>

                  <RoleGate allow={["Admin"]}>
                    <button aria-label={`Delete request ${m.id}`} onClick={() => handleDelete(m.id)} className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
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
