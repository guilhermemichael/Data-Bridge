import { FormEvent, useMemo, useState } from "react";
import {
  Archive,
  Database,
  Download,
  FileText,
  GitBranch,
  RefreshCw,
  Save,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { StatusBadge } from "../components/ui/StatusBadge";
import { useAlerts } from "../features/alerts/useAlerts";
import { useDatasetAnalytics } from "../features/analytics/useDatasetAnalytics";
import { useAuth } from "../features/auth/AuthContext";
import { useWorkspaceRole } from "../features/auth/useWorkspaceRole";
import { useAuditLogs } from "../features/audit/useAuditLogs";
import { useDatasetDetails } from "../features/datasets/useDatasetDetails";
import { useImports } from "../features/imports/useImports";
import { downloadReportBlob, type Report } from "../features/reports/api";
import { useReports } from "../features/reports/useReports";
import type { StatusTone } from "../types";

const domainTypes = ["GENERIC", "SALES", "INVENTORY", "SUPPORT", "CUSTOMERS"];

const importTone = {
  PENDING: "neutral",
  VALIDATING: "info",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
} as const;

const reportTone: Record<Report["status"], StatusTone> = {
  GENERATED: "success",
  PENDING: "neutral",
  GENERATING: "info",
  FAILED: "danger",
};

export function DatasetDetailsPage() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const permissions = useWorkspaceRole();
  const details = useDatasetDetails(datasetId, isAuthenticated);
  const analytics = useDatasetAnalytics(datasetId, isAuthenticated);
  const { imports } = useImports(isAuthenticated);
  const { alerts, resolve } = useAlerts(isAuthenticated);
  const { reports, generate } = useReports(isAuthenticated);
  const { logs } = useAuditLogs(isAuthenticated);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainType, setDomainType] = useState("GENERIC");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const dataset = details.dataset;
  const datasetImports = imports.filter((item) => item.dataset_id === datasetId);
  const datasetAlerts = alerts.filter((alert) => alert.dataset_id === datasetId);
  const datasetReports = reports.filter((report) => report.dataset_id === datasetId);
  const datasetLogs = logs.filter(
    (log) => log.entity_id === datasetId || log.metadata_payload?.dataset_id === datasetId,
  );
  const editableName = useMemo(() => name || dataset?.name || "", [name, dataset?.name]);
  const editableDescription = useMemo(
    () => description || dataset?.description || "",
    [description, dataset?.description],
  );
  const editableDomainType = useMemo(
    () => domainType || dataset?.domain_type || "GENERIC",
    [domainType, dataset?.domain_type],
  );
  const canUpdate = permissions.can("datasets:update");
  const canDelete = permissions.can("datasets:delete");
  const canGenerateReport = permissions.can("reports:create");
  const canResolveAlerts = permissions.can("alerts:resolve");

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!editableName.trim()) {
      setFormError("Provide a dataset name.");
      return;
    }

    try {
      setIsSubmitting(true);
      await details.update({
        name: editableName.trim(),
        description: editableDescription.trim(),
        domain_type: editableDomainType,
      });
      setName("");
      setDescription("");
      setDomainType("GENERIC");
    } catch {
      setFormError("Could not update this dataset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!dataset || !window.confirm(`Archive dataset "${dataset.name}"?`)) {
      return;
    }
    await details.archive();
    navigate("/app/datasets");
  }

  async function handleGenerateReport() {
    if (!datasetId || !canGenerateReport) {
      return;
    }
    await generate(datasetId, `${dataset?.name ?? "Dataset"} Detail Report`);
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

  if (details.error) {
    return (
      <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-100">
        {details.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Dataset cockpit
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {dataset?.name ?? "Loading dataset..."}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Schema, preview, analytics, lineage, reports and audit context.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:text-white"
            to="/app/datasets"
          >
            Back
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:text-white"
            type="button"
            onClick={() => {
              void details.refresh();
              void analytics.refresh();
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Rows" value={String(dataset?.row_count ?? 0)} tone="info" />
        <Stat
          label="Health"
          value={`${(dataset?.health_score ?? 0).toFixed(1)}/100`}
          tone="success"
        />
        <Stat label="Imports" value={String(datasetImports.length)} tone="neutral" />
        <Stat label="Reports" value={String(datasetReports.length)} tone="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-slate-800 bg-slate-950/70 p-5"
          onSubmit={handleUpdate}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200">
              <Database size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Overview</h3>
              <p className="text-sm text-slate-500">Edit role-protected metadata.</p>
            </div>
          </div>
          <div className="space-y-4">
            <TextInput
              disabled={!canUpdate}
              label="Name"
              value={editableName}
              onChange={setName}
            />
            <TextInput
              disabled={!canUpdate}
              label="Description"
              value={editableDescription}
              onChange={setDescription}
            />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Domain
              </span>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60 disabled:opacity-60"
                disabled={!canUpdate}
                value={editableDomainType}
                onChange={(event) => setDomainType(event.target.value)}
              >
                {domainTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            {formError ? <p className="text-sm text-red-200">{formError}</p> : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !canUpdate}
              type="submit"
            >
              <Save size={16} />
              {isSubmitting ? "Saving..." : "Save dataset"}
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:border-red-300/50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canDelete}
              type="button"
              onClick={() => void handleArchive()}
            >
              <Archive size={16} />
              Archive dataset
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <HealthBreakdownPanel health={analytics.health} />
          <LineagePanel lineage={details.lineage} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          empty="No schema detected yet."
          headers={["Column", "Type", "Nullable", "Samples"]}
          title="Schema explorer"
          rows={details.columns.map((column) => [
            column.name,
            column.detected_type,
            column.nullable ? "Yes" : "No",
            column.sample_values.join(", "),
          ])}
        />
        <SimpleTable
          empty="No processed preview rows yet."
          headers={["Row", "Quality", "Payload"]}
          title="Processed preview"
          rows={details.preview.map((record) => [
            String(record.row_number),
            `${(record.quality_score * 100).toFixed(0)}%`,
            JSON.stringify(record.payload),
          ])}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          empty="No analytics snapshots yet."
          headers={["Metric", "Value", "Dimensions"]}
          title="Analytics snapshots"
          rows={(analytics.summary?.metrics ?? []).map((metric) => [
            metric.key,
            metric.value.toFixed(2),
            JSON.stringify(metric.dimensions),
          ])}
        />
        <SimpleTable
          empty="No imports for this dataset yet."
          headers={["File", "Status", "Rows", "Health"]}
          title="Import jobs"
          rows={datasetImports.map((item) => [
            item.original_filename,
            item.status,
            String(item.total_rows),
            `${item.health_score.toFixed(1)}/100`,
          ])}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OutputPanel
          canGenerateReport={canGenerateReport}
          downloadingId={downloadingId}
          reports={datasetReports}
          onDownload={handleDownload}
          onGenerate={handleGenerateReport}
        />
        <AlertsPanel
          alerts={datasetAlerts}
          canResolve={canResolveAlerts}
          onResolve={resolve}
        />
      </section>

      <SimpleTable
        empty="No dataset-specific audit events yet."
        headers={["Timestamp", "Action", "Entity", "Metadata"]}
        title="Audit trail"
        rows={datasetLogs.map((log) => [
          new Date(log.created_at).toLocaleString("en-US"),
          log.action,
          log.entity_type,
          JSON.stringify(log.metadata_payload),
        ])}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <StatusBadge label={label} tone={tone} />
      <strong className="mt-3 block text-2xl font-semibold text-white">
        {value}
      </strong>
    </div>
  );
}

function TextInput({
  disabled,
  label,
  value,
  onChange,
}: {
  disabled: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60 disabled:opacity-60"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function HealthBreakdownPanel({
  health,
}: {
  health: ReturnType<typeof useDatasetAnalytics>["health"];
}) {
  const values = health
    ? [
        ["Completeness", health.completeness],
        ["Validity", health.validity],
        ["Uniqueness", health.uniqueness],
        ["Consistency", health.consistency],
        ["Freshness", health.freshness],
      ]
    : [];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <h3 className="text-base font-semibold text-white">Data Health breakdown</h3>
      <p className="mt-1 text-sm text-slate-500">
        Weighted quality dimensions calculated from processed records.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {values.map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-800 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <strong className="mt-1 block text-xl text-slate-100">
              {Number(value).toFixed(1)}%
            </strong>
          </div>
        ))}
      </div>
      {!values.length ? (
        <p className="mt-5 text-sm text-slate-500">No health breakdown yet.</p>
      ) : null}
    </section>
  );
}

function LineagePanel({
  lineage,
}: {
  lineage: ReturnType<typeof useDatasetDetails>["lineage"];
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-md border border-violet-400/30 bg-violet-400/10 p-2 text-violet-100">
          <GitBranch size={17} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Data lineage</h3>
          <p className="text-sm text-slate-500">
            File to import job to records, snapshots and reports.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(lineage?.nodes ?? []).map((node) => (
          <div key={node.id} className="rounded-md border border-slate-800 p-3">
            <StatusBadge label={node.type} tone="neutral" />
            <strong className="mt-2 block text-sm text-slate-100">
              {node.label}
            </strong>
            {node.detail ? (
              <p className="mt-1 text-xs text-slate-500">{node.detail}</p>
            ) : null}
          </div>
        ))}
      </div>
      {lineage?.edges.length ? (
        <div className="mt-4 space-y-2 text-xs text-slate-500">
          {lineage.edges.map((edge) => (
            <p key={`${edge.source}-${edge.target}`}>
              {edge.source} {"->"} {edge.target}: {edge.label}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SimpleTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 p-5">
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="hover:bg-slate-900/50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="max-w-md truncate px-5 py-4 text-slate-300"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
          {empty}
        </div>
      ) : null}
    </section>
  );
}

function OutputPanel({
  reports,
  canGenerateReport,
  downloadingId,
  onGenerate,
  onDownload,
}: {
  reports: Report[];
  canGenerateReport: boolean;
  downloadingId: string | null;
  onGenerate: () => Promise<void>;
  onDownload: (report: Report) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Reports</h3>
          <p className="mt-1 text-sm text-slate-500">Dataset-specific PDF outputs.</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canGenerateReport}
          type="button"
          onClick={() => void onGenerate()}
        >
          <FileText size={15} />
          Generate
        </button>
      </div>
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-800 p-3"
          >
            <div>
              <p className="font-medium text-slate-100">{report.title}</p>
              <div className="mt-2">
                <StatusBadge label={report.status} tone={reportTone[report.status]} />
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={report.status !== "GENERATED" || !report.file_path}
              type="button"
              onClick={() => void onDownload(report)}
            >
              <Download size={15} />
              {downloadingId === report.id ? "Downloading..." : "Download"}
            </button>
          </div>
        ))}
      </div>
      {!reports.length ? (
        <p className="text-sm text-slate-500">No reports generated for this dataset.</p>
      ) : null}
    </section>
  );
}

function AlertsPanel({
  alerts,
  canResolve,
  onResolve,
}: {
  alerts: ReturnType<typeof useAlerts>["alerts"];
  canResolve: boolean;
  onResolve: (alertId: string) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <h3 className="text-base font-semibold text-white">Alerts</h3>
      <div className="mt-5 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-md border border-slate-800 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge
                  label={alert.severity}
                  tone={alert.severity === "CRITICAL" ? "danger" : "warning"}
                />
                <p className="mt-2 font-medium text-slate-100">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-500">{alert.message}</p>
              </div>
              {alert.status === "OPEN" && canResolve ? (
                <button
                  className="rounded-md border border-emerald-400/30 px-3 py-2 text-sm text-emerald-100"
                  type="button"
                  onClick={() => void onResolve(alert.id)}
                >
                  Resolve
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {!alerts.length ? (
        <p className="mt-5 text-sm text-slate-500">No alerts for this dataset.</p>
      ) : null}
    </section>
  );
}
