import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { requireOwnerProfile } from "@/lib/auth/session";

export async function GET() {
  await requireOwnerProfile();
  const env = serverEnv();
  if (!env.linkedinClientId) {
    return NextResponse.json({
      configured: false,
      message: "Developer access required — awaiting LinkedIn Lead Sync approval.",
    });
  }
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("linkedin_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.appUrl.startsWith("https"),
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.linkedinClientId);
  url.searchParams.set("redirect_uri", `${env.appUrl}/api/oauth/linkedin/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "r_ads_leadgen_automation");
  return NextResponse.redirect(url);
}
