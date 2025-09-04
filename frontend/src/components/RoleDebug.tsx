import { useAppSelector } from "../app/hooks";

export default function RoleDebug() {
  const auth = useAppSelector(s => s.auth);
  return (
    <div className="fixed bottom-2 right-2 rounded-md border bg-white/90 p-2 text-xs shadow">
      <div><b>Token:</b> {auth.token ? "yes" : "no"}</div>
      <div><b>User:</b> {auth.user?.username ?? "-"}</div>
      <div><b>Role:</b> {auth.user?.role ?? "-"}</div>
    </div>
  );
}
