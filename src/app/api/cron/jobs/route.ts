import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/jobs/auth";
import { runAutomationTick } from "@/lib/automation/tick";
import { logger } from "@/lib/logger";

async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const body = request.method === "POST" ? ((await request.json().catch(() => ({}))) as { action?: string; scheduleKey?: string }) : {};
    const result = await runAutomationTick({
      action: body.action ?? "process_due_jobs",
      scheduleKey: body.scheduleKey,
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("cron_failed", { message: error instanceof Error ? error.message : "cron" });
    return NextResponse.json({ error: "Job processor failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
