"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUpload } from "@/components/UploadContext";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";
const active = "bg-neutral-900 text-white";
const inactive = "text-neutral-700 hover:bg-neutral-100";

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

/** Nav body shared by the desktop rail and the mobile overlay. */
function NavBody({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { openUpload } = useUpload();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isDashboard = pathname === "/";
  const isHistory = pathname === "/history" || pathname.startsWith("/history/");

  const signOut = async () => {
    await createClient().auth.signOut();
    onNavigate();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-4">
        <span className="text-sm font-bold tracking-tight text-neutral-900">
          Finance Dashboard
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        <Link
          href="/"
          onClick={onNavigate}
          aria-current={isDashboard ? "page" : undefined}
          className={`${linkBase} ${isDashboard ? active : inactive}`}
        >
          <DashboardIcon />
          Dashboard
        </Link>
        <Link
          href="/history"
          onClick={onNavigate}
          aria-current={isHistory ? "page" : undefined}
          className={`${linkBase} ${isHistory ? active : inactive}`}
        >
          <HistoryIcon />
          History
        </Link>
        <button
          onClick={() => {
            onNavigate();
            openUpload();
          }}
          className={`${linkBase} ${inactive} w-full text-left`}
        >
          <UploadIcon />
          Upload Export
        </button>
      </nav>

      <div className="border-t border-neutral-200 px-3 py-3">
        {email ? (
          <>
            <p className="mb-2 truncate text-xs text-neutral-500" title={email}>
              {email}
            </p>
            <button
              onClick={signOut}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-neutral-100"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop: persistent rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-neutral-200 bg-white md:block">
        <NavBody onNavigate={() => {}} />
      </aside>

      {/* Mobile: slide-in overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white shadow-xl">
            <NavBody onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
