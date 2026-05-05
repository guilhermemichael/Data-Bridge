import { useCallback, useEffect, useState } from "react";

import {
  createDataset,
  listDatasets,
  type CreateDatasetPayload,
  type Dataset,
} from "./api";

type DatasetState = {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
};

export function useDatasets(enabled: boolean) {
  const [state, setState] = useState<DatasetState>({
    datasets: [],
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const datasets = await listDatasets();
      setState({ datasets, isLoading: false, error: null });
    } catch {
      setState({
        datasets: [],
        isLoading: false,
        error: "We could not load datasets.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: CreateDatasetPayload) => {
      const dataset = await createDataset(payload);
      await refresh();
      return dataset;
    },
    [refresh],
  );

  return { ...state, refresh, create };
}
