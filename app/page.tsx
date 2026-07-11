import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { DashboardView } from "@/components/DashboardView";
import { UploadButton } from "@/components/UploadButton";
import { AuthStatus } from "@/components/AuthStatus";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Finance Dashboard
          </h1>
          {data ? (
            <p className="mt-1 text-sm text-neutral-500">
              Current period: <span className="font-medium text-neutral-700">{data.snapshot.period_label}</span>
              {" · "}generated {fmtDate(data.snapshot.created_at)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">No data yet</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              History
            </Link>
            <UploadButton />
          </div>
          <AuthStatus />
        </div>
      </header>

      {data ? (
        <DashboardView data={data} />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-neutral-900">
            No data yet — upload a finance export to get started.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Once an export is processed, the dashboard renders EBIT vs Budget, GP%,
            team RAG status and flagged projects here.
          </p>
        </div>
      )}
    </main>
  );
}
