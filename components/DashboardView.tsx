import type { DashboardData } from "@/lib/data";
import { fmtMoney, fmtMoneyFull, fmtPct, fmtSignedPct, variancePct } from "@/lib/format";
import { EbitTrendChart } from "@/components/EbitTrendChart";
import { RagBadge } from "@/components/RagBadge";
import { RagOverrideChip } from "@/components/RagOverrideChip";

const FLAG_LABELS: Record<string, string> = {
  billing_delay: "Billing delay",
  overrun: "Overrun",
  high_wip: "High WIP",
};

export function DashboardView({ data }: { data: DashboardData }) {
  const { snapshot, teams, flags, trend } = data;
  const vPct = variancePct(snapshot.ebit_actual, snapshot.ebit_budget);
  const varianceTone =
    vPct < -10 ? "text-red-700" : vPct <= -3 ? "text-amber-700" : "text-green-700";

  return (
    <div className="space-y-6">
      {/* Headline stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">EBIT — Actual</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {fmtMoney(snapshot.ebit_actual)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {fmtMoneyFull(snapshot.ebit_actual)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">EBIT — Budget</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {fmtMoney(snapshot.ebit_budget)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {fmtMoneyFull(snapshot.ebit_budget)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">EBIT Variance</p>
          <p className={`mt-1 text-3xl font-semibold tracking-tight ${varianceTone}`}>
            {fmtMoney(snapshot.ebit_variance)}
          </p>
          <p className={`mt-1 text-xs font-medium ${varianceTone}`}>
            {fmtSignedPct(vPct)} vs budget
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Gross Profit</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {fmtPct(snapshot.gross_profit_pct)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Fee revenue {fmtMoney(snapshot.total_fee_revenue)}
          </p>
        </div>
      </div>

      {/* Trend + team RAG cards */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-semibold text-neutral-900">EBIT trend</h2>
          <p className="mb-2 text-xs text-neutral-500">Last {trend.length} periods</p>
          <EbitTrendChart trend={trend} />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Teams — fee revenue &amp; RAG
          </h2>
          <ul className="divide-y divide-neutral-100">
            {teams.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{t.team_name}</p>
                  <p className="text-xs text-neutral-500">
                    {fmtMoney(t.fee_revenue)} fee revenue · GP {fmtPct(t.gross_profit_pct)}
                  </p>
                  {t.rag_reason && (
                    <p className="mt-0.5 text-xs text-neutral-400">{t.rag_reason}</p>
                  )}
                </div>
                <RagOverrideChip
                  metricId={t.id}
                  status={t.rag_status}
                  reviewStatus={t.rag_status_review_status}
                />
              </li>
            ))}
            {teams.length === 0 && (
              <li className="py-3 text-sm text-neutral-500">No team metrics.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Projects needing attention */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Projects needing attention
        </h2>
        {flags.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No projects flagged this period. 🎉
          </p>
        ) : (
          <>
            {/* Desktop / tablet: table (unchanged) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="py-2 pr-4 font-medium">Project</th>
                    <th className="py-2 pr-4 font-medium">Team</th>
                    <th className="py-2 pr-4 font-medium">Flag</th>
                    <th className="py-2 pr-4 font-medium text-right">WIP</th>
                    <th className="py-2 pr-4 font-medium text-right">Overrun</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {flags.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-neutral-900">{f.project_name}</span>
                        <span className="ml-2 text-xs text-neutral-400">{f.project_code}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-neutral-700">{f.team_name}</td>
                      <td className="py-2.5 pr-4 text-neutral-700">
                        {FLAG_LABELS[f.flag_type] ?? f.flag_type}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-700">
                        {f.wip_value !== null ? fmtMoney(f.wip_value) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-neutral-700">
                        {f.overrun_pct !== null ? fmtPct(f.overrun_pct) : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <RagBadge status={f.rag_status} size="sm" />
                      </td>
                      <td className="py-2.5 text-neutral-500">{f.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: one card per flagged project — no horizontal scroll */}
            <ul className="space-y-3 sm:hidden">
              {flags.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-neutral-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">{f.project_name}</p>
                      <p className="text-xs text-neutral-400">{f.project_code}</p>
                    </div>
                    <RagBadge status={f.rag_status} size="sm" />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">Team</dt>
                      <dd className="text-neutral-700">{f.team_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">Flag</dt>
                      <dd className="text-neutral-700">
                        {FLAG_LABELS[f.flag_type] ?? f.flag_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">WIP</dt>
                      <dd className="tabular-nums text-neutral-700">
                        {f.wip_value !== null ? fmtMoney(f.wip_value) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">Overrun</dt>
                      <dd className="tabular-nums text-neutral-700">
                        {f.overrun_pct !== null ? fmtPct(f.overrun_pct) : "—"}
                      </dd>
                    </div>
                  </dl>
                  {f.notes && (
                    <dl className="mt-2">
                      <dt className="text-xs uppercase tracking-wide text-neutral-500">Notes</dt>
                      <dd className="text-sm text-neutral-500">{f.notes}</dd>
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
