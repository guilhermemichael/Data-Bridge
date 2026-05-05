import { FormEvent, useMemo, useState } from "react";
import { Database, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import { useWorkspaceRole } from "../features/auth/useWorkspaceRole";
import { useDatasets } from "../features/datasets/useDatasets";
import { useOrganizations } from "../features/organizations/useOrganizations";
import { StatusBadge } from "../components/ui/StatusBadge";

const domainTypes = ["GENERIC", "SALES", "INVENTORY", "SUPPORT", "CUSTOMERS"];

export function DatasetsPage() {
  const { isAuthenticated } = useAuth();
  const { organizations, isLoading: isLoadingOrganizations } =
    useOrganizations(isAuthenticated);
  const { datasets, isLoading, error, create, refresh } =
    useDatasets(isAuthenticated);
  const permissions = useWorkspaceRole();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainType, setDomainType] = useState("GENERIC");
  const [organizationId, setOrganizationId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOrganizationId = useMemo(() => {
    return organizationId || organizations[0]?.id || "";
  }, [organizationId, organizations]);
  const canCreateDataset = permissions.can("datasets:create");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!selectedOrganizationId || !name.trim()) {
      setFormError("Select an organization and provide a dataset name.");
      return;
    }

    try {
      setIsSubmitting(true);
      await create({
        organization_id: selectedOrganizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        domain_type: domainType,
      });
      setName("");
      setDescription("");
      setDomainType("GENERIC");
    } catch {
      setFormError("Could not create dataset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Dataset management
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Operational datasets
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create datasets that will receive imports, schema detection and analytics.
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
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200">
              <Plus size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Create dataset
              </h3>
              <p className="text-sm text-slate-500">Attach it to your workspace.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Organization
              </span>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                disabled={isLoadingOrganizations}
                value={selectedOrganizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <TextField label="Name" value={name} onChange={setName} />
            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Domain
              </span>
              <select
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                value={domainType}
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
            {!canCreateDataset ? (
              <p className="text-sm text-yellow-100">
                Your current role can view datasets but cannot create them.
              </p>
            ) : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !canCreateDataset}
              type="submit"
            >
              <Database size={16} />
              {isSubmitting ? "Creating..." : "Create dataset"}
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-5">
            <h3 className="text-base font-semibold text-white">Datasets</h3>
            <p className="mt-1 text-sm text-slate-500">
              Live list loaded from the backend.
            </p>
          </div>

          {error ? (
            <div className="p-5 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Domain</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Rows</th>
                  <th className="px-5 py-3 font-medium">Health</th>
                  <th className="px-5 py-3 font-medium">Last import</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {dataset.name}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {dataset.domain_type}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={dataset.status}
                        tone={dataset.status === "ACTIVE" ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {dataset.row_count.toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {dataset.health_score.toFixed(1)}/100
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {dataset.last_imported_at
                        ? new Date(dataset.last_imported_at).toLocaleString("en-US")
                        : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60"
                        to={`/app/datasets/${dataset.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && !datasets.length ? (
            <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
              No datasets connected yet. Create your first dataset to start the
              import pipeline.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
