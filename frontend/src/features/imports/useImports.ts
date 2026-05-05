import { useCallback, useEffect, useState } from "react";

import {
  getImportJob,
  listImports,
  uploadDatasetFile,
  type ImportJob,
} from "./api";

type ImportsState = {
  imports: ImportJob[];
  activeImport: ImportJob | null;
  isLoading: boolean;
  error: string | null;
};

const terminalStatuses = new Set(["COMPLETED", "FAILED"]);

export function useImports(enabled: boolean) {
  const [state, setState] = useState<ImportsState>({
    imports: [],
    activeImport: null,
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const imports = await listImports();
      setState((current) => ({ ...current, imports, isLoading: false }));
    } catch {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: "We could not load import jobs.",
      }));
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const activeImport = state.activeImport;
    if (!activeImport || terminalStatuses.has(activeImport.status)) {
      return;
    }

    const interval = window.setInterval(() => {
      void getImportJob(activeImport.id).then((updated) => {
        setState((current) => ({ ...current, activeImport: updated }));
        if (terminalStatuses.has(updated.status)) {
          void refresh();
        }
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [refresh, state.activeImport]);

  const upload = useCallback(
    async (datasetId: string, file: File) => {
      const importJob = await uploadDatasetFile(datasetId, file);
      setState((current) => ({ ...current, activeImport: importJob }));
      await refresh();
      return importJob;
    },
    [refresh],
  );

  return { ...state, refresh, upload };
}
