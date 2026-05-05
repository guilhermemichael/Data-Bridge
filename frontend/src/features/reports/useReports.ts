import { useCallback, useEffect, useState } from "react";

import { createReport, listReports, type Report } from "./api";

type ReportsState = {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
};

export function useReports(enabled: boolean) {
  const [state, setState] = useState<ReportsState>({
    reports: [],
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const reports = await listReports();
      setState({ reports, isLoading: false, error: null });
    } catch {
      setState({
        reports: [],
        isLoading: false,
        error: "We could not load reports.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generate = useCallback(
    async (datasetId: string, title?: string) => {
      const report = await createReport(datasetId, title);
      await refresh();
      return report;
    },
    [refresh],
  );

  return { ...state, refresh, generate };
}
