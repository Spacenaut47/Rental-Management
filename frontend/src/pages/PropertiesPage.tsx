import { useMemo, useState } from "react";
import {
  useListPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} from "../services/endpoints/propertiesApi";
import type { Property, PropertyCreate } from "../types/property";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";
import { useDismissedIds } from "../hooks/useDismissedIds";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";

const emptyForm: PropertyCreate = {
  name: "",
  addressLine1: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  description: "",
};

type FieldProps = {
  form: PropertyCreate;
  setForm: (next: PropertyCreate) => void;
};

function PropertyFields({ form, setForm }: FieldProps) {
  const update = (key: keyof PropertyCreate, value: string) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 field">
        <label htmlFor="prop-name" className="field-label">Name</label>
        <input id="prop-name" className="field-input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </div>
      <div className="col-span-2 field">
        <label htmlFor="prop-addr1" className="field-label">Address Line 1</label>
        <input id="prop-addr1" className="field-input" value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="prop-city" className="field-label">City</label>
        <input id="prop-city" className="field-input" value={form.city} onChange={(e) => update("city", e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="prop-state" className="field-label">State</label>
        <input id="prop-state" className="field-input" value={form.state} onChange={(e) => update("state", e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="prop-zip" className="field-label">ZIP / Postal</label>
        <input id="prop-zip" className="field-input" value={form.zip} onChange={(e) => update("zip", e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="prop-country" className="field-label">Country</label>
        <input id="prop-country" className="field-input" value={form.country} onChange={(e) => update("country", e.target.value)} required />
      </div>
      <div className="col-span-2 field">
        <label htmlFor="prop-desc" className="field-label">Description (optional)</label>
        <textarea id="prop-desc" className="field-input" value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { data, isLoading, isError } = useListPropertiesQuery();
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: updating }] = useUpdatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();
  const { dismiss, isDismissed } = useDismissedIds();

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [form, setForm] = useState<PropertyCreate>(emptyForm);
  const [error, setError] = useState("");

  const properties = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = (data ?? []).filter((p) => !isDismissed(p.id));
    const matches = !term
      ? visible
      : visible.filter((p) =>
          [p.name, p.city, p.state, p.country, p.addressLine1]
            .some((value) => value?.toLowerCase().includes(term))
        );
    return newestFirst(matches, (p) => p.createdAt);
  }, [data, search, isDismissed]);

  const openFilter = () => {
    setDraftSearch(search);
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setEditing("new");
  };

  const openEdit = (property: Property) => {
    const { name, description, addressLine1, city, state, zip, country } = property;
    setForm({ name, description: description ?? "", addressLine1, city, state, zip, country });
    setError("");
    setEditing(property);
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
        await createProperty(form).unwrap();
      } else if (editing) {
        await updateProperty({ id: editing.id, body: form }).unwrap();
      }
      closeEditor();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save property."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete property?")) return;
    try {
      await deleteProperty(id).unwrap();
      dismiss(id);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete property."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageToolbar
        title="Properties"
        filterLabel="Filter properties"
        onFilter={openFilter}
        addLabel="Property"
        onAdd={openCreate}
      />

      <div className="panel">
        <h2 className="panel-title">
          <span>Properties List</span>
          <span aria-hidden="true" className="sort-hint">Newest first</span>
        </h2>
        {isLoading ? (
          <p className="state-loading">Loading…</p>
        ) : isError ? (
          <p className="state-error">Failed to load properties.</p>
        ) : (
          <ul className="list">
            {properties.map((p) => (
              <li key={p.id} className="list-row">
                <button
                  type="button"
                  aria-label={`Edit property ${p.name}`}
                  onClick={() => openEdit(p)}
                  className="list-row-start"
                >
                  <div className="row-title">Property #{p.id} — {p.name}</div>
                  <div className="row-meta">
                    {p.addressLine1}, {p.city}, {p.state} {p.zip}, {p.country}
                  </div>
                </button>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete property ${p.name}`}
                    onClick={() => handleDelete(p.id)}
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

      <Modal open={filterOpen} title="Filter properties" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(draftSearch);
            setFilterOpen(false);
          }}
        >
          <div className="field">
            <label htmlFor="property-filter-search" className="field-label">Search</label>
            <input
              id="property-filter-search"
              className="field-input"
              placeholder="Name, city, state or address"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={() => { setDraftSearch(""); setSearch(""); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Apply property filters">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Create property" : "Edit property"}
          onClose={closeEditor}
        >
          <form onSubmit={submit}>
            <PropertyFields form={form} setForm={setForm} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating}
                aria-label={editing === "new" ? "Create Property" : "Save Property"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Create Property" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
