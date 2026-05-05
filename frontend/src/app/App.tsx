import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { useAnalyticsOverview } from "../features/analytics/useAnalyticsOverview";
import { AlertsPage } from "../pages/AlertsPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DatasetDetailsPage } from "../pages/DatasetDetailsPage";
import { DatasetsPage } from "../pages/DatasetsPage";
import { ImportsPage } from "../pages/ImportsPage";
import { LoginPage } from "../pages/LoginPage";
import { ReportsPage } from "../pages/ReportsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { fetchHealth } from "../services/api";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<DashboardShell />}>
              <Route index element={<DashboardRoute />} />
              <Route path="datasets" element={<DatasetsPage />} />
              <Route path="datasets/:datasetId" element={<DatasetDetailsPage />} />
              <Route path="imports" element={<ImportsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<PlaceholderRoute />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bridge-bg text-sm text-slate-400">
        Loading workspace...
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: "/app" }} />;
  }

  return <Outlet />;
}

function DashboardShell() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void fetchHealth().then(setApiStatus);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <AppShell
      apiStatus={apiStatus}
      userName={user?.full_name}
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  );
}

function DashboardRoute() {
  const { isAuthenticated } = useAuth();
  const overview = useAnalyticsOverview(isAuthenticated);

  return (
    <DashboardPage
      overview={overview.data}
      isLoading={overview.isLoading}
      error={overview.error}
    />
  );
}

function PlaceholderRoute() {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
        Next workspace module
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        This page is queued in the Release 1.0 checklist.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        The authenticated routing foundation is ready. The next implementation
        blocks will replace these placeholders with imports, analytics, alerts,
        reports and audit log screens backed by the API.
      </p>
    </section>
  );
}
