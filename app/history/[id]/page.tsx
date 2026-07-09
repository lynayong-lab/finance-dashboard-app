import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/data";
import { DashboardView } from "@/components/DashboardView";
import { SetCurrentButton } from "@/components/SetCurrentButton";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDashboardData(id);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href="/history" className="text-blue-700 hover:underline">
              ← History
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
            {data.snapshot.period_label}
            {data.snapshot.is_current && (
              <span className="ml-2 align-middle rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                Current
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Snapshot created {fmtDateTime(data.snapshot.created_at)}
          </p>
        </div>
        {!data.snapshot.is_current && <SetCurrentButton snapshotId={data.snapshot.id} />}
      </header>
      <DashboardView data={data} />
    </main>
  );
}
