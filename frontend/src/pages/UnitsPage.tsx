import { useState } from "react";
import {
  useListUnitsQuery,
  useCreateUnitMutation,
  useDeleteUnitMutation,
} from "../services/endpoints/unitsApi";
import { useListPropertiesQuery } from "../services/endpoints/propertiesApi";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

export default function UnitsPage() {
  const [propertyId, setPid] = useState<number | "">("");
  const { data, isLoading, isError, refetch } = useListUnitsQuery(
    propertyId ? { propertyId: Number(propertyId) } : undefined
  );

  // For helper dropdown
  const { data: propsData } = useListPropertiesQuery();

  const [createUnit, { isLoading: creating }] = useCreateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();
  const [form, setForm] = useState({
    propertyId: 1,
    unitNumber: "",
    bedrooms: 0,
    bathrooms: 0,
    rent: 0,
    sizeSqFt: 0,
    isOccupied: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUnit({ ...form, propertyId: Number(form.propertyId) }).unwrap();
    setForm({ ...form, unitNumber: "", bedrooms: 0, bathrooms: 0, rent: 0, sizeSqFt: 0, isOccupied: false });
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Units</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="units-filter-propertyId" className="text-xs font-medium text-gray-600">
              Filter by Property ID
            </label>
            <input
              id="units-filter-propertyId"
              className="w-40 rounded-md border p-2"
              value={propertyId}
              onChange={(e)=>setPid((e.target.value as any) || "")}
              type="number"
              min={1}
              placeholder="e.g., 1"
            />
          </div>
          <Button onClick={()=>refetch()} aria-label="Apply property filter">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Unit</h2>

            {/* ID helper for properties */}
            <div className="mb-3 rounded-md border bg-gray-50 p-3 text-sm">
              <div className="mb-2 font-medium">Choose Property</div>
              <div className="flex items-center gap-2">
                <label htmlFor="unit-prop-select" className="sr-only">Property</label>
                <select
                  id="unit-prop-select"
                  className="rounded-md border p-2"
                  value={form.propertyId}
                  onChange={(e)=>setForm({...form, propertyId:Number(e.target.value)})}
                >
                  {propsData?.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-600">Selected: Property #{form.propertyId}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label htmlFor="unit-number" className="text-sm font-medium">Unit Number</label>
                <input id="unit-number" className="rounded-md border p-2" value={form.unitNumber} onChange={(e)=>setForm({...form, unitNumber:e.target.value})} placeholder="e.g., 2A" required/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="unit-bedrooms" className="text-sm font-medium">Bedrooms</label>
                <input id="unit-bedrooms" className="rounded-md border p-2" type="number" min={0} value={form.bedrooms} onChange={(e)=>setForm({...form, bedrooms:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="unit-bathrooms" className="text-sm font-medium">Bathrooms</label>
                <input id="unit-bathrooms" className="rounded-md border p-2" type="number" min={0} value={form.bathrooms} onChange={(e)=>setForm({...form, bathrooms:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="unit-rent" className="text-sm font-medium">Monthly Rent (₹)</label>
                <input id="unit-rent" className="rounded-md border p-2" type="number" min={0} value={form.rent} onChange={(e)=>setForm({...form, rent:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="unit-size" className="text-sm font-medium">Size (sqft)</label>
                <input id="unit-size" className="rounded-md border p-2" type="number" min={0} value={form.sizeSqFt} onChange={(e)=>setForm({...form, sizeSqFt:Number(e.target.value)})}/>
              </div>
              <div className="col-span-2">
                <label htmlFor="unit-occupied" className="inline-flex items-center gap-2 text-sm">
                  <input id="unit-occupied" type="checkbox" checked={form.isOccupied} onChange={(e)=>setForm({...form, isOccupied:e.target.checked})}/>
                  Mark as Occupied
                </label>
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create unit">{creating ? "Creating..." : "Create Unit"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Units List (IDs shown)</h2>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load units.</p> : (
            <ul className="divide-y">
              {data?.map((u)=>(
                <li key={u.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">Unit #{u.id} — {u.unitNumber} • Property #{u.propertyId}</div>
                    <div className="text-sm text-gray-600">
                      {u.bedrooms} br / {u.bathrooms} ba • ₹{u.rent} • {u.sizeSqFt} sqft • {u.isOccupied ? "Occupied" : "Vacant"}
                    </div>
                  </div>
                  <RoleGate allow={["Admin"]}>
                    <button
                      aria-label={`Delete unit ${u.unitNumber}`}
                      className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                      onClick={()=>deleteUnit(u.id).unwrap().then(()=>refetch())}
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
