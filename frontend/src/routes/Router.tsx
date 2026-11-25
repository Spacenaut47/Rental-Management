import { Route, Routes } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Dashboard from "../pages/Dashboard";
import PropertiesPage from "../pages/PropertiesPage";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";

import TenantsPage from "../pages/TenantsPage";
import UnitsPage from "../pages/UnitsPage";
import LeasesPage from "../pages/LeasesPage";
import PaymentsPage from "../pages/PaymentsPage";
import MaintenancePage from "../pages/MaintenancePage";
import AdminAuditPage from "../pages/AdminAuditPage";
import { useAppSelector } from "../app/hooks";

export default function Router() {
  const authenticated = Boolean(useAppSelector((s) => s.auth.token));

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <div className={`mx-auto grid max-w-6xl grid-cols-1 ${authenticated ? "md:grid-cols-[16rem_1fr]" : ""}`}>
        {authenticated ? <Sidebar /> : null}
        <main>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
            <Route path="/units" element={<ProtectedRoute><UnitsPage /></ProtectedRoute>} />
            <Route path="/leases" element={<ProtectedRoute><LeasesPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute><AdminAuditPage /></ProtectedRoute>} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
