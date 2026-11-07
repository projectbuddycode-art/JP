import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/public-env";
import { DEMO_COOKIE, verifyDemoToken } from "@/lib/auth/demo-token";

function isPublicPath(path: string) {
  return (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/auth/") ||
    path.startsWith("/enquire") ||
    path.startsWith("/p/") ||
    path.startsWith("/proposal/") ||
    path.startsWith("/destinations") ||
    path.startsWith("/trips") ||
    path.startsWith("/custom-trip") ||
    path.startsWith("/about") ||
    path.startsWith("/travel-guides") ||
    path.startsWith("/contact") ||
    path.startsWith("/privacy-policy") ||
    path.startsWith("/terms-and-conditions") ||
    path.startsWith("/cancellation-policy") ||
    path.startsWith("/sitemap") ||
    path.startsWith("/robots") ||
    path.startsWith("/api/webhooks") ||
    path.startsWith("/api/cron") ||
    path.startsWith("/api/public") ||
    path.startsWith("/api/health")
  );
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = publicEnv();
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  if (!supabaseUrl || !supabaseAnonKey) {
    const demoUser = verifyDemoToken(request.cookies.get(DEMO_COOKIE)?.value);
    if (!demoUser && !isPublicPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (demoUser && (path === "/login" || path === "/forgot-password")) {
      const url = request.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/forgot-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  return response;
}
