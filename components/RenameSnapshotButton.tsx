"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

/**
 * Inline rename for a history snapshot's period label. The pencil reveals a
 * small input with Save / Cancel; Save PATCHes /api/snapshots/[id] (same auth
 * gate as delete/upload) and refreshes the list + dashboard label. Allowed on
 * every snapshot, including the current one.
 */
export function RenameSnapshotButton({
  snapshotId,
  periodLabel,
}: {
  snapshotId: string;
  periodLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(periodLabel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setValue(periodLabel);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    const next = value.trim();
    if (!next) {
      setError("Period label can’t be empty.");
      return;
    }
    if (next === periodLabel) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_label: next }),
      });
      const bodyJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(bodyJson.error ?? "Rename failed.");
        setBusy(false);
        return;
      }
      setEditing(false);
      setBusy(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed.");
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          aria-label="Period label"
          className="w-40 rounded-lg border border-neutral-300 px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={cancel}
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
      onClick={open}
      aria-label={`Rename snapshot ${periodLabel}`}
      title="Rename snapshot"
      className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
    >
      <PencilIcon />
    </button>
  );
}
