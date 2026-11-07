"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireActiveProfile } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/phone";
import { findDuplicateMatches } from "@/lib/crm/duplicates";

const FIELD_MAP = {
  name: ["name", "full_name", "full name"],
  phone: ["phone", "mobile", "whatsapp"],
  email: ["email"],
  destination: ["destination", "trip"],
  source: ["source"],
  travellers: ["travellers", "pax"],
  budget: ["budget", "budget_max"],
};

function pick(row: Record<string, string>, keys: string[]) {
  const entries = Object.entries(row);
  for (const [key, value] of entries) {
    if (keys.includes(key.trim().toLowerCase())) return value?.trim();
  }
  return "";
}

export async function importLeadsCsvAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Upload a CSV file", created: 0, duplicates: 0, invalid: 0 };
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const { data: contacts } = await supabase.from("contacts").select("id, full_name, phone_e164, email");
  let created = 0;
  let duplicates = 0;
  let invalid = 0;
  const report: string[] = [];

  for (const [index, row] of parsed.data.entries()) {
    const fullName = pick(row, FIELD_MAP.name);
    const phone = normalizePhone(pick(row, FIELD_MAP.phone));
    const email = pick(row, FIELD_MAP.email).toLowerCase() || null;
    if (!fullName && !phone && !email) {
      invalid += 1;
      report.push(`Row ${index + 2}: missing identity fields`);
      continue;
    }
    const matches = findDuplicateMatches({ phone_e164: phone, email }, contacts ?? []);
    if (matches.length) duplicates += 1;
    const { ingestLead } = await import("@/lib/integrations/process");
    try {
      await ingestLead({
        provider: "csv_import",
        eventId: `csv:${profile.id}:${index}:${phone || email || fullName}`,
        eventType: "csv_import",
        fullName,
        email,
        phone,
        destination: pick(row, FIELD_MAP.destination) || null,
        source: pick(row, FIELD_MAP.source) || "csv_import",
        travellers: Number(pick(row, FIELD_MAP.travellers)) || null,
        assignedOwnerId: profile.id,
      });
      created += 1;
    } catch (error) {
      invalid += 1;
      report.push(`Row ${index + 2}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  revalidatePath("/leads");
  return { error: null, created, duplicates, invalid, report };
}

export async function exportLeadsCsvAction() {
  const { supabase } = await requireActiveProfile();
  const { data } = await supabase
    .from("leads")
    .select("full_name, phone_e164, email, destination, source, travellers, budget_max, created_at")
    .is("archived_at", null)
    .limit(5000);
  return Papa.unparse(data ?? []);
}

export async function archiveLeadAction(leadId: string) {
  const { supabase } = await requireActiveProfile();
  await supabase.from("leads").update({ archived_at: new Date().toISOString() }).eq("id", leadId);
  revalidatePath("/leads");
}
