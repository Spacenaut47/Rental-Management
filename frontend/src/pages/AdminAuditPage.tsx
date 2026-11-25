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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageToolbar title="Admin • Audit" filterLabel="Filter audit entries" onFilter={openFilter} />

        {!data ? (
          <p className={isError ? "state-error" : "state-loading"}>
            {isLoading ? "Loading…" : isError ? "Failed to load audit." : "No audit entries."}
          </p>
        ) : (
          <>
            <div className="panel">
              <div className="panel-title">
                <span>Audit entries</span>
                <span aria-hidden="true" className="sort-hint">Newest first</span>
              </div>
              <div className="border-b border-line px-5 py-3 text-sm text-slate-500">Total: {data.total}</div>
              <ul className="list">
                {data.items.map((entry) => (
                  <li key={entry.id} className="list-row">
                    <div>
                      <div className="row-title">{entry.action} • {entry.entityName}{entry.entityId ? ` #${entry.entityId}` : ""}</div>
                      <div className="row-meta">
                        {new Date(entry.atUtc).toLocaleString()} • by {entry.actor}{entry.details ? ` • ${entry.details}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <div className="row-meta">Page {data.page}</div>
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
            <div className="field">
              <label htmlFor="audit-entity" className="field-label">Entity</label>
              <input
                id="audit-entity"
                className="field-input"
                placeholder="e.g., Lease"
                value={draftEntity}
                onChange={(e) => setDraftEntity(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => { setDraftEntity(""); setEntity(""); setPage(1); setFilterOpen(false); }}>Clear</Button>
              <Button type="submit" aria-label="Apply audit filter">Apply</Button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
}
