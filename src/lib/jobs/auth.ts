import { serverEnv } from "@/lib/env";

export function cronUnauthorizedResponse(message: string, status: number) {
  return { ok: false as const, status, message };
}

export function authorizeCronRequest(request: Request) {
  const secret = serverEnv().cronSecret;
  if (!secret) {
    return cronUnauthorizedResponse("CRON_SECRET is not configured", 503);
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return cronUnauthorizedResponse("Unauthorized", 401);
  }
  return { ok: true as const, status: 200, message: "ok" };
}
