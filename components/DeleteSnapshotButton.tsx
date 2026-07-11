"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * Delete control for a history snapshot. Two-step: the trash button reveals an
 * inline "Are you sure?" confirm before the DELETE call — no one-click deletes.
 * When `disabled` (the current snapshot) it renders greyed out and inert.
 */
export function DeleteSnapshotButton({
  snapshotId,
  periodLabel,
  disabled = false,
}: {
  snapshotId: string;
  periodLabel: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-label="The current snapshot can't be deleted"
        title="The current snapshot can't be deleted"
        className="cursor-not-allowed rounded-lg border border-neutral-200 p-2 text-neutral-300"
      >
        <TrashIcon />
      </button>
    );
  }

  const del = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Delete failed.");
        setBusy(false);
        return;
      }
      setConfirming(false);
      setBusy(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setBusy(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5">
        <span className="text-xs text-red-800">
          Delete “{periodLabel}”? This can’t be undone.
        </span>
        <button
          type="button"
          onClick={del}
          disabled={busy}
          className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={busy}
          className="text-xs text-neutral-600 underline disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="w-full text-xs text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete snapshot ${periodLabel}`}
      title="Delete snapshot"
      className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
    >
      <TrashIcon />
    </button>
  );
}
