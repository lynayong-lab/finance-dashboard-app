import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, skip the auth refresh and pass through.
  // Without this guard createServerClient throws "Your project's URL and Key
  // are required", crashing the edge middleware on every route (500
  // MIDDLEWARE_INVOCATION_FAILED).
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  try {
    let response = supabaseResponse;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session so it doesn't expire while user is active
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Lock-down phase (REQUIRE_AUTH=true): the dashboard is no longer public —
    // viewing requires a signed-in session, mirroring the write gate in
    // lib/requireUser.ts. In the demo phase (flag unset) everything stays open.
    if (process.env.REQUIRE_AUTH === "true" && !user) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname.startsWith("/auth") || // auth callbacks
        pathname.startsWith("/api"); // API routes return their own JSON 401
      if (!isPublic) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(loginUrl);
      }
    }

    return response;
  } catch {
    // Never let an auth hiccup crash the entire edge middleware
    return supabaseResponse;
  }
}
