import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import RoleGate from "../features/auth/RoleGate";
import { API_BASE } from "../lib/constants";
import { useAppSelector } from "../app/hooks";

type AuditItem = {
  id: number;
  actor: string;
  action: string;
  entityName: string;
  entityId?: number | null;
  details?: string | null;
  atUtc: string;
};
type AuditResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AuditItem[];
};

export default function AdminAuditPage() {
  const token = useAppSelector((s) => s.auth.token);
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const pageSize = 20;

  const load = async () => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (entity) q.set("entity", entity);
    const res = await fetch(`${API_BASE}/admin/audit?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setData(await res.json());
    else setData(null);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  return (
    <RoleGate allow={["Admin"]}>
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="text-2xl font-bold">Admin • Audit</h1>
          <div className="flex items-end gap-2">
            <div className="flex flex-col">
              <label htmlFor="audit-entity" className="text-xs font-medium text-gray-600">Filter by Entity</label>
              <input id="audit-entity" className="w-40 rounded-md border p-2" placeholder="e.g., Lease" value={entity} onChange={(e)=>setEntity(e.target.value)} />
            </div>
            <Button onClick={()=>{ setPage(1); load(); }} aria-label="Apply audit filter">Filter</Button>
          </div>
        </div>

        {!data ? <p className="text-red-600">Failed to load audit.</p> : (
          <>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 text-sm text-gray-600">Total: {data.total}</div>
              <ul className="divide-y">
                {data.items.map((a)=>(
                  <li key={a.id} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <div className="font-medium">{a.action} • {a.entityName}{a.entityId ? ` #${a.entityId}` : ""}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(a.atUtc).toLocaleString()} • by {a.actor}{a.details ? ` • ${a.details}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
              <div className="text-sm text-gray-600">Page {data.page}</div>
              <Button aria-label="Next page" disabled={(data.page * data.pageSize) >= data.total} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </>
        )}
      </div>
    </RoleGate>
  );
}
