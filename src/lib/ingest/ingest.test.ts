import { describe, expect, it } from "vitest";
import { classifyComment, commentCreatesLead, looksLikeTravelEnquiry } from "@/lib/ingest/classify";
import { resolveContactMatch } from "@/lib/ingest/match";
import { mapLinkedInLead } from "@/lib/ingest/adapters/linkedin";
import { mapTikTokLead } from "@/lib/ingest/adapters/tiktok";
import { mapInboundEmail } from "@/lib/ingest/adapters/email";
import { applyMetaLeadFields, mapMetaLeadgenNotice } from "@/lib/ingest/adapters/meta";
import { bearerMatches } from "@/lib/ingest/verify";

describe("enquiry classification", () => {
  it("does not treat every comment as a lead", () => {
    expect(commentCreatesLead(classifyComment("Nice photo"))).toBe(false);
    expect(commentCreatesLead(classifyComment("What is the Spiti package price?"))).toBe(true);
  });

  it("detects WhatsApp trip questions", () => {
    expect(looksLikeTravelEnquiry("Hi")).toBe(false);
    expect(looksLikeTravelEnquiry("Want to book Ladakh in June")).toBe(true);
  });
});

describe("contact matching", () => {
  it("does not merge on name and flags phone/email conflicts", () => {
    const existing = [
      { id: "a", full_name: "Same Name", phone_e164: "+919811112221", email: "a@example.com" },
      { id: "b", full_name: "Same Name", phone_e164: "+919822223331", email: "b@example.com" },
    ];
    const sameName = resolveContactMatch({ phone: null, email: null, existing });
    expect(sameName.contactId).toBeNull();
    const conflict = resolveContactMatch({
      phone: "+919811112221",
      email: "b@example.com",
      existing,
    });
    expect(conflict.ambiguous).toBe(true);
    expect(conflict.contactId).toBe("a");
  });
});

describe("provider adapters", () => {
  it("maps LinkedIn and TikTok lead ids", () => {
    const li = mapLinkedInLead({ leadId: "L1", email: "x@y.com", firstName: "Asha" });
    if ("error" in li) throw new Error(li.error);
    expect(li.event_id).toBe("L1");
    const tt = mapTikTokLead({ lead_id: "T1", data: [{ field_name: "email", field_value: "t@t.com" }] });
    if ("error" in tt) throw new Error(tt.error);
    expect(tt.contact.email).toBe("t@t.com");
  });

  it("does not qualify thread replies as new email leads", () => {
    const mapped = mapInboundEmail({
      messageId: "m1",
      from: "guest@example.com",
      subject: "Spiti dates",
      text: "Can we book Spiti?",
      inReplyTo: "prev",
    });
    if ("error" in mapped) throw new Error(mapped.error);
    expect(mapped.qualify_as_lead).toBe(false);
  });

  it("applies Meta field_data onto a leadgen notice", () => {
    const notice = mapMetaLeadgenNotice({ leadgen_id: "lg1", form_id: "f1" });
    if ("error" in notice) throw new Error(notice.error);
    const full = applyMetaLeadFields(notice, [
      { name: "full_name", values: ["Riya"] },
      { name: "phone_number", values: ["+919833334441"] },
    ]);
    expect(full.contact.full_name).toBe("Riya");
    expect(full.contact.phone).toBe("+919833334441");
  });
});

describe("webhook auth", () => {
  it("rejects missing secrets and mismatched bearers", () => {
    expect(bearerMatches("Bearer abc", undefined).ok).toBe(false);
    expect(bearerMatches("Bearer abc", "abc").ok).toBe(true);
    expect(bearerMatches("Bearer xyz", "abc").ok).toBe(false);
  });
});
