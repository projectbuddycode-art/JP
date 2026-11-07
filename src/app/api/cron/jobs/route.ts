import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { processDueJobs } from "@/lib/jobs/processor";
import { enqueueJob } from "@/lib/jobs/queue";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const secret = serverEnv().cronSecret;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await enqueueJob({
      type: "followup.scan",
      payload: {},
      idempotencyKey: `followup:${new Date().toISOString().slice(0, 13)}`,
    });
    const results = await processDueJobs();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    logger.error("cron_failed", { message: error instanceof Error ? error.message : "cron" });
    return NextResponse.json({ error: "Job processor failed" }, { status: 500 });
  }
}
