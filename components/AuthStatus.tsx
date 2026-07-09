"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Header widget: shows signed-in email + logout, or a sign-in link. */
export function AuthStatus() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    router.refresh();
  };

  if (!loaded) return null;
  return email ? (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <span>{email}</span>
      <button onClick={signOut} className="text-blue-700 underline">
        Sign out
      </button>
    </div>
  ) : (
    <Link href="/login" className="text-xs text-blue-700 underline">
      Sign in
    </Link>
  );
}
