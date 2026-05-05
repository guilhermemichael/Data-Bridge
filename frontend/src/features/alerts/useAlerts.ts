import { useCallback, useEffect, useState } from "react";

import { listAlerts, resolveAlert, type Alert } from "./api";

type AlertsState = {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
};

export function useAlerts(enabled: boolean) {
  const [state, setState] = useState<AlertsState>({
    alerts: [],
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const alerts = await listAlerts();
      setState({ alerts, isLoading: false, error: null });
    } catch {
      setState({
        alerts: [],
        isLoading: false,
        error: "We could not load alerts.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const resolve = useCallback(
    async (alertId: string) => {
      await resolveAlert(alertId);
      await refresh();
    },
    [refresh],
  );

  return { ...state, refresh, resolve };
}
