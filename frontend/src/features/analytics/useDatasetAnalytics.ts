import { useCallback, useEffect, useState } from "react";

import {
  getDatasetAnalyticsSummary,
  getDatasetHealthBreakdown,
  type AnalyticsSummary,
  type HealthBreakdown,
} from "./api";

type DatasetAnalyticsState = {
  summary: AnalyticsSummary | null;
  health: HealthBreakdown | null;
  isLoading: boolean;
  error: string | null;
};

export function useDatasetAnalytics(
  datasetId: string | undefined,
  enabled: boolean,
) {
  const [state, setState] = useState<DatasetAnalyticsState>({
    summary: null,
    health: null,
    isLoading: Boolean(enabled && datasetId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled || !datasetId) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const [summary, health] = await Promise.all([
        getDatasetAnalyticsSummary(datasetId),
        getDatasetHealthBreakdown(datasetId),
      ]);
      setState({ summary, health, isLoading: false, error: null });
    } catch {
      setState({
        summary: null,
        health: null,
        isLoading: false,
        error: "We could not load dataset analytics.",
      });
    }
  }, [datasetId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
