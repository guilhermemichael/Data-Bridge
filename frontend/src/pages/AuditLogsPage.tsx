import { RefreshCw, ShieldCheck } from "lucide-react";

import { useAuditLogs } from "../features/audit/useAuditLogs";
import { useAuth } from "../features/auth/AuthContext";

export function AuditLogsPage() {
  const { isAuthenticated } = useAuth();
  const { logs, isLoading, error, refresh } = useAuditLogs(isAuthenticated);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="mt-1 h-fit rounded-md border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-100">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
              Governance trail
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Audit logs
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Track sensitive actions across authentication, datasets, imports,
              reports and alert workflows.
            </p>
          </div>
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

      <section className="rounded-lg border border-slate-800 bg-slate-950/70">
        <div className="border-b border-slate-800 p-5">
          <h3 className="text-base font-semibold text-white">Event history</h3>
          <p className="mt-1 text-sm text-slate-500">
            Live audit entries loaded from the backend.
          </p>
        </div>

        {error ? <div className="p-5 text-sm text-red-200">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50">
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(log.created_at).toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-100">
                    {log.action}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {log.entity_type}
                    {log.entity_id ? (
                      <span className="ml-2 text-xs text-slate-600">
                        {log.entity_id.slice(0, 8)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {log.user_id ? log.user_id.slice(0, 8) : "System"}
                  </td>
                  <td className="px-5 py-4">
                    <code className="block max-w-md truncate rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1 text-xs text-slate-400">
                      {JSON.stringify(log.metadata_payload)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !logs.length ? (
          <div className="border-t border-slate-800 px-5 py-10 text-sm text-slate-500">
            No audit events yet. Sensitive workspace activity will appear here.
          </div>
        ) : null}
      </section>
    </div>
  );
}
