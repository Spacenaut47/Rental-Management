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
import { useDismissedIds } from "../hooks/useDismissedIds";

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
            <div className="field">
              <label htmlFor="mnt-prop-select" className="field-label">Property</label>
              <select
                id="mnt-prop-select"
                className="field-input"
                value={form.propertyId || properties[0]?.id || 0}
                onChange={(e) => setForm({ ...form, propertyId: Number(e.target.value), unitId: undefined })}
              >
                {properties.map((p) => <option key={p.id} value={p.id}>#{p.id} — {p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mnt-unit-select" className="field-label">Unit (by Property)</label>
              <select
                id="mnt-unit-select"
                className="field-input"
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
        <div className="field">
          <label htmlFor="mnt-title" className="field-label">Title</label>
          <input id="mnt-title" className="field-input" placeholder="Short summary" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="mnt-priority" className="field-label">Priority</label>
          <select id="mnt-priority" className="field-input" value={form.priority} onChange={(e) => update("priority", Number(e.target.value))}>
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>High</option>
            <option value={4}>Urgent</option>
          </select>
        </div>
        {editing && (
          <div className="field">
            <label htmlFor="mnt-status" className="field-label">Status</label>
            <select id="mnt-status" className="field-input" value={form.status ?? 1} onChange={(e) => update("status", Number(e.target.value))}>
              <option value={1}>Open</option>
              <option value={2}>In Progress</option>
              <option value={3}>On Hold</option>
              <option value={4}>Resolved</option>
            </select>
          </div>
        )}
        <div className="field sm:col-span-2">
          <label htmlFor="mnt-desc" className="field-label">Description</label>
          <textarea id="mnt-desc" className="field-input" placeholder="Details..." value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} />
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

  const { data, isLoading, isError } = useListMaintenanceQuery(filters);
  const { data: propsData } = useListPropertiesQuery();
  const { data: unitsData } = useListUnitsQuery(undefined);
  const [createItem, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateItem, { isLoading: updating }] = useUpdateMaintenanceMutation();
  const [deleteItem] = useDeleteMaintenanceMutation();
  const { dismiss, isDismissed } = useDismissedIds();

  const properties = propsData ?? [];
  const units = unitsData ?? [];
  const items = useMemo(() => {
    const merged = new Map<number, MaintenanceItem>();
    (data ?? []).forEach((item) => {
      if (!isDismissed(item.id)) merged.set(item.id, item);
    });
    return newestFirst(Array.from(merged.values()), (item) => item.createdAtUtc);
  }, [data, isDismissed]);

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
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update request."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete maintenance request?")) return;
    try {
      await deleteItem(id).unwrap();
      dismiss(id);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete request."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageToolbar
        title="Maintenance"
        filterLabel="Filter maintenance requests"
        onFilter={openFilter}
        addLabel="Request"
        onAdd={openCreate}
      />

      <div className="panel">
        <h2 className="panel-title">
          <span>Requests List</span>
          <span aria-hidden="true" className="sort-hint">Newest first</span>
        </h2>
        {isLoading ? (
          <p className="state-loading">Loading…</p>
        ) : isError ? (
          <p className="state-error">Failed to load requests.</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li key={item.id} className="list-row">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    aria-label={`Edit request ${item.id}`}
                    onClick={() => openEdit(item)}
                    className="list-row-start w-full"
                  >
                    <div className="row-title">
                      #{item.id} — {item.title || "(no title)"}{" "}
                      <span className="text-sm text-slate-400">• Priority {item.priority} • </span>
                      <span className={`status-badge ${item.status >= 4 ? "status-active" : "status-inactive"}`}>
                        Status {item.status}
                      </span>
                    </div>
                    <div className="row-meta">
                      Property #{item.propertyId}{item.unitId ? ` • Unit #${item.unitId}` : ""} •{" "}
                      {item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString() : "unknown date"}
                    </div>
                  </button>
                  <RoleGate allow={["Admin", "Manager"]}>
                    <div className="mt-2 flex gap-2">
                      <button
                        aria-label={`Mark request ${item.id} in progress`}
                        onClick={() => handleMark(item, 2)}
                        className="row-action-brand"
                      >
                        Mark In&nbsp;Progress
                      </button>
                      <button
                        aria-label={`Mark request ${item.id} resolved`}
                        onClick={() => handleMark(item, 4)}
                        className="row-action-success"
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
                    className="row-action"
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
            <div className="field">
              <label htmlFor="mnt-filter-prop" className="field-label">Property ID</label>
              <input id="mnt-filter-prop" className="field-input" type="number" min={1} placeholder="e.g., 1" value={filterDraft.propertyId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, propertyId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="field">
              <label htmlFor="mnt-filter-unit" className="field-label">Unit ID</label>
              <input id="mnt-filter-unit" className="field-input" type="number" min={1} placeholder="optional" value={filterDraft.unitId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, unitId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
          <div className="form-actions">
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
            <div className="form-actions">
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
