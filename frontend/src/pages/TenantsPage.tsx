import { useState } from "react";
import {
  useListTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} from "../services/endpoints/tenantsApi";
import type { Tenant, TenantCreate } from "../services/endpoints/tenantsApi";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";
import { useDismissedIds } from "../hooks/useDismissedIds";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";

const emptyForm: TenantCreate = { firstName: "", lastName: "", email: "", phone: "" };

function TenantFields({
  form,
  setForm,
}: {
  form: TenantCreate;
  setForm: (next: TenantCreate) => void;
}) {
  const update = (key: keyof TenantCreate, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="field">
        <label htmlFor="tenant-firstname" className="field-label">First Name</label>
        <input id="tenant-firstname" className="field-input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="tenant-lastname" className="field-label">Last Name</label>
        <input id="tenant-lastname" className="field-input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
      </div>
      <div className="col-span-2 field">
        <label htmlFor="tenant-email" className="field-label">Email</label>
        <input id="tenant-email" className="field-input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
      </div>
      <div className="col-span-2 field">
        <label htmlFor="tenant-phone" className="field-label">Phone (optional)</label>
        <input id="tenant-phone" className="field-input" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const { data, isLoading, isError } = useListTenantsQuery({ search: search || undefined });
  const [createTenant, { isLoading: creating }] = useCreateTenantMutation();
  const [updateTenant, { isLoading: updating }] = useUpdateTenantMutation();
  const [deleteTenant] = useDeleteTenantMutation();
  const { dismiss, isDismissed } = useDismissedIds();

  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | "new" | null>(null);
  const [form, setForm] = useState<TenantCreate>(emptyForm);
  const [error, setError] = useState("");

  const tenants = newestFirst(
    (data ?? []).filter((tenant) => !isDismissed(tenant.id)),
    (tenant) => tenant.createdAt
  );

  const openFilter = () => {
    setDraftSearch(search);
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setEditing("new");
  };

  const openEdit = (tenant: Tenant) => {
    const { firstName, lastName, email, phone } = tenant;
    setForm({ firstName, lastName, email, phone: phone ?? "" });
    setError("");
    setEditing(tenant);
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
        await createTenant(form).unwrap();
      } else if (editing) {
        await updateTenant({ id: editing.id, body: form }).unwrap();
      }
      closeEditor();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save tenant."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete tenant?")) return;
    try {
      await deleteTenant(id).unwrap();
      dismiss(id);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete tenant."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageToolbar
        title="Tenants"
        filterLabel="Filter tenants"
        onFilter={openFilter}
        addLabel="Tenant"
        onAdd={openCreate}
      />

      <div className="panel">
        <h2 className="panel-title">
          <span>Tenants List</span>
          <span aria-hidden="true" className="sort-hint">Newest first</span>
        </h2>
        {isLoading ? (
          <p className="state-loading">Loading…</p>
        ) : isError ? (
          <p className="state-error">Failed to load tenants.</p>
        ) : (
          <ul className="list">
            {tenants.map((t) => (
              <li key={t.id} className="list-row">
                <button
                  type="button"
                  aria-label={`Edit tenant ${t.firstName} ${t.lastName}`}
                  onClick={() => openEdit(t)}
                  className="list-row-start"
                >
                  <div className="row-title">Tenant #{t.id} — {t.firstName} {t.lastName}</div>
                  <div className="row-meta">{t.email} {t.phone ? `• ${t.phone}` : ""}</div>
                </button>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete tenant ${t.firstName} ${t.lastName}`}
                    onClick={() => handleDelete(t.id)}
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

      <Modal open={filterOpen} title="Filter tenants" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(draftSearch);
            setFilterOpen(false);
          }}
        >
          <div className="field">
            <label htmlFor="tenant-search" className="field-label">Search (name or email)</label>
            <input
              id="tenant-search"
              className="field-input"
              placeholder="e.g., John or john@demo.com"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={() => { setDraftSearch(""); setSearch(""); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Search tenants">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Create tenant" : "Edit tenant"}
          onClose={closeEditor}
        >
          <form onSubmit={submit}>
            <TenantFields form={form} setForm={setForm} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating}
                aria-label={editing === "new" ? "Create Tenant" : "Save Tenant"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Create Tenant" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
