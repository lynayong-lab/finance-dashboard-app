"use client";

import { createContext, useCallback, useContext, useState } from "react";

type UploadCtx = {
  open: boolean;
  openUpload: () => void;
  closeUpload: () => void;
};

const Ctx = createContext<UploadCtx | null>(null);

/**
 * Shares the upload dialog's open state so any trigger — the top-bar button or
 * the sidebar "Upload Export" link — opens the single dialog rendered by AppShell.
 */
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openUpload = useCallback(() => setOpen(true), []);
  const closeUpload = useCallback(() => setOpen(false), []);
  return (
    <Ctx.Provider value={{ open, openUpload, closeUpload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUpload(): UploadCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUpload must be used within UploadProvider");
  return c;
}
