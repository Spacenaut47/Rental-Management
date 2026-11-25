import { useState } from "react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageToolbar from "../components/ui/PageToolbar";
import RoleGate from "../features/auth/RoleGate";
import { useListAuditQuery } from "../services/endpoints/adminApi";

export default function AdminAuditPage() {
  const [entity, setEntity] = useState("");
  const [draftEntity, setDraftEntity] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useListAuditQuery({
    page,
    pageSize,
    entity: entity || undefined,
  });

  const openFilter = () => {
    setDraftEntity(entity);
    setFilterOpen(true);
  };

  return (
    <RoleGate allow={["Admin"]}>
      <div className="mx-auto w-full max-w-6xl p-6">
        <PageToolbar title="Admin • Audit" filterLabel="Filter audit entries" onFilter={openFilter} />

        {!data ? (
          <p className="text-red-600">
            {isLoading ? "Loading…" : isError ? "Failed to load audit." : "No audit entries."}
          </p>
        ) : (
          <>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm text-gray-600">Total: {data.total}</div>
              <ul className="divide-y">
                {data.items.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <div className="font-medium">{entry.action} • {entry.entityName}{entry.entityId ? ` #${entry.entityId}` : ""}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(entry.atUtc).toLocaleString()} • by {entry.actor}{entry.details ? ` • ${entry.details}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <div className="text-sm text-gray-600">Page {data.page}</div>
              <Button aria-label="Next page" disabled={data.page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </>
        )}

        <Modal open={filterOpen} title="Filter audit entries" onClose={() => setFilterOpen(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setEntity(draftEntity);
              setPage(1);
              setFilterOpen(false);
            }}
          >
            <div className="flex flex-col">
              <label htmlFor="audit-entity" className="text-sm font-medium">Entity</label>
              <input
                id="audit-entity"
                className="rounded-md border p-2"
                placeholder="e.g., Lease"
                value={draftEntity}
                onChange={(e) => setDraftEntity(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => { setDraftEntity(""); setEntity(""); setPage(1); setFilterOpen(false); }}>Clear</Button>
              <Button type="submit" aria-label="Apply audit filter">Apply</Button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
}
