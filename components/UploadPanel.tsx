"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadStatus } from "@/lib/types";

type Phase = "idle" | "uploading" | UploadStatus;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700",
  uploading: "bg-neutral-100 text-neutral-700",
  processing: "bg-blue-50 text-blue-700",
  complete: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
};

export function UploadPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const uploadIdRef = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopTimers = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);
    pollTimer.current = null;
    retryTimer.current = null;
  }, []);

  useEffect(() => stopTimers, [stopTimers]);

  const acceptFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      setError("Unsupported file type. Please upload a CSV or XLSX.");
      return;
    }
    setFile(f);
    setPhase("idle");
  };

  const pollStatus = useCallback(
    (uploadId: string) => {
      stopTimers();
      // Per test plan: if still processing after 30s, offer a retry.
      retryTimer.current = setTimeout(() => setShowRetry(true), 30_000);
      pollTimer.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/uploads/${uploadId}`);
          if (!res.ok) return;
          const { upload } = await res.json();
          setPhase(upload.status);
          if (upload.status === "complete") {
            stopTimers();
            router.refresh();
          } else if (upload.status === "error") {
            stopTimers();
            setError(upload.error_message ?? "Processing failed.");
          }
        } catch {
          // transient network error — keep polling
        }
      }, 1000);
    },
    [router, stopTimers],
  );

  const startProcessing = useCallback(
    async (uploadId: string) => {
      setPhase("processing");
      setShowRetry(false);
      pollStatus(uploadId);
      try {
        await fetch(`/api/process/${uploadId}`, { method: "POST" });
      } catch {
        // poller will surface the state; retry button appears after 30s
      }
    },
    [pollStatus],
  );

  const handleProcess = async () => {
    if (!file) {
      setError("Choose a CSV or XLSX file first.");
      return;
    }
    if (!periodLabel.trim()) {
      setError('Enter a period label (e.g. "Jun 2025").');
      return;
    }
    setError(null);
    setPhase("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("period_label", periodLabel.trim());
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setPhase("idle");
        setError(body.error ?? "Upload failed.");
        return;
      }
      uploadIdRef.current = body.upload.id;
      setPhase("pending");
      await startProcessing(body.upload.id);
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  const reset = () => {
    stopTimers();
    setFile(null);
    setPeriodLabel("");
    setPhase("idle");
    setError(null);
    setShowRetry(false);
    uploadIdRef.current = null;
  };

  const busy = phase === "uploading" || phase === "pending" || phase === "processing";

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700"
      >
        {open ? "Close" : "Upload Export"}
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-10 mt-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-lg sm:left-auto sm:w-[28rem]">
          <h3 className="text-sm font-semibold text-neutral-900">
            Upload monthly finance export
          </h3>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              acceptFile(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-neutral-300 bg-neutral-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-sm font-medium text-neutral-900">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-neutral-700">
                  Drag &amp; drop a CSV/XLSX here
                </p>
                <p className="mt-1 text-xs text-neutral-500">or click to browse</p>
              </>
            )}
          </div>

          <label className="mt-3 block text-xs font-medium text-neutral-700">
            Period label
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder='e.g. "Jun 2025"'
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleProcess}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working…" : "Process"}
            </button>
            {phase !== "idle" && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[phase]}`}
              >
                {phase}
              </span>
            )}
            {phase === "complete" && (
              <button onClick={reset} className="text-xs text-neutral-500 underline">
                Upload another
              </button>
            )}
            {showRetry && phase === "processing" && uploadIdRef.current && (
              <button
                onClick={() => startProcessing(uploadIdRef.current!)}
                className="text-xs font-medium text-blue-700 underline"
              >
                Retry
              </button>
            )}
          </div>

          {phase === "complete" && (
            <p className="mt-3 text-sm text-green-700">
              Processed — dashboard updated with the new snapshot.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
