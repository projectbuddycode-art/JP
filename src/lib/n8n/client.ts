import { serverEnv } from "@/lib/env";

export function n8nConfig() {
  const env = serverEnv();
  return {
    baseUrl: env.n8nBaseUrl?.replace(/\/$/, ""),
    apiKey: env.n8nApiKey,
    configured: Boolean(env.n8nBaseUrl && env.n8nApiKey),
  };
}

export async function testN8nConnection() {
  const { baseUrl, apiKey, configured } = n8nConfig();
  if (!configured || !baseUrl || !apiKey) {
    return { ok: false, error: "N8N_BASE_URL and N8N_API_KEY are not configured" };
  }
  try {
    const response = await fetch(`${baseUrl}/api/v1/workflows?limit=1`, {
      headers: { "X-N8N-API-KEY": apiKey },
    });
    if (!response.ok) {
      return { ok: false, error: `n8n responded ${response.status}` };
    }
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "n8n unreachable" };
  }
}

export async function listN8nWorkflows() {
  const { baseUrl, apiKey, configured } = n8nConfig();
  if (!configured || !baseUrl || !apiKey) {
    return { workflows: [], error: "n8n is not connected" };
  }
  const response = await fetch(`${baseUrl}/api/v1/workflows`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (!response.ok) return { workflows: [], error: `n8n responded ${response.status}` };
  const json = (await response.json()) as { data?: unknown[] };
  return { workflows: json.data ?? [], error: null };
}

export async function listN8nExecutions(limit = 10) {
  const { baseUrl, apiKey, configured } = n8nConfig();
  if (!configured || !baseUrl || !apiKey) {
    return { executions: [], error: "n8n is not connected" };
  }
  const response = await fetch(`${baseUrl}/api/v1/executions?limit=${limit}`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (!response.ok) return { executions: [], error: `n8n responded ${response.status}` };
  const json = (await response.json()) as { data?: unknown[] };
  return { executions: json.data ?? [], error: null };
}

export async function setN8nWorkflowActive(id: string, active: boolean) {
  const { baseUrl, apiKey, configured } = n8nConfig();
  if (!configured || !baseUrl || !apiKey) {
    throw new Error("n8n is not connected");
  }
  const response = await fetch(`${baseUrl}/api/v1/workflows/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (!response.ok) throw new Error(`n8n responded ${response.status}`);
}

export async function runN8nTest(webhookPath: string, payload: Record<string, unknown>) {
  const { baseUrl, configured } = n8nConfig();
  if (!configured || !baseUrl) throw new Error("n8n is not connected");
  if (!webhookPath.startsWith("http")) {
    throw new Error("Use a full HTTPS webhook URL from n8n");
  }
  const response = await fetch(webhookPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, ok: response.ok };
}
