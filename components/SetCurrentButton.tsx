"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SetCurrentButton({ snapshotId }: { snapshotId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrent = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/set-current`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to set current.");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set current.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={setCurrent}
        disabled={busy}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {busy ? "Setting…" : "Set as Current"}
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
