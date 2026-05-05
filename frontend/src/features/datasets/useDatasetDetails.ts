import { useCallback, useEffect, useState } from "react";

import {
  archiveDataset,
  getDataset,
  getDatasetLineage,
  listDatasetColumns,
  previewDataset,
  updateDataset,
  type Dataset,
  type DatasetColumn,
  type DatasetLineage,
  type DatasetPreviewRecord,
  type UpdateDatasetPayload,
} from "./api";

type DatasetDetailsState = {
  dataset: Dataset | null;
  columns: DatasetColumn[];
  preview: DatasetPreviewRecord[];
  lineage: DatasetLineage | null;
  isLoading: boolean;
  error: string | null;
};

export function useDatasetDetails(datasetId: string | undefined, enabled: boolean) {
  const [state, setState] = useState<DatasetDetailsState>({
    dataset: null,
    columns: [],
    preview: [],
    lineage: null,
    isLoading: Boolean(enabled && datasetId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled || !datasetId) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const [dataset, columns, preview, lineage] = await Promise.all([
        getDataset(datasetId),
        listDatasetColumns(datasetId),
        previewDataset(datasetId),
        getDatasetLineage(datasetId),
      ]);
      setState({
        dataset,
        columns,
        preview,
        lineage,
        isLoading: false,
        error: null,
      });
    } catch {
      setState({
        dataset: null,
        columns: [],
        preview: [],
        lineage: null,
        isLoading: false,
        error: "We could not load this dataset.",
      });
    }
  }, [enabled, datasetId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = useCallback(
    async (payload: UpdateDatasetPayload) => {
      if (!datasetId) {
        return null;
      }
      const dataset = await updateDataset(datasetId, payload);
      await refresh();
      return dataset;
    },
    [datasetId, refresh],
  );

  const archive = useCallback(async () => {
    if (!datasetId) {
      return;
    }
    await archiveDataset(datasetId);
    await refresh();
  }, [datasetId, refresh]);

  return { ...state, refresh, update, archive };
}
