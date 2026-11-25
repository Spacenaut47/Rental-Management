import { useMemo, useState } from "react";
import {
  useListPaymentsForLeaseQuery,
  useTotalPaidForLeaseQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from "../services/endpoints/paymentsApi";
import type { Payment, PaymentUpdate } from "../services/endpoints/paymentsApi";
import { useListLeasesQuery } from "../services/endpoints/leasesApi";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";
import RoleGate from "../features/auth/RoleGate";
import { getErrorMessage } from "../lib/errors";
import { newestFirst } from "../lib/sort";

const methods = ["Cash", "Card", "Bank Transfer", "Cheque", "Online Gateway"];

function methodName(method: number) {
  return methods[method - 1] ?? "Unknown";
}

const emptyForm: PaymentUpdate = { amount: 1200, method: 3, reference: "", notes: "" };

function PaymentFields({
  form,
  setForm,
}: {
  form: PaymentUpdate;
  setForm: (next: PaymentUpdate) => void;
}) {
  const update = <K extends keyof PaymentUpdate>(key: K, value: PaymentUpdate[K]) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col">
        <label htmlFor="payment-amount" className="text-sm font-medium">Amount (₹)</label>
        <input
          id="payment-amount"
          className="rounded-md border p-2"
          type="number"
          min={0.01}
          step="0.01"
          value={form.amount}
          onChange={(e) => update("amount", Number(e.target.value))}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="payment-method" className="text-sm font-medium">Method</label>
        <select
          id="payment-method"
          className="rounded-md border p-2"
          value={form.method}
          onChange={(e) => update("method", Number(e.target.value))}
        >
          {methods.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="payment-ref" className="text-sm font-medium">Reference (optional)</label>
        <input
          id="payment-ref"
          className="rounded-md border p-2"
          placeholder="e.g., NEFT-9485"
          value={form.reference ?? ""}
          onChange={(e) => update("reference", e.target.value)}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="payment-notes" className="text-sm font-medium">Notes (optional)</label>
        <input
          id="payment-notes"
          className="rounded-md border p-2"
          placeholder="Add a note"
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [leaseId, setLeaseId] = useState(0);
  const [search, setSearch] = useState("");
  const [filterDraft, setFilterDraft] = useState({ leaseId: 0, search: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | "new" | null>(null);
  const [form, setForm] = useState<PaymentUpdate>(emptyForm);
  const [error, setError] = useState("");

  const { data: leasesData } = useListLeasesQuery(undefined);
  const leases = leasesData ?? [];
  const selectedLeaseId = leaseId || leases[0]?.id || 0;
  const { data, isLoading, isError, refetch } = useListPaymentsForLeaseQuery(selectedLeaseId, {
    skip: !selectedLeaseId,
  });
  const { data: total } = useTotalPaidForLeaseQuery(selectedLeaseId, {
    skip: !selectedLeaseId,
  });
  const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
  const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  const payments = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = !term
      ? data ?? []
      : (data ?? []).filter((p) =>
          [p.reference, p.notes, methodName(p.method)]
            .some((value) => value?.toLowerCase().includes(term))
        );
    return newestFirst(matches, (payment) => payment.paidOnUtc);
  }, [data, search]);

  const openFilter = () => {
    setFilterDraft({ leaseId: selectedLeaseId, search });
    setFilterOpen(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setEditing("new");
  };

  const openEdit = (payment: Payment) => {
    setForm({
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference ?? "",
      notes: payment.notes ?? "",
    });
    setError("");
    setEditing(payment);
  };

  const closeEditor = () => {
    setEditing(null);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLeaseId) return;
    setError("");
    try {
      if (editing === "new") {
        await createPayment({ leaseId: selectedLeaseId, ...form }).unwrap();
      } else if (editing) {
        await updatePayment({
          id: editing.id,
          leaseId: selectedLeaseId,
          body: form,
        }).unwrap();
      }
      closeEditor();
      await refetch();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save payment."));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete payment?")) return;
    try {
      await deletePayment({ id, leaseId: selectedLeaseId }).unwrap();
      await refetch();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete payment."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <PageToolbar
        title="Payments"
        filterLabel="Filter payments"
        onFilter={openFilter}
        addLabel="Payment"
        onAdd={openCreate}
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Payments for Lease #{selectedLeaseId}</h2>
        <div className="mb-3 text-sm text-gray-600">Total paid: ₹{total ?? 0}</div>
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p className="text-red-600">Failed to load payments.</p>
        ) : (
          <ul className="divide-y">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-4 py-2">
                <button
                  type="button"
                  aria-label={`Edit payment ${payment.id}`}
                  onClick={() => openEdit(payment)}
                  className="min-w-0 flex-1 rounded-md text-left hover:opacity-80"
                >
                  <div className="font-medium">
                    Payment #{payment.id} — ₹{payment.amount} • {methodName(payment.method)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(payment.paidOnUtc).toLocaleString()} {payment.reference ? `• ${payment.reference}` : ""} {payment.notes ? `• ${payment.notes}` : ""}
                  </div>
                </button>
                <RoleGate allow={["Admin"]}>
                  <button
                    aria-label={`Delete payment ${payment.id}`}
                    onClick={() => handleDelete(payment.id)}
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

      <Modal open={filterOpen} title="Filter payments" onClose={() => setFilterOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLeaseId(filterDraft.leaseId);
            setSearch(filterDraft.search);
            setFilterOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col">
              <label htmlFor="payments-leaseId" className="text-sm font-medium">Lease</label>
              <select
                id="payments-leaseId"
                className="rounded-md border p-2"
                value={filterDraft.leaseId || leases[0]?.id || 0}
                onChange={(e) => setFilterDraft({ ...filterDraft, leaseId: Number(e.target.value) })}
              >
                {leases.map((lease) => (
                  <option key={lease.id} value={lease.id}>
                    Lease #{lease.id} — Unit #{lease.unitId} • Tenant #{lease.tenantId}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex flex-col">
              <label htmlFor="payment-filter-search" className="text-sm font-medium">Reference or notes</label>
              <input
                id="payment-filter-search"
                className="rounded-md border p-2"
                placeholder="e.g., CARD-TEST"
                value={filterDraft.search}
                onChange={(e) => setFilterDraft({ ...filterDraft, search: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setFilterDraft({ leaseId, search: "" }); setSearch(""); setFilterOpen(false); }}>Clear</Button>
            <Button type="submit" aria-label="Load payments">Apply</Button>
          </div>
        </form>
      </Modal>

      <RoleGate allow={["Admin", "Manager"]}>
        <Modal
          open={editing !== null}
          title={editing === "new" ? "Record payment" : "Edit payment"}
          onClose={closeEditor}
        >
          <form onSubmit={submit}>
            <div className="mb-3 text-sm text-gray-600">Lease #{selectedLeaseId}</div>
            <PaymentFields form={form} setForm={setForm} />
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={closeEditor}>Cancel</Button>
              <Button
                type="submit"
                disabled={creating || updating || !selectedLeaseId}
                aria-label={editing === "new" ? "Record Payment" : "Save Payment"}
              >
                {creating || updating ? "Saving..." : editing === "new" ? "Record Payment" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGate>
    </div>
  );
}
