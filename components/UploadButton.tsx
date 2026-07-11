"use client";

import { useUpload } from "@/components/UploadContext";

/** Top-bar trigger that opens the shared upload dialog. */
export function UploadButton() {
  const { openUpload } = useUpload();
  return (
    <button
      onClick={openUpload}
      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700"
    >
      Upload Export
    </button>
  );
}
