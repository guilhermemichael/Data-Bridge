import { useEffect, useState } from "react";

import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { fetchHealth } from "../services/api";

export function App() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");

  useEffect(() => {
    void fetchHealth().then(setApiStatus);
  }, []);

  return (
    <AppShell apiStatus={apiStatus}>
      <DashboardPage />
    </AppShell>
  );
}
