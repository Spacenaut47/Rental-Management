import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | undefined;
  hint: string;
  icon: LucideIcon;
};

export default function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <div className="panel flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  );
}
