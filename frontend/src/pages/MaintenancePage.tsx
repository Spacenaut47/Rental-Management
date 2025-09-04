import { useState } from "react";
import {
  useListMaintenanceQuery,
  useCreateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from "../services/endpoints/maintenanceApi";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

export default function MaintenancePage() {
  const [filters, setFilters] = useState<{propertyId?: number; unitId?: number; tenantId?: number}>({ propertyId: 1 });
  const { data, isLoading, isError, refetch } = useListMaintenanceQuery(filters);
  const [createItem, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateItem] = useUpdateMaintenanceMutation();
  const [deleteItem] = useDeleteMaintenanceMutation();

  const [form, setForm] = useState({
    propertyId: 1,
    unitId: 1,
    tenantId: 1,
    title: "",
    description: "",
    priority: 2,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(form).unwrap();
    setForm({ ...form, title: "", description: "" });
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-prop" className="text-xs font-medium text-gray-600">Property ID</label>
            <input id="mnt-filter-prop" className="w-36 rounded-md border p-2" placeholder="e.g., 1" type="number" min={1} value={filters.propertyId ?? ""} onChange={(e)=>setFilters(f=>({...f, propertyId: e.target.value?Number(e.target.value):undefined}))}/>
          </div>
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-unit" className="text-xs font-medium text-gray-600">Unit ID</label>
            <input id="mnt-filter-unit" className="w-36 rounded-md border p-2" placeholder="optional" type="number" min={1} value={filters.unitId ?? ""} onChange={(e)=>setFilters(f=>({...f, unitId: e.target.value?Number(e.target.value):undefined}))}/>
          </div>
          <div className="flex flex-col">
            <label htmlFor="mnt-filter-tenant" className="text-xs font-medium text-gray-600">Tenant ID</label>
            <input id="mnt-filter-tenant" className="w-36 rounded-md border p-2" placeholder="optional" type="number" min={1} value={filters.tenantId ?? ""} onChange={(e)=>setFilters(f=>({...f, tenantId: e.target.value?Number(e.target.value):undefined}))}/>
          </div>
          <Button onClick={()=>refetch()} aria-label="Apply maintenance filters">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager","Staff"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Request</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label htmlFor="mnt-prop" className="text-sm font-medium">Property ID</label>
                <input id="mnt-prop" className="rounded-md border p-2" type="number" min={1} value={form.propertyId} onChange={(e)=>setForm({...form, propertyId:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="mnt-unit" className="text-sm font-medium">Unit ID (optional)</label>
                <input id="mnt-unit" className="rounded-md border p-2" type="number" min={1} value={form.unitId} onChange={(e)=>setForm({...form, unitId:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="mnt-tenant" className="text-sm font-medium">Tenant ID (optional)</label>
                <input id="mnt-tenant" className="rounded-md border p-2" type="number" min={1} value={form.tenantId} onChange={(e)=>setForm({...form, tenantId:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="mnt-priority" className="text-sm font-medium">Priority</label>
                <select id="mnt-priority" className="rounded-md border p-2" value={form.priority} onChange={(e)=>setForm({...form, priority:Number(e.target.value)})}>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Urgent</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="mnt-title" className="text-sm font-medium">Title</label>
                <input id="mnt-title" className="rounded-md border p-2" placeholder="Short summary" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required/>
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="mnt-desc" className="text-sm font-medium">Description (optional)</label>
                <textarea id="mnt-desc" className="rounded-md border p-2" placeholder="Details..." value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create maintenance request">{creating ? "Creating..." : "Create Request"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Requests List</h2>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load.</p> : (
            <ul className="divide-y">
              {data?.map((m)=>(
                <li key={m.id} className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">{m.title} • Priority {m.priority} • Status {m.status}</div>
                    <div className="text-sm text-gray-600">
                      Property {m.propertyId}
                      {m.unitId ? ` • Unit ${m.unitId}` : ""} 
                      {m.tenantId ? ` • Tenant ${m.tenantId}` : ""} 
                      • {new Date(m.createdAtUtc).toLocaleString()}
                    </div>
                    <RoleGate allow={["Admin","Manager"]}>
                      <div className="mt-2 flex gap-2">
                        <button
                          aria-label={`Mark request ${m.id} in progress`}
                          onClick={()=>updateItem({ id: m.id, body: { title: m.title, description: m.description ?? "", priority: m.priority, status: 2 } }).unwrap().then(()=>refetch())}
                          className="rounded-md px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
                        >Mark In&nbsp;Progress</button>
                        <button
                          aria-label={`Mark request ${m.id} resolved`}
                          onClick={()=>updateItem({ id: m.id, body: { title: m.title, description: m.description ?? "", priority: m.priority, status: 4 } }).unwrap().then(()=>refetch())}
                          className="rounded-md px-3 py-1 text-sm text-green-700 hover:bg-green-50"
                        >Mark Resolved</button>
                      </div>
                    </RoleGate>
                  </div>
                  <RoleGate allow={["Admin"]}>
                    <button
                      aria-label={`Delete request ${m.id}`}
                      onClick={()=>deleteItem(m.id).unwrap().then(()=>refetch())}
                      className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >Delete</button>
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
