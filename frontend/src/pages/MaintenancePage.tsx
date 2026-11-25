import { useMemo, useState } from "react";
import {
  useListMaintenanceQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
} from "../services/endpoints/maintenanceApi";
import type {
  MaintenanceCreate,
  MaintenanceItem,
  MaintenanceUpdate,
} from "../services/endpoints/maintenanceApi";
import { useListPropertiesQuery } from "../services/endpoints/propertiesApi";
import { useListUnitsQuery } from "../services/endpoints/unitsApi";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";

type Filters = { propertyId?: number; unitId?: number };

type FormState = MaintenanceCreate & { status?: number };

const emptyForm: FormState = { propertyId: 0, title: "", description: "", priority: 2 };

function MaintenanceFields({
  form,
  setForm,
  properties,
  units,
  editing,
}: {
  form: FormState;
  setForm: (next: FormState) => void;
  properties: Array<{ id: number; name: string }>;
  units: Array<{ id: number; unitNumber: string; propertyId: number }>;
  editing: boolean;
}) {
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm({ ...form, [key]: value });
  const unitsForProperty = units.filter((u) => u.propertyId === form.propertyId);

  return (
    <>
      {!editing && (
        <div className="mb-4 rounded-md border bg-gray-50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col">
              <label htmlFor="mnt-prop-select" className="text-sm font-medium">Property</label>
              <select
                id="mnt-prop-select"
                className="rounded-md border p-2"
                value={form.propertyId || properties[0]?.id || 0}
                onChange={(e) => setForm({ ...form, propertyId: Number(e.target.value), unitId: undefined })}
              >
                {properties.map((p) => <option key={p.id} value={p.id}>#{p.id} — {p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="mnt-unit-select" className="text-sm font-medium">Unit (by Property)</label>
              <select
                id="mnt-unit-select"
                className="rounded-md border p-2"
                value={form.unitId ?? ""}
                onChange={(e) => update("unitId", e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">— none —</option>
                {unitsForProperty.map((u) => <option key={u.id} value={u.id}>#{u.id} — {u.unitNumber}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="mnt-title" className="text-sm font-medium">Title</label>
          <input id="mnt-title" className="rounded-md border p-2" placeholder="Short summary" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div className="flex flex-col">
          <label htmlFor="mnt-priority" className="text-sm font-medium">Priority</label>
          <select id="mnt-priority" className="rounded-md border p-2" value={form.priority} onChange={(e) => update("priority", Number(e.target.value))}>
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
            <option value={4}>Urgent</option>
          </select>
        </div>
        {editing && (
          <div className="flex flex-col">
            <label htmlFor="mnt-status" className="text-sm font-medium">Status</label>
            <select id="mnt-status" className="rounded-md border p-2" value={form.status ?? 1} onChange={(e) => update("status", Number(e.target.value))}>
              <option value={1}>Open</option>
              <option value={2}>In Progress</option>
              <option value={3}>On Hold</option>
              <option value={4}>Resolved</option>
            </select>
          </div>
        )}
        <div className="flex flex-col sm:col-span-2">
          <label htmlFor="mnt-desc" className="text-sm font-medium">Description</label>
          <textarea id="mnt-desc" className="rounded-md border p-2" placeholder="Details..." value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} />
        </div>
      </div>
    </>
  );
}

export default function MaintenancePage() {
  const [filters, setFilters] = useState<Filters>({});
  const [filterDraft, setFilterDraft] = useState<Filters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceItem | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  const { data, isLoading, isError, refetch } = useListMaintenanceQuery(filters);
  const { data: propsData } = useListPropertiesQuery();
  const { data: unitsData } = useListUnitsQuery(undefined);
  const [createItem, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateItem, { isLoading: updating }] = useUpdateMaintenanceMutation();
  const [deleteItem] = useDeleteMaintenanceMutation();

  const properties = propsData ?? [];
  const units = unitsData ?? [];
  const items = useMemo(() => {
    const merged = new Map<number, MaintenanceItem>();
    (data ?? []).forEach((item) => merged.set(item.id, item));
    return newestFirst(Array.from(merged.values()), (item) => item.createdAtUtc);
  }, [data]);

  const openFilter = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, propertyId: properties[0]?.id ?? 0 });
    setError("");
    setEditing("new");
  };

  const openEdit = (item: MaintenanceItem) => {
    setForm({
      propertyId: item.propertyId,
      unitId: item.unitId ?? undefined,
      title: item.title,
      description: item.description ?? "",
      priority: item.priority,
      status: item.status,
    });
    setError("");
    setEditing(item);
  };

  const closeEditor = () => {
    setEditing(null);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (editing === "new") {
        const payload: MaintenanceCreate = {
          propertyId: form.propertyId || properties[0]?.id || 0,
          title: form.title,
          description: form.description,
          priority: Number(form.priority),
        };
        if (form.unitId) payload.unitId = Number(form.unitId);
        await createItem(payload).unwrap();
      } else if (editing) {
        const body: MaintenanceUpdate = {
          title: form.title,
          description: form.description,
          priority: Number(form.priority),
          status: Number(form.status ?? 1),
        };
        await updateItem({ id: editing.id, body }).unwrap();
      }
      closeEditor();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save maintenance request."));
    }
  };

  const handleMark = async (item: MaintenanceItem, status: number) => {
    try {
      await updateItem({
        id: item.id,
        body: {
          title: item.title,
          description: item.description ?? "",
          priority: item.priority,
          status,
        },
      }).unwrap();
      await refetch();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update request."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete maintenance request?")) return;
    try {
      await deleteItem(id).unwrap();
      await refetch();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete request."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <PageToolbar
        title="Maintenance"
        filterLabel="Filter maintenance requests"
        onFilter={openFilter}
        addLabel="Request"
        onAdd={openCreate}
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Requests List</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p className="text-red-600">Failed to load requests.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-2">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    aria-label={`Edit request ${item.id}`}
                    onClick={() => openEdit(item)}
                    className="w-full rounded-md text-left hover:opacity-80"
                  >
                    <div className="font-medium">
                      #{item.id} — {item.title || "(no title)"}{" "}
                      <span className="text-sm text-gray-500">• Priority {item.priority} • Status {item.status}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Property #{item.propertyId}{item.unitId ? ` • Unit #${item.unitId}` : ""} •{" "}
                      {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString() : "unknown date"}
                    </div>
                  </button>
                  <RoleGate allow={["Admin", "Manager"]}>
                    <div className="mt-2 flex gap-2">
                      <button
                        aria-label={`Mark request ${item.id} in progress`}
                        onClick={() => handleMark(item, 2)}
                        className="rounded-md px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        Mark In&nbsp;Progress
                      </button>
                      <button
                        aria-label={`Mark request ${item.id} resolved`}
                        onClick={() => handleMark(item, 4)}
                        className="rounded-md px-3 py-1 text-sm text-green-700 hover:bg-green-50"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </RoleGate>
                </div>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete request ${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </RoleGate>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={filterOpen} title="Filter maintenance requests" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(filterDraft);
            setFilterOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label htmlFor="mnt-filter-prop" className="text-sm font-medium">Property ID</label>
              <input id="mnt-filter-prop" className="rounded-md border p-2" type="number" min={1} placeholder="e.g., 1" value={filterDraft.propertyId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, propertyId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="mnt-filter-unit" className="text-sm font-medium">Unit ID</label>
              <input id="mnt-filter-unit" className="rounded-md border p-2" type="number" min={1} placeholder="optional" value={filterDraft.unitId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, unitId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setFilterDraft({}); setFilters({}); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Apply maintenance filters">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager", "Staff"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Create maintenance request" : "Edit maintenance request"}
          onClose={closeEditor}
        >
          <form onSubmit={submit}>
            <MaintenanceFields form={form} setForm={setForm} properties={properties} units={units} editing={editing !== "new"} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating}
                aria-label={editing === "new" ? "Create maintenance request" : "Save maintenance request"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Create Request" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
