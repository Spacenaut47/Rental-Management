// src/pages/TenantsPage.tsx
import { useState } from "react";
import { useListTenantsQuery, useCreateTenantMutation, useDeleteTenantMutation } from "../services/endpoints/tenantsApi";
import RoleGate from "../features/auth/RoleGate";
import Button from "../components/ui/Button";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useListTenantsQuery({ search: search || undefined });
  const [createTenant, { isLoading: creating }] = useCreateTenantMutation();
  const [deleteTenant] = useDeleteTenantMutation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTenant(form).unwrap();
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
      await refetch();
    } catch (err) {
      console.error("Create tenant failed", err);
      alert("Failed to create tenant.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete tenant?")) return;
    try {
      await deleteTenant(id).unwrap();
      await refetch();
    } catch (err) {
      console.error("Delete tenant failed", err);
      alert("Failed to delete tenant.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="tenant-search" className="text-xs font-medium text-gray-600">Search (name or email)</label>
            <input id="tenant-search" className="rounded-md border p-2" placeholder="e.g., John or john@demo.com" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <Button onClick={()=>refetch()} aria-label="Search tenants">Search</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Create Tenant</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label htmlFor="tenant-firstname" className="text-sm font-medium">First Name</label>
                <input id="tenant-firstname" className="rounded-md border p-2" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="tenant-lastname" className="text-sm font-medium">Last Name</label>
                <input id="tenant-lastname" className="rounded-md border p-2" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required/>
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="tenant-email" className="text-sm font-medium">Email</label>
                <input id="tenant-email" className="rounded-md border p-2" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required/>
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="tenant-phone" className="text-sm font-medium">Phone (optional)</label>
                <input id="tenant-phone" className="rounded-md border p-2" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})}/>
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Create tenant">{creating ? "Creating..." : "Create Tenant"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Tenants List (IDs shown)</h2>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load tenants.</p> : (
            <ul className="divide-y">
              {data?.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">Tenant #{t.id} — {t.firstName} {t.lastName}</div>
                    <div className="text-sm text-gray-600">{t.email} {t.phone ? `• ${t.phone}` : ""}</div>
                  </div>
                  <RoleGate allow={["Admin"]}>
                    <button aria-label={`Delete tenant ${t.firstName} ${t.lastName}`} onClick={() => handleDelete(t.id)} className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
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
