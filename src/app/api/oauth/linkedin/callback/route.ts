import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerProfile } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const { profile } = await requireOwnerProfile();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const env = serverEnv();
  const cookieStore = await cookies();
  const expected = cookieStore.get("linkedin_oauth_state")?.value;
  cookieStore.delete("linkedin_oauth_state");
  if (!state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/integrations?oauth=invalid_state", env.appUrl));
  }
  if (!code || !env.linkedinClientId || !env.linkedinClientSecret) {
    return NextResponse.redirect(new URL("/integrations?oauth=pending", env.appUrl));
  }
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.appUrl}/api/oauth/linkedin/callback`,
      client_id: env.linkedinClientId,
      client_secret: env.linkedinClientSecret,
    }),
  });
  const json = (await response.json()) as { access_token?: string; error_description?: string };
  const admin = createAdminClient();
  if (!json.access_token) {
    await admin
      .from("integration_connections")
      .update({ status: "error", last_error: json.error_description ?? "LinkedIn OAuth failed" })
      .eq("provider", "linkedin");
    return NextResponse.redirect(new URL("/integrations?oauth=error", env.appUrl));
  }
  await admin.from("integration_secrets").upsert({ provider: "linkedin", payload: { accessToken: json.access_token } });
  await admin
    .from("integration_connections")
    .update({
      status: "pending",
      last_error: "Token stored. Lead Sync still requires approved r_ads_leadgen_automation access and a successful test lead.",
    })
    .eq("provider", "linkedin");
  await writeAudit({ actorId: profile.id, action: "linkedin_oauth_stored", entityType: "integration_connections" });
  return NextResponse.redirect(new URL("/integrations?oauth=stored", env.appUrl));
}
