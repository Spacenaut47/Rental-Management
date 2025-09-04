import { useState } from "react";
import {
  useListPropertiesQuery,
  useCreatePropertyMutation,
  useDeletePropertyMutation,
} from "../services/endpoints/propertiesApi";
import Button from "../components/ui/Button";

export default function PropertiesPage() {
  const { data, isLoading, isError, refetch } = useListPropertiesQuery();
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();
  const [form, setForm] = useState({
    name: "",
    addressLine1: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    description: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProperty(form).unwrap();
    setForm({ name: "", addressLine1: "", city: "", state: "", zip: "", country: "", description: "" });
    refetch();
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Properties</h1>
          <Button onClick={() => refetch()} aria-label="Refresh properties">Refresh</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Property</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col">
                <label htmlFor="prop-name" className="text-sm font-medium">Name</label>
                <input id="prop-name" className="rounded-md border p-2" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="prop-addr1" className="text-sm font-medium">Address Line 1</label>
                <input id="prop-addr1" className="rounded-md border p-2" value={form.addressLine1} onChange={(e)=>setForm({...form, addressLine1:e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <label htmlFor="prop-city" className="text-sm font-medium">City</label>
                <input id="prop-city" className="rounded-md border p-2" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <label htmlFor="prop-state" className="text-sm font-medium">State</label>
                <input id="prop-state" className="rounded-md border p-2" value={form.state} onChange={(e)=>setForm({...form, state:e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <label htmlFor="prop-zip" className="text-sm font-medium">ZIP / Postal</label>
                <input id="prop-zip" className="rounded-md border p-2" value={form.zip} onChange={(e)=>setForm({...form, zip:e.target.value})} required />
              </div>
              <div className="flex flex-col">
                <label htmlFor="prop-country" className="text-sm font-medium">Country</label>
                <input id="prop-country" className="rounded-md border p-2" value={form.country} onChange={(e)=>setForm({...form, country:e.target.value})} required />
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="prop-desc" className="text-sm font-medium">Description (optional)</label>
                <textarea id="prop-desc" className="rounded-md border p-2" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create property">{creating ? "Creating..." : "Create Property"}</Button>
            </div>
          </form>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Properties List (IDs shown)</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : isError ? (
              <p className="text-red-600">Failed to load properties.</p>
            ) : (
              <ul className="divide-y">
                {data?.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <div className="font-medium">Property #{p.id} — {p.name}</div>
                      <div className="text-sm text-gray-600">
                        {p.addressLine1}, {p.city}, {p.state} {p.zip}, {p.country}
                      </div>
                    </div>
                    <button
                      aria-label={`Delete property ${p.name}`}
                      onClick={() => deleteProperty(p.id).unwrap().then(()=>refetch())}
                      className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
