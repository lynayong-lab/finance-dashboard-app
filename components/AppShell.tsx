"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { UploadProvider } from "@/components/UploadContext";
import { UploadDialog } from "@/components/UploadDialog";
import { Sidebar } from "@/components/Sidebar";

/**
 * App chrome: a persistent left sidebar on desktop, collapsing behind a
 * hamburger in a mobile top bar. Auth pages (/login, /auth/*) render bare —
 * no sidebar. Does not touch middleware or the auth gate.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Standalone pages keep their full-screen layout, no app chrome.
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <UploadProvider>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="md:pl-60">
        {/* Mobile top bar with hamburger — desktop shows the persistent rail instead */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-[#f9f9f7]/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="rounded-lg p-1.5 text-neutral-700 transition hover:bg-neutral-200"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm font-bold tracking-tight text-neutral-900">
            Finance Dashboard
          </span>
        </div>

        {children}
      </div>

      <UploadDialog />
    </UploadProvider>
  );
}
