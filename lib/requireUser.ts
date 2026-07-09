import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth gate for write actions.
 *
 * The app ships **demo-first** (docs/SECURITY.md "v1 demo" phase, CLAUDE.md
 * rule 6): anyone can use the core upload→dashboard flow, no login wall. The
 * "Lock-down" phase is enabled by setting `REQUIRE_AUTH=true` — then writes
 * require an authenticated Supabase user and rows are owner-scoped. Flip the
 * env var together with applying `supabase/migrations/0002_lockdown.sql`.
 *
 * Returns `{ user }` (user.id may be null in demo mode) or `{ response }` — a
 * 401 to return as-is.
 */
export async function requireUser(): Promise<
  { user: { id: string | null; email?: string } } | { response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lockdown = process.env.REQUIRE_AUTH === "true";
  if (!lockdown) {
    // Demo phase — proceed whether or not someone is signed in.
    return { user: { id: user?.id ?? null, email: user?.email } };
  }

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Sign in required. Go to /login to sign in." },
        { status: 401 },
      ),
    };
  }
  return { user: { id: user.id, email: user.email } };
}
