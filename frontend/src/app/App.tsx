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
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
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
            <Route path="/app" element={<DashboardShell />} />
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
  const overview = useAnalyticsOverview(isAuthenticated);

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
      <DashboardPage
        overview={overview.data}
        isLoading={overview.isLoading}
        error={overview.error}
      />
    </AppShell>
  );
}
