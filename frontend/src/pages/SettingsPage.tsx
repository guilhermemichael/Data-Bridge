import { FormEvent, useMemo, useState } from "react";
import { RefreshCw, Save, Shield } from "lucide-react";

import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../features/auth/AuthContext";
import { useWorkspaceRole } from "../features/auth/useWorkspaceRole";
import { useOrganizationMembers } from "../features/organizations/useOrganizationMembers";
import { useOrganizations } from "../features/organizations/useOrganizations";

export function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const permissions = useWorkspaceRole();
  const { organizations, isLoading, error, refresh, update } =
    useOrganizations(isAuthenticated);
  const selectedOrganization = organizations[0] ?? null;
  const { members, refresh: refreshMembers } = useOrganizationMembers(
    selectedOrganization?.id ?? null,
    isAuthenticated,
  );
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizationName = useMemo(
    () => name || selectedOrganization?.name || "",
    [name, selectedOrganization?.name],
  );
  const canUpdateOrganization = permissions.can("organization:update");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!selectedOrganization || !organizationName.trim()) {
      setFormError("Select an organization and provide a name.");
      return;
    }

    try {
      setIsSubmitting(true);
      await update(selectedOrganization.id, organizationName.trim());
      setName("");
      await refreshMembers();
    } catch {
      setFormError("Could not update organization settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Workspace settings
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Organization and access
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Review your current workspace, role and member list.
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

      {error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-slate-800 bg-slate-950/70 p-5"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200">
              <Shield size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Organization profile
              </h3>
              <p className="text-sm text-slate-500">
                Role-aware settings backed by the API.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Organization name
              </span>
              <input
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60 disabled:opacity-60"
                disabled={!canUpdateOrganization}
                value={organizationName}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Your role
              </p>
              <div className="mt-2">
                <StatusBadge label={permissions.role ?? "UNKNOWN"} tone="info" />
              </div>
            </div>

            {!canUpdateOrganization ? (
              <p className="text-sm text-yellow-100">
                Your current role can view settings but cannot update organization
                details.
              </p>
            ) : null}
            {formError ? <p className="text-sm text-red-200">{formError}</p> : null}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !canUpdateOrganization || isLoading}
              type="submit"
            >
              <Save size={16} />
              {isSubmitting ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 p-5">
            <h3 className="text-base font-semibold text-white">Members</h3>
            <p className="mt-1 text-sm text-slate-500">
              Current organization membership and roles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {member.user_full_name}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {member.user_email}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={member.role} tone="info" />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(member.created_at).toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!members.length ? (
            <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
              No members loaded yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
