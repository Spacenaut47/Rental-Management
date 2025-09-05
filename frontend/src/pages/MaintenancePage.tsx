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
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

type AnyItem = Record<string, any>;

function getField<T = any>(obj: AnyItem, ...candidates: string[]): T | undefined {
  for (const c of candidates) {
    if (obj && typeof obj[c] !== "undefined") return obj[c] as T;
  }
  return undefined;
}

export default function MaintenancePage() {
  const [filters, setFilters] = useState<{ propertyId?: number; unitId?: number }>({ propertyId: 1 });
  const { data, isLoading, isError, refetch } = useListMaintenanceQuery(filters);

  const { data: propsData, refetch: refetchProps } = useListPropertiesQuery();
  const { data: unitsData, refetch: refetchUnits } = useListUnitsQuery(undefined);

  const [createItem, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateItem] = useUpdateMaintenanceMutation();
  const [deleteItem] = useDeleteMaintenanceMutation();

  // Local optimistic cache for created items (so they appear instantly)
  const [optimisticItems, setOptimisticItems] = useState<AnyItem[]>([]);

  const [form, setForm] = useState({
    propertyId: propsData && propsData.length > 0 ? propsData[0].id : 1,
    unitId: undefined as number | undefined,
    title: "",
    description: "",
    priority: 2,
  });

  useEffect(() => {
    // set default property if props load after mount
    if (propsData && propsData.length > 0 && (!form.propertyId || !propsData.some(p => p.id === form.propertyId))) {
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
    refetchProps();
    refetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      propertyId: Number(form.propertyId),
      title: form.title,
      description: form.description,
      priority: Number(form.priority),
    };
    if (form.unitId) payload.unitId = Number(form.unitId);

    try {
      const created = await createItem(payload).unwrap();
      // push created item into optimistic cache so it shows immediately
      setOptimisticItems((cur) => {
        // avoid duplicates
        if (cur.some((it) => getField(it, "id", "Id") === getField(created, "id", "Id"))) return cur;
        return [created, ...cur];
      });
      // clear form fields
      setForm((f) => ({ ...f, title: "", description: "" }));
      // try refresh of main list (if backend invalidation works)
      await refetch();
    } catch (err) {
      console.error("Create maintenance failed", err);
      const anyErr = err as any;
      let msg = "Failed to create maintenance request.";
      if (anyErr?.data) {
        msg += " " + JSON.stringify(anyErr.data);
      } else if (anyErr?.error) {
        msg += " " + anyErr.error;
      }
      alert(msg);
    }
  };

  const handleMark = async (id: number, status: number, item: AnyItem) => {
    try {
      const body = {
        title: getField(item, "title", "Title"),
        description: getField(item, "description", "Description") ?? "",
        priority: Number(getField(item, "priority", "Priority") ?? 2),
        status,
      };
      await updateItem({ id, body }).unwrap();
      // optimistic remove or update: simplest is to refetch
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
      // remove optimistic copy if present
      setOptimisticItems((cur) => cur.filter((it) => getField(it, "id", "Id") !== id));
      await refetch();
    } catch (err) {
      console.error("Delete maintenance failed", err);
      alert("Failed to delete request.");
    }
  };

  // merge server data + optimistic items and avoid duplicates by id
  const serverItems: AnyItem[] = Array.isArray(data) ? data as AnyItem[] : (data?.items ?? data ?? []);
  const mergedById = new Map<number | string, AnyItem>();
  (optimisticItems || []).forEach((it) => mergedById.set(getField(it, "id", "Id"), it));
  (serverItems || []).forEach((it) => mergedById.set(getField(it, "id", "Id"), it));
  const items = Array.from(mergedById.values());

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
          <Button onClick={() => refetch()} aria-label="Apply maintenance filters">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager","Staff"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Maintenance Request</h2>
            <div className="mb-4 rounded-md border bg-gray-50 p-3">
              <div className="mb-2 font-medium">Choose IDs (live)</div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col">
                  <label htmlFor="mnt-prop-select" className="text-sm font-medium">Property</label>
                  <select id="mnt-prop-select" className="rounded-md border p-2" value={form.propertyId} onChange={(e) => setForm(f => ({ ...f, propertyId: Number(e.target.value) }))}>
                    {propsData?.map(p => (<option key={p.id} value={p.id}>#{p.id} — {p.name}</option>))}
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
              {items.map((m: AnyItem) => {
                const id = getField<number>(m, "id", "Id");
                const title = getField<string>(m, "title", "Title") ?? "(no title)";
                const priority = getField<number>(m, "priority", "Priority");
                const status = getField<number>(m, "status", "Status");
                const propertyId = getField<number>(m, "propertyId", "PropertyId");
                const unitId = getField<number>(m, "unitId", "UnitId");
                const createdAt = getField<string>(m, "createdAtUtc", "CreatedAtUtc") ?? getField<string>(m, "createdAt", "CreatedAt");
                return (
                  <li key={id} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <div className="font-medium">#{id} — {title} <span className="text-sm text-gray-500">• Priority {priority} • Status {status}</span></div>
                      <div className="text-sm text-gray-600">
                        Property #{propertyId}{unitId ? ` • Unit #${unitId}` : ""} • {createdAt ? new Date(createdAt).toLocaleString() : "unknown date"}
                      </div>

                      <RoleGate allow={["Admin","Manager"]}>
                        <div className="mt-2 flex gap-2">
                          <button aria-label={`Mark request ${id} in progress`} onClick={() => handleMark(id, 2, m)} className="rounded-md px-3 py-1 text-sm text-blue-700 hover:bg-blue-50">Mark In&nbsp;Progress</button>
                          <button aria-label={`Mark request ${id} resolved`} onClick={() => handleMark(id, 4, m)} className="rounded-md px-3 py-1 text-sm text-green-700 hover:bg-green-50">Mark Resolved</button>
                        </div>
                      </RoleGate>
                    </div>

                    <RoleGate allow={["Admin"]}>
                      <button aria-label={`Delete request ${id}`} onClick={() => handleDelete(id)} className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </RoleGate>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
