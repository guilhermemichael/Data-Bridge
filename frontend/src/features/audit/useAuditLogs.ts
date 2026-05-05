import { useCallback, useEffect, useState } from "react";

import { listAuditLogs, type AuditLog } from "./api";

type AuditState = {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
};

export function useAuditLogs(enabled: boolean) {
  const [state, setState] = useState<AuditState>({
    logs: [],
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const logs = await listAuditLogs();
      setState({ logs, isLoading: false, error: null });
    } catch {
      setState({
        logs: [],
        isLoading: false,
        error: "We could not load audit logs.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
