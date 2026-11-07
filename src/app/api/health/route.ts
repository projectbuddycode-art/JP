import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/env";
import { n8nConfig } from "@/lib/n8n/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "northridge",
    supabaseConfigured: hasSupabaseConfig(),
    n8nConfigured: n8nConfig().configured,
    time: new Date().toISOString(),
  });
}
