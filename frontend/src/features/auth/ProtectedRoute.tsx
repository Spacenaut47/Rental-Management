import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const token = useAppSelector((s) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
