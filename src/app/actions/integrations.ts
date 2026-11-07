"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import { serverEnv } from "@/lib/env";

export async function saveIntegrationSecretAction(formData: FormData) {
  const { profile } = await requireOwnerProfile();
  const provider = String(formData.get("provider") ?? "");
  const payload = {
    accessToken: String(formData.get("accessToken") || "") || undefined,
    phoneNumberId: String(formData.get("phoneNumberId") || "") || undefined,
    pageId: String(formData.get("pageId") || "") || undefined,
    igUserId: String(formData.get("igUserId") || "") || undefined,
    webhookKey: String(formData.get("webhookKey") || "") || undefined,
    apiKey: String(formData.get("apiKey") || "") || undefined,
  };
  const admin = createAdminClient();
  await admin.from("integration_connections").upsert({
    provider,
    status: "pending",
    display_name: provider,
  });
  await admin.from("integration_secrets").upsert({
    provider,
    payload,
    updated_at: new Date().toISOString(),
  });
  await writeAudit({
    actorId: profile.id,
    action: "integration_credentials_updated",
    entityType: "integration_connections",
    metadata: { provider },
  });
  revalidatePath("/integrations");
}

export async function testIntegrationAction(provider: string) {
  await requireOwnerProfile();
  const admin = createAdminClient();
  const { data: secret } = await admin.from("integration_secrets").select("payload").eq("provider", provider).maybeSingle();
  const payload = (secret?.payload ?? {}) as Record<string, string | undefined>;
  let ok = false;
  let error: string | null = null;
  try {
    if (provider === "whatsapp") {
      if (!payload.accessToken || !payload.phoneNumberId) throw new Error("Missing Cloud API token or phone number id");
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${payload.phoneNumberId}?fields=display_phone_number,verified_name`,
        { headers: { authorization: `Bearer ${payload.accessToken}` } },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "WhatsApp test failed");
      ok = true;
    } else if (provider === "meta_social") {
      if (!payload.accessToken) throw new Error("Missing Page access token");
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${payload.accessToken}`,
      );
      if (!response.ok) throw new Error("Meta token test failed");
      ok = true;
    } else if (provider === "ai") {
      ok = Boolean(serverEnv().openaiKey);
      if (!ok) error = "OPENAI_API_KEY is not set on the server";
    } else if (provider === "google_ads") {
      const ready = Boolean(payload.webhookKey || serverEnv().googleAdsWebhookKey);
      if (!ready) error = "Google Ads webhook key is not configured";
      else error = "Key is stored. Send a Google Ads test lead before this is marked Connected.";
      ok = false;
      await admin.from("integration_connections").update({ status: "pending", last_error: error }).eq("provider", provider);
      revalidatePath("/integrations");
      return;
    } else if (provider === "website_form") {
      const { ingestLead } = await import("@/lib/integrations/process");
      await ingestLead({
        provider: "website_form",
        eventId: `website-test:${Date.now()}`,
        eventType: "website_enquiry",
        isTest: true,
        fullName: "Website test enquiry",
        phone: "+919811112221",
        source: "website",
        destination: "Spiti Valley",
      });
      ok = true;
    } else if (provider === "n8n") {
      const { testN8nConnection } = await import("@/lib/n8n/client");
      const result = await testN8nConnection();
      ok = result.ok;
      error = result.error;
    } else if (provider === "linkedin") {
      error = serverEnv().linkedinClientId
        ? "OAuth client is present. Connected requires Lead Sync approval and a retrieved lead."
        : "Developer access required — awaiting LinkedIn Lead Sync approval.";
      ok = false;
      await admin.from("integration_connections").update({
        status: "pending",
        authorization_status: serverEnv().linkedinClientId ? "authorization_required" : "developer_access_required",
        last_error: error,
      }).eq("provider", provider);
      revalidatePath("/integrations");
      return;
    } else if (provider === "tiktok") {
      error = serverEnv().tiktokAppSecret || serverEnv().tiktokWebhookToken
        ? "Secret is present. Send a TikTok test lead before Connected."
        : "TikTok app secret is not configured.";
      ok = false;
      await admin.from("integration_connections").update({ status: "pending", last_error: error }).eq("provider", provider);
      revalidatePath("/integrations");
      return;
    } else {
      error = "No live test is implemented for this provider yet";
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Test failed";
  }
  await admin
    .from("integration_connections")
    .update({
      status: ok ? "connected" : "error",
      last_success_at: ok ? new Date().toISOString() : undefined,
      last_error: error,
    })
    .eq("provider", provider);
  revalidatePath("/integrations");
}

export async function retryIntegrationEventAction(formData: FormData) {
  await requireOwnerProfile();
  const id = String(formData.get("event_id") || "");
  const { retryIntegrationEvent } = await import("@/lib/integrations/process");
  await retryIntegrationEvent(id);
  revalidatePath("/integrations/delivery");
}

export async function disconnectIntegrationAction(provider: string) {
  await requireOwnerProfile();
  const admin = createAdminClient();
  await admin.from("integration_secrets").delete().eq("provider", provider);
  await admin
    .from("integration_connections")
    .update({ status: "not_configured", last_error: null })
    .eq("provider", provider);
  revalidatePath("/integrations");
}
