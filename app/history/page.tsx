import Link from "next/link";
import { listSnapshots } from "@/lib/data";
import { fmtDateTime, fmtMoney, fmtPct } from "@/lib/format";
import { DeleteSnapshotButton } from "@/components/DeleteSnapshotButton";
import { RenameSnapshotButton } from "@/components/RenameSnapshotButton";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const snapshots = await listSnapshots();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Snapshot history
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every processed export, newest first.
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
          ← Dashboard
        </Link>
      </header>

      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          No snapshots yet — upload a finance export to create one.
        </div>
      ) : (
        <ul className="space-y-3">
          {snapshots.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2">
              <Link
                href={`/history/${s.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <div>
                  <p className="font-semibold text-neutral-900">
                    {s.period_label}
                    {s.is_current && (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Created {fmtDateTime(s.created_at)}
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <span>
                    <span className="text-neutral-500">EBIT </span>
                    <span className="font-medium tabular-nums">
                      {fmtMoney(s.ebit_actual)}
                    </span>
                  </span>
                  <span>
                    <span className="text-neutral-500">vs budget </span>
                    <span className="font-medium tabular-nums">
                      {fmtMoney(s.ebit_budget)}
                    </span>
                  </span>
                  <span>
                    <span className="text-neutral-500">GP </span>
                    <span className="font-medium tabular-nums">
                      {fmtPct(s.gross_profit_pct)}
                    </span>
                  </span>
                </div>
              </Link>
              <RenameSnapshotButton
                snapshotId={s.id}
                periodLabel={s.period_label}
              />
              <DeleteSnapshotButton
                snapshotId={s.id}
                periodLabel={s.period_label}
                disabled={s.is_current}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
