import { useState } from "react";
import { useListPaymentsForLeaseQuery, useTotalPaidForLeaseQuery, useCreatePaymentMutation } from "../services/endpoints/paymentsApi";
import { useListLeasesQuery } from "../services/endpoints/leasesApi";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";

export default function PaymentsPage() {
  const [leaseId, setLeaseId] = useState(1);
  const { data, isLoading, isError, refetch } = useListPaymentsForLeaseQuery(leaseId);
  const { data: total } = useTotalPaidForLeaseQuery(leaseId);

  // Helper: list leases (IDs visible)
  const { data: leasesData } = useListLeasesQuery(undefined);

  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
  const [form, setForm] = useState({
    amount: 1200,
    method: 3, // BankTransfer
    reference: "",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayment({ leaseId, ...form }).unwrap();
    setForm({ ...form, reference: "", notes: "" });
    refetch();
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="payments-leaseId" className="text-xs font-medium text-gray-600">Lease ID</label>
            <div className="flex gap-2">
              <select
                id="payments-leaseId"
                className="w-56 rounded-md border p-2"
                value={leaseId}
                onChange={(e)=>setLeaseId(Number(e.target.value))}
              >
                {leasesData?.map(l => (
                  <option key={l.id} value={l.id}>
                    Lease #{l.id} — Unit #{l.unitId} • Tenant #{l.tenantId}
                  </option>
                ))}
              </select>
              <Button onClick={()=>refetch()} aria-label="Load payments">Load</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleGate allow={["Admin","Manager"]}>
          <form onSubmit={submit} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Add Payment</h2>
            <div className="mb-2 text-sm text-gray-600">Selected Lease: #{leaseId}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label htmlFor="payment-amount" className="text-sm font-medium">Amount (₹)</label>
                <input id="payment-amount" className="rounded-md border p-2" placeholder="Amount" type="number" min={1} value={form.amount} onChange={(e)=>setForm({...form, amount:Number(e.target.value)})}/>
              </div>
              <div className="flex flex-col">
                <label htmlFor="payment-method" className="text-sm font-medium">Method</label>
                <select id="payment-method" className="rounded-md border p-2" value={form.method} onChange={(e)=>setForm({...form, method:Number(e.target.value)})}>
                  <option value={1}>Cash</option>
                  <option value={2}>Card</option>
                  <option value={3}>Bank Transfer</option>
                  <option value={4}>Cheque</option>
                  <option value={5}>Online Gateway</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="payment-ref" className="text-sm font-medium">Reference (optional)</label>
                <input id="payment-ref" className="rounded-md border p-2" placeholder="e.g., NEFT-9485" value={form.reference} onChange={(e)=>setForm({...form, reference:e.target.value})}/>
              </div>
              <div className="col-span-2 flex flex-col">
                <label htmlFor="payment-notes" className="text-sm font-medium">Notes (optional)</label>
                <input id="payment-notes" className="rounded-md border p-2" placeholder="Add a note" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})}/>
              </div>
            </div>
            <div className="mt-3">
              <Button disabled={creating} aria-label="Record payment">{creating ? "Recording..." : "Record Payment"}</Button>
            </div>
          </form>
        </RoleGate>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Payments for Lease #{leaseId}</h2>
          <div className="mb-3 text-sm text-gray-600">Total paid: ₹{total ?? 0}</div>
          {isLoading ? <p>Loading...</p> : isError ? <p className="text-red-600">Failed to load payments.</p> : (
            <ul className="divide-y">
              {data?.map((p)=>(
                <li key={p.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="font-medium">Payment #{p.id} — ₹{p.amount} • Method {p.method}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(p.paidOnUtc).toLocaleString()} {p.reference ? `• ${p.reference}` : ""} {p.notes ? `• ${p.notes}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
