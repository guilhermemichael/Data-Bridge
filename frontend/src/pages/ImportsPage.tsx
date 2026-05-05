import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";

import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../features/auth/AuthContext";
import { useWorkspaceRole } from "../features/auth/useWorkspaceRole";
import { useDatasets } from "../features/datasets/useDatasets";
import { useImports } from "../features/imports/useImports";
import type { ImportJob } from "../features/imports/api";

const allowedExtensions = [".csv", ".xlsx", ".json"];

const statusTone = {
  PENDING: "neutral",
  VALIDATING: "info",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
} as const;

export function ImportsPage() {
  const { isAuthenticated } = useAuth();
  const { datasets } = useDatasets(isAuthenticated);
  const { imports, activeImport, isLoading, error, upload } =
    useImports(isAuthenticated);
  const permissions = useWorkspaceRole();
  const [datasetId, setDatasetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDatasetId = useMemo(
    () => datasetId || datasets[0]?.id || "",
    [datasetId, datasets],
  );
  const canUpload = permissions.can("imports:create");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFormError(null);
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = `.${nextFile.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!allowedExtensions.includes(extension)) {
      setFormError("Unsupported file type. Use CSV, XLSX or JSON.");
      setFile(null);
      return;
    }

    if (nextFile.size > 25 * 1024 * 1024) {
      setFormError("File exceeds the 25 MB upload limit.");
      setFile(null);
      return;
    }

    setFile(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!selectedDatasetId || !file) {
      setFormError("Select a dataset and a supported file.");
      return;
    }

    try {
      setIsSubmitting(true);
      await upload(selectedDatasetId, file);
      setFile(null);
    } catch {
      setFormError("Could not upload this file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
          Import pipeline
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Upload operational files
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Send CSV, XLSX or JSON files to a dataset and monitor processing status.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-slate-800 bg-slate-950/70 p-5"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200">
              <UploadCloud size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                New import
              </h3>
              <p className="text-sm text-slate-500">Attach a file to a dataset.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Dataset
              </span>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                value={selectedDatasetId}
                onChange={(event) => setDatasetId(event.target.value)}
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-6 text-center transition hover:border-cyan-400/60">
              <UploadCloud className="mb-3 text-cyan-200" size={24} />
              <span className="text-sm font-medium text-slate-200">
                {file ? file.name : "Choose CSV, XLSX or JSON"}
              </span>
              <span className="mt-1 text-xs text-slate-500">Max 25 MB</span>
              <input
                className="hidden"
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileChange}
              />
            </label>

            {formError ? <p className="text-sm text-red-200">{formError}</p> : null}
            {!canUpload ? (
              <p className="text-sm text-yellow-100">
                Your current role can monitor imports but cannot upload files.
              </p>
            ) : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !datasets.length || !canUpload}
              type="submit"
            >
              <UploadCloud size={16} />
              {isSubmitting ? "Uploading..." : "Upload file"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {activeImport ? <ImportResultCard importJob={activeImport} /> : null}
          <ImportsTable imports={imports} isLoading={isLoading} error={error} />
        </div>
      </section>
    </div>
  );
}

function ImportResultCard({ importJob }: { importJob: ImportJob }) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            {importJob.original_filename}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Import job {importJob.id}
          </p>
        </div>
        <StatusBadge label={importJob.status} tone={statusTone[importJob.status]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Rows" value={String(importJob.total_rows)} />
        <Stat label="Valid" value={String(importJob.valid_rows)} />
        <Stat label="Invalid" value={String(importJob.invalid_rows)} />
        <Stat label="Health" value={`${importJob.health_score.toFixed(1)}/100`} />
      </div>
      {importJob.error_message ? (
        <p className="mt-4 text-sm text-red-200">{importJob.error_message}</p>
      ) : null}
    </article>
  );
}

function ImportsTable({
  imports,
  isLoading,
  error,
}: {
  imports: ImportJob[];
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 p-5">
        <h3 className="text-base font-semibold text-white">Import jobs</h3>
        <p className="mt-1 text-sm text-slate-500">
          Live processing history from the backend.
        </p>
      </div>
      {error ? <div className="p-5 text-sm text-red-200">{error}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Rows</th>
              <th className="px-5 py-3 font-medium">Valid</th>
              <th className="px-5 py-3 font-medium">Invalid</th>
              <th className="px-5 py-3 font-medium">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {imports.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/50">
                <td className="px-5 py-4 font-medium text-slate-100">
                  {item.original_filename}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge label={item.status} tone={statusTone[item.status]} />
                </td>
                <td className="px-5 py-4 text-slate-300">{item.total_rows}</td>
                <td className="px-5 py-4 text-slate-300">{item.valid_rows}</td>
                <td className="px-5 py-4 text-slate-300">{item.invalid_rows}</td>
                <td className="px-5 py-4 text-slate-300">
                  {item.health_score.toFixed(1)}/100
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && !imports.length ? (
        <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
          No imports yet. Upload a file to start the processing pipeline.
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="mt-1 block text-lg text-slate-100">{value}</strong>
    </div>
  );
}
