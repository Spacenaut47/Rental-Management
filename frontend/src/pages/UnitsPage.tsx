import { useState } from "react";
import {
  useListUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} from "../services/endpoints/unitsApi";
import type { Unit, UnitUpdate } from "../services/endpoints/unitsApi";
import { useListPropertiesQuery } from "../services/endpoints/propertiesApi";
import { useListLeasesQuery } from "../services/endpoints/leasesApi";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";

const emptyForm: UnitUpdate = {
  propertyId: 0,
  unitNumber: "",
  bedrooms: 0,
  bathrooms: 0,
  rent: 0,
  sizeSqFt: 0,
  isOccupied: false,
};

function UnitFields({
  form,
  setForm,
  properties,
}: {
  form: UnitUpdate;
  setForm: (next: UnitUpdate) => void;
  properties: Array<{ id: number; name: string }>;
}) {
  const update = <K extends keyof UnitUpdate>(key: K, value: UnitUpdate[K]) =>
    setForm({ ...form, [key]: value });

  return (
    <>
      <div className="mb-3 rounded-md border bg-gray-50 p-3 text-sm">
        <label htmlFor="unit-prop-select" className="mb-2 block font-medium">Property</label>
        <select
          id="unit-prop-select"
          className="rounded-md border p-2"
          value={form.propertyId || properties[0]?.id || 0}
          onChange={(e) => update("propertyId", Number(e.target.value))}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>#{p.id} — {p.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label htmlFor="unit-number" className="text-sm font-medium">Unit Number</label>
          <input id="unit-number" className="rounded-md border p-2" value={form.unitNumber} onChange={(e) => update("unitNumber", e.target.value)} placeholder="e.g., 2A" required />
        </div>
        <div className="flex flex-col">
          <label htmlFor="unit-bedrooms" className="text-sm font-medium">Bedrooms</label>
          <input id="unit-bedrooms" className="rounded-md border p-2" type="number" min={0} value={form.bedrooms} onChange={(e) => update("bedrooms", Number(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="unit-bathrooms" className="text-sm font-medium">Bathrooms</label>
          <input id="unit-bathrooms" className="rounded-md border p-2" type="number" min={0} value={form.bathrooms} onChange={(e) => update("bathrooms", Number(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="unit-rent" className="text-sm font-medium">Monthly Rent (₹)</label>
          <input id="unit-rent" className="rounded-md border p-2" type="number" min={0} step="0.01" value={form.rent} onChange={(e) => update("rent", Number(e.target.value))} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="unit-size" className="text-sm font-medium">Size (sqft)</label>
          <input id="unit-size" className="rounded-md border p-2" type="number" min={0} value={form.sizeSqFt} onChange={(e) => update("sizeSqFt", Number(e.target.value))} />
        </div>
      </div>
    </>
  );
}

export default function UnitsPage() {
  const [propertyId, setPropertyId] = useState<string>("");
  const [filterDraft, setFilterDraft] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | "new" | null>(null);
  const [form, setForm] = useState<UnitUpdate>(emptyForm);
  const [error, setError] = useState("");

  const { data, isLoading, isError, refetch } = useListUnitsQuery(
    propertyId ? { propertyId: Number(propertyId) } : undefined
  );
  const { data: leasesData } = useListLeasesQuery(undefined);
  const { data: propsData } = useListPropertiesQuery();
  const [createUnit, { isLoading: creating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: updating }] = useUpdateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  const properties = propsData ?? [];
  const units = newestFirst(data ?? [], () => undefined);
  const leases = leasesData ?? [];
  const unitsWithOccupancy = units.map((unit) => ({
    ...unit,
    isOccupied: unit.isOccupied || leases.some((l) => l.unitId === unit.id && l.isActive),
  }));

  const openFilter = () => {
    setFilterDraft(propertyId);
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, propertyId: properties[0]?.id ?? 0 });
    setError("");
    setEditing("new");
  };

  const openEdit = (unit: Unit) => {
    setForm({
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      rent: unit.rent,
      sizeSqFt: unit.sizeSqFt,
      isOccupied: unit.isOccupied,
    });
    setError("");
    setEditing(unit);
  };

  const closeEditor = () => {
    setEditing(null);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = {
      ...form,
      propertyId: form.propertyId || properties[0]?.id || 0,
    };
    if (!body.propertyId) {
      setError("Create a property before adding a unit.");
      return;
    }
    setError("");
    try {
      if (editing === "new") {
        await createUnit(body).unwrap();
      } else if (editing) {
        await updateUnit({ id: editing.id, body }).unwrap();
      }
      closeEditor();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save unit."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete unit?")) return;
    try {
      await deleteUnit(id).unwrap();
      await refetch();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete unit."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <PageToolbar
        title="Units"
        filterLabel="Filter units"
        onFilter={openFilter}
        addLabel="Unit"
        onAdd={openCreate}
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Units List</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p className="text-red-600">Failed to load units.</p>
        ) : (
          <ul className="divide-y">
            {unitsWithOccupancy.map((unit) => (
              <li key={unit.id} className="flex items-center justify-between gap-4 py-2">
                <button
                  type="button"
                  aria-label={`Edit unit ${unit.unitNumber}`}
                  onClick={() => openEdit(unit)}
                  className="min-w-0 flex-1 rounded-md text-left hover:opacity-80"
                >
                  <div className="font-medium">Unit #{unit.id} — {unit.unitNumber} • Property #{unit.propertyId}</div>
                  <div className="text-sm text-gray-600">
                    {unit.bedrooms} br / {unit.bathrooms} ba • ₹{unit.rent} • {unit.sizeSqFt} sqft • {unit.isOccupied ? "Occupied" : "Vacant"}
                  </div>
                </button>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete unit ${unit.unitNumber}`}
                    onClick={() => handleDelete(unit.id)}
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

      <Modal open={filterOpen} title="Filter units" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPropertyId(filterDraft);
            setFilterOpen(false);
          }}
        >
          <div className="flex flex-col">
            <label htmlFor="units-filter-propertyId" className="text-sm font-medium">Property ID</label>
            <input
              id="units-filter-propertyId"
              className="rounded-md border p-2"
              type="number"
              min={1}
              placeholder="e.g., 1"
              value={filterDraft}
              onChange={(e) => setFilterDraft(e.target.value)}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setFilterDraft(""); setPropertyId(""); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Apply property filter">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Create unit" : "Edit unit"}
          onClose={closeEditor}
        >
          <form onSubmit={submit}>
            <UnitFields form={form} setForm={setForm} properties={properties} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating}
                aria-label={editing === "new" ? "Create Unit" : "Save Unit"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Create Unit" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
