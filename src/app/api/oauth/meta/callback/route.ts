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
  const expected = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");
  if (!state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/integrations?oauth=invalid_state", env.appUrl));
  }
  if (!code || !env.metaAppId || !env.metaAppSecret) {
    return NextResponse.redirect(new URL("/integrations?oauth=pending", env.appUrl));
  }
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", env.metaAppId);
  tokenUrl.searchParams.set("client_secret", env.metaAppSecret);
  tokenUrl.searchParams.set("redirect_uri", `${env.appUrl}/api/oauth/meta/callback`);
  tokenUrl.searchParams.set("code", code);
  const response = await fetch(tokenUrl);
  const json = (await response.json()) as { access_token?: string; error?: { message: string } };
  if (!json.access_token) {
    const admin = createAdminClient();
    await admin
      .from("integration_connections")
      .update({ status: "error", last_error: json.error?.message ?? "OAuth exchange failed" })
      .eq("provider", "meta_social");
    return NextResponse.redirect(new URL("/integrations?oauth=error", env.appUrl));
  }
  const admin = createAdminClient();
  await admin.from("integration_secrets").upsert({
    provider: "meta_social",
    payload: { accessToken: json.access_token },
  });
  await admin
    .from("integration_connections")
    .update({ status: "pending", last_error: "Token stored. Run Test connection after selecting Page and IG ids." })
    .eq("provider", "meta_social");
  await writeAudit({ actorId: profile.id, action: "meta_oauth_connected", entityType: "integration_connections" });
  return NextResponse.redirect(new URL("/integrations?oauth=stored", env.appUrl));
}
