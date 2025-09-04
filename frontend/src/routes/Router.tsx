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

export default function Router() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar />
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
