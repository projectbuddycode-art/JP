import { NextResponse } from "next/server";
import { requireActiveProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { buildLeadRegister } from "@/lib/reports/intelligence";

export async function GET(request: Request) {
  const { supabase, profile } = await requireActiveProfile();
  if (!can(profile, "records.export") && !can(profile, "leads.view_all")) {
    return NextResponse.json({ error: "Export is not permitted for this role." }, { status: 403 });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") || from;
  const { data: leads } = await supabase.from("leads").select("*, lead_stages(*)").is("archived_at", null).limit(1000);
  const rows = buildLeadRegister(leads ?? [], from, to);
  const header = ["id", "name", "received_at", "source", "destination", "stage", "owner_id"];
  const csv = [
    header.join(","),
    ...rows.map((lead) =>
      [
        lead.id,
        JSON.stringify(lead.full_name ?? ""),
        lead.received_at || lead.created_at,
        lead.source ?? "",
        lead.destination ?? "",
        lead.lead_stages?.name || lead.stage?.name || "",
        lead.owner_id ?? "",
      ].join(","),
    ),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="lead-register-${from}-${to}.csv"`,
    },
  });
}
