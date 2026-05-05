import { FormEvent, useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";

import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../features/auth/AuthContext";
import { useWorkspaceRole } from "../features/auth/useWorkspaceRole";
import { useDatasets } from "../features/datasets/useDatasets";
import { downloadReportBlob } from "../features/reports/api";
import type { Report } from "../features/reports/api";
import { useReports } from "../features/reports/useReports";
import type { StatusTone } from "../types";

const reportStatusTone: Record<Report["status"], StatusTone> = {
  GENERATED: "success",
  PENDING: "neutral",
  GENERATING: "info",
  FAILED: "danger",
};

export function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const { datasets } = useDatasets(isAuthenticated);
  const { reports, isLoading, error, refresh, generate } =
    useReports(isAuthenticated);
  const permissions = useWorkspaceRole();
  const [datasetId, setDatasetId] = useState("");
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const selectedDatasetId = useMemo(
    () => datasetId || datasets[0]?.id || "",
    [datasetId, datasets],
  );
  const canGenerateReport = permissions.can("reports:create");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!selectedDatasetId) {
      setFormError("Select a dataset before generating a report.");
      return;
    }

    try {
      setIsSubmitting(true);
      await generate(selectedDatasetId, title.trim() || undefined);
      setTitle("");
    } catch {
      setFormError("Could not generate this report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDownload(report: Report) {
    try {
      setDownloadingId(report.id);
      const blob = await downloadReportBlob(report.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${report.title.replaceAll(" ", "_").toLowerCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Executive outputs
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            PDF reports
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Generate and download authenticated reports from processed datasets.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:text-white"
          type="button"
          onClick={() => void refresh()}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-slate-800 bg-slate-950/70 p-5"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md border border-violet-400/30 bg-violet-400/10 p-2 text-violet-100">
              <FileText size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Generate report
              </h3>
              <p className="text-sm text-slate-500">
                Create a PDF summary for a dataset.
              </p>
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

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Title
              </span>
              <input
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                placeholder="Executive Data Health Report"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            {formError ? <p className="text-sm text-red-200">{formError}</p> : null}
            {!canGenerateReport ? (
              <p className="text-sm text-yellow-100">
                Your current role can view reports but cannot generate new ones.
              </p>
            ) : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !datasets.length || !canGenerateReport}
              type="submit"
            >
              <FileText size={16} />
              {isSubmitting ? "Generating..." : "Generate report"}
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-5">
            <h3 className="text-base font-semibold text-white">Reports</h3>
            <p className="mt-1 text-sm text-slate-500">
              PDF outputs generated by the backend report engine.
            </p>
          </div>

          {error ? <div className="p-5 text-sm text-red-200">{error}</div> : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Finished</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {report.title}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={report.status}
                        tone={reportStatusTone[report.status]}
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(report.created_at).toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {report.finished_at
                        ? new Date(report.finished_at).toLocaleString("en-US")
                        : "Pending"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={report.status !== "GENERATED" || !report.file_path}
                        type="button"
                        onClick={() => void handleDownload(report)}
                      >
                        <Download size={15} />
                        {downloadingId === report.id ? "Downloading..." : "Download"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && !reports.length ? (
            <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
              No reports generated yet. Generate a PDF report from a processed dataset.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
