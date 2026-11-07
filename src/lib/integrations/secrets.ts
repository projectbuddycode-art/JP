import { tryCreateAdminClient } from "@/lib/supabase/admin";

export async function getIntegrationSecret(provider: string) {
  const admin = tryCreateAdminClient();
  if (!admin) return {} as Record<string, string | undefined>;
  const { data } = await admin.from("integration_secrets").select("payload").eq("provider", provider).maybeSingle();
  return (data?.payload ?? {}) as Record<string, string | undefined>;
}

export async function fetchMetaLeadFields(leadgenId: string) {
  const secret = await getIntegrationSecret("meta_social");
  const token = secret.accessToken;
  if (!token) return { fields: [] as Array<{ name?: string; values?: string[] }>, error: "No Page token stored" };
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${leadgenId}?fields=id,created_time,field_data,ad_id,form_id,campaign_id`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const json = (await response.json()) as {
    field_data?: Array<{ name?: string; values?: string[] }>;
    error?: { message: string };
  };
  if (!response.ok) return { fields: [], error: json.error?.message ?? "Lead retrieval failed" };
  return { fields: json.field_data ?? [], error: null };
}

export async function markConnectionError(provider: string, error: string) {
  const admin = tryCreateAdminClient();
  await admin
    ?.from("integration_connections")
    .update({ last_error: error, status: "error" })
    .eq("provider", provider);
}
