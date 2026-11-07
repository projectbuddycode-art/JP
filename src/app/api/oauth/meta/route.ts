import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { requireOwnerProfile } from "@/lib/auth/session";

export async function GET() {
  await requireOwnerProfile();
  const env = serverEnv();
  if (!env.metaAppId) {
    return NextResponse.json({
      configured: false,
      message: "META_APP_ID is not set. Create a Meta app, then return here to start OAuth.",
    });
  }
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https"),
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", env.metaAppId);
  url.searchParams.set("redirect_uri", `${env.appUrl}/api/oauth/meta/callback`);
  url.searchParams.set(
    "scope",
    "pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish,leads_retrieval,pages_manage_ads,pages_read_engagement",
  );
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
