import type { PropsWithChildren } from "react";
import { useAppSelector } from "../../app/hooks";

type Props = PropsWithChildren<{
  allow: Array<"Admin" | "Manager" | "Staff" | "Tenant">;
}>;

export default function RoleGate({ allow, children }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;
  if (!allow.includes(user.role)) return null;
  return <>{children}</>;
}
