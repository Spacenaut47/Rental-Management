import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-linear-to-br from-brand-soft via-canvas to-surface px-4 py-10">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-5">
          <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-5 border-t border-line pt-4 text-sm text-slate-500">{footer}</div> : null}
      </div>
    </main>
  );
}
