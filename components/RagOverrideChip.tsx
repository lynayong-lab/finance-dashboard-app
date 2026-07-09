"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RagStatus } from "@/lib/types";
import { RagBadge } from "@/components/RagBadge";

/**
 * Inline RAG override (Sprint 3): click the status chip → choose a new status
 * with a note → saved via /api/team-metrics/[id]/override (audit-logged).
 */
export function RagOverrideChip({
  metricId,
  status,
  reviewStatus,
}: {
  metricId: string;
  status: RagStatus;
  reviewStatus: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RagStatus>(status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-metrics/${metricId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rag_status: selected, note }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Override failed.");
        return;
      }
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Override failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col items-end gap-1" ref={popRef}>
      <button
        onClick={() => {
          setSelected(status);
          setOpen((o) => !o);
        }}
        title="Override RAG status"
        className="rounded-full transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <RagBadge status={status} />
      </button>
      {reviewStatus === "overridden" && (
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          Overridden
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-9 z-20 w-64 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
          <p className="text-xs font-semibold text-neutral-900">Override RAG status</p>
          <div className="mt-2 flex gap-2">
            {(["green", "amber", "red"] as RagStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={`rounded-full transition ${
                  selected === s ? "ring-2 ring-blue-500 ring-offset-1" : "opacity-60"
                }`}
              >
                <RagBadge status={s} size="sm" />
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for override (recommended)"
            rows={2}
            className="mt-3 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-500 underline"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
