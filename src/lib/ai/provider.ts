import { serverEnv } from "@/lib/env";

export function aiStatus() {
  const env = serverEnv();
  if (env.aiProvider === "openai" && env.openaiKey) {
    return { configured: true, provider: "openai" as const };
  }
  return { configured: false, provider: env.aiProvider };
}

export async function generateCopy(prompt: string) {
  const env = serverEnv();
  if (!env.openaiKey) {
    return {
      ok: false as const,
      text: null,
      reason: "AI provider credentials are not configured",
    };
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.openaiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You write editable marketing copy for a Himalayan travel business. Never invent prices, permits, availability, weather, or customer testimonials. Flag unknowns.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    return { ok: false as const, text: null, reason: json.error?.message ?? "AI request failed" };
  }
  return { ok: true as const, text: json.choices?.[0]?.message?.content ?? "", reason: null };
}
