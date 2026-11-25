import { useState } from "react";
import {
  useListLeasesQuery,
  useCreateLeaseMutation,
  useUpdateLeaseMutation,
  useDeleteLeaseMutation,
} from "../services/endpoints/leasesApi";
import type { Lease, LeaseCreate } from "../services/endpoints/leasesApi";
import { useListUnitsQuery } from "../services/endpoints/unitsApi";
import { useListTenantsQuery } from "../services/endpoints/tenantsApi";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";
import { useDismissedIds } from "../hooks/useDismissedIds";

const emptyForm: LeaseCreate = {
  unitId: 0,
  tenantId: 0,
  startDateUtc: new Date().toISOString(),
  endDateUtc: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  monthlyRent: 1200,
  securityDeposit: 1200,
};

type LeaseFilters = { unitId?: number; tenantId?: number; active?: boolean };

function LeaseFields({
  form,
  setForm,
  units,
  tenants,
}: {
  form: LeaseCreate;
  setForm: (next: LeaseCreate) => void;
  units: Array<{ id: number; unitNumber: string; propertyId: number }>;
  tenants: Array<{ id: number; firstName: string; lastName: string }>;
}) {
  const update = <K extends keyof LeaseCreate>(key: K, value: LeaseCreate[K]) =>
    setForm({ ...form, [key]: value });

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3 rounded-md border bg-gray-50 p-3 text-sm">
        <div className="field">
          <label htmlFor="lease-unit-select" className="mb-1 font-medium">Unit</label>
          <select
            id="lease-unit-select"
            className="w-full field-input"
            value={form.unitId || units[0]?.id || 0}
            onChange={(e) => update("unitId", Number(e.target.value))}
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>Unit #{u.id} — {u.unitNumber} (Property #{u.propertyId})</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lease-tenant-select" className="mb-1 font-medium">Tenant</label>
          <select
            id="lease-tenant-select"
            className="w-full field-input"
            value={form.tenantId || tenants[0]?.id || 0}
            onChange={(e) => update("tenantId", Number(e.target.value))}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>Tenant #{t.id} — {t.firstName} {t.lastName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label htmlFor="lease-start" className="field-label">Start (ISO)</label>
          <input id="lease-start" className="field-input" placeholder="YYYY-MM-DDTHH:mm:ssZ" value={form.startDateUtc} onChange={(e) => update("startDateUtc", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lease-end" className="field-label">End (ISO)</label>
          <input id="lease-end" className="field-input" placeholder="YYYY-MM-DDTHH:mm:ssZ" value={form.endDateUtc} onChange={(e) => update("endDateUtc", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lease-rent" className="field-label">Monthly Rent (₹)</label>
          <input id="lease-rent" className="field-input" type="number" min={0} step="0.01" value={form.monthlyRent} onChange={(e) => update("monthlyRent", Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="lease-deposit" className="field-label">Security Deposit (₹)</label>
          <input id="lease-deposit" className="field-input" type="number" min={0} step="0.01" value={form.securityDeposit} onChange={(e) => update("securityDeposit", Number(e.target.value))} />
        </div>
      </div>
    </>
  );
}

export default function LeasesPage() {
  const [filters, setFilters] = useState<LeaseFilters>({});
  const [filterDraft, setFilterDraft] = useState<LeaseFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | "new" | null>(null);
  const [form, setForm] = useState<LeaseCreate>(emptyForm);
  const [error, setError] = useState("");

  const { data, isLoading, isError } = useListLeasesQuery(filters);
  const { data: unitsData } = useListUnitsQuery(undefined);
  const { data: tenantsData } = useListTenantsQuery(undefined);
  const [createLease, { isLoading: creating }] = useCreateLeaseMutation();
  const [updateLease, { isLoading: updating }] = useUpdateLeaseMutation();
  const [deleteLease] = useDeleteLeaseMutation();
  const { dismiss, isDismissed } = useDismissedIds();

  const units = unitsData ?? [];
  const tenants = tenantsData ?? [];
  const leases = newestFirst(
    (data ?? []).filter((lease) => !isDismissed(lease.id)),
    (lease) => lease.createdAtUtc
  );

  const openFilter = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      unitId: units[0]?.id ?? 0,
      tenantId: tenants[0]?.id ?? 0,
    });
    setError("");
    setEditing("new");
  };

  const openEdit = (lease: Lease) => {
    setForm({
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      startDateUtc: lease.startDateUtc,
      endDateUtc: lease.endDateUtc,
      monthlyRent: lease.monthlyRent,
      securityDeposit: lease.securityDeposit,
    });
    setError("");
    setEditing(lease);
  };

  const closeEditor = () => {
    setEditing(null);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      ...form,
      unitId: form.unitId || units[0]?.id || 0,
      tenantId: form.tenantId || tenants[0]?.id || 0,
    };
    if (!body.unitId || !body.tenantId) {
      setError("Create a unit and a tenant before adding a lease.");
      return;
    }
    setError("");
    try {
      if (editing === "new") {
        await createLease(body).unwrap();
      } else if (editing) {
        await updateLease({ id: editing.id, body }).unwrap();
      }
      closeEditor();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save lease."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete lease?")) return;
    try {
      await deleteLease(id).unwrap();
      dismiss(id);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete lease."));
    }
  };

  const tenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : `#${tenantId}`;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageToolbar
        title="Leases"
        filterLabel="Filter leases"
        onFilter={openFilter}
        addLabel="Lease"
        onAdd={openCreate}
      />

      <div className="panel">
        <h2 className="panel-title">
          <span>Leases List</span>
          <span aria-hidden="true" className="sort-hint">Newest first</span>
        </h2>
        {isLoading ? (
          <p className="state-loading">Loading…</p>
        ) : isError ? (
          <p className="state-error">Failed to load leases.</p>
        ) : (
          <ul className="list">
            {leases.map((lease) => (
              <li key={lease.id} className="list-row">
                <button
                  type="button"
                  aria-label={`Edit lease ${lease.id}`}
                  onClick={() => openEdit(lease)}
                  className="list-row-start"
                >
                  <div className="row-title">Lease #{lease.id} — Unit #{lease.unitId} • Tenant {tenantName(lease.tenantId)}</div>
                  <div className="row-meta">
                    {new Date(lease.startDateUtc).toLocaleDateString()} → {new Date(lease.endDateUtc).toLocaleDateString()} • ₹{lease.monthlyRent} rent • ₹{lease.securityDeposit} deposit •{" "}
                    <span className={`status-badge ${lease.isActive ? "status-active" : "status-inactive"}`}>
                      {lease.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete lease ${lease.id}`}
                    onClick={() => handleDelete(lease.id)}
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

      <Modal open={filterOpen} title="Filter leases" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(filterDraft);
            setFilterOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label htmlFor="lease-filter-unit" className="field-label">Unit ID</label>
              <input id="lease-filter-unit" className="field-input" type="number" min={1} placeholder="e.g., 1" value={filterDraft.unitId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, unitId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="field">
              <label htmlFor="lease-filter-tenant" className="field-label">Tenant ID</label>
              <input id="lease-filter-tenant" className="field-input" type="number" min={1} placeholder="e.g., 1" value={filterDraft.tenantId ?? ""} onChange={(e) => setFilterDraft({ ...filterDraft, tenantId: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="col-span-2 field">
              <label htmlFor="lease-filter-active" className="field-label">Status</label>
              <select id="lease-filter-active" className="field-input" value={filterDraft.active === undefined ? "" : String(filterDraft.active)} onChange={(e) => setFilterDraft({ ...filterDraft, active: e.target.value === "" ? undefined : e.target.value === "true" })}>
                <option value="">Any</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={() => { setFilterDraft({}); setFilters({}); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Apply lease filters">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Create lease" : "Edit lease"}
          onClose={closeEditor}
          wide
        >
          <form onSubmit={submit}>
            <LeaseFields form={form} setForm={setForm} units={units} tenants={tenants} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating}
                aria-label={editing === "new" ? "Create Lease" : "Save Lease"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Create Lease" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
