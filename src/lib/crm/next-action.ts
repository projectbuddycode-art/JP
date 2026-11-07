export type LeadContext = {
  stageSlug: string;
  hasPhone: boolean;
  hasEmail: boolean;
  lastInteractionAt: string | null;
  nextFollowUpAt: string | null;
  hasQuote: boolean;
  quoteStatus?: string | null;
  missingFields: string[];
  consentMarketing: boolean;
  staleDays: number;
  isLost: boolean;
  isWon: boolean;
};

export function suggestNextAction(lead: LeadContext) {
  if (lead.isLost) {
    return {
      action: "Review lost reason and consider a later re-engagement task.",
      intent: "low" as const,
    };
  }
  if (lead.isWon) {
    return {
      action: "Confirm operational notes and schedule post-trip follow-up.",
      intent: "medium" as const,
    };
  }
  if (lead.missingFields.includes("travel_dates") || lead.missingFields.includes("travellers")) {
    return {
      action: "Collect missing trip requirements before sending a package.",
      intent: "high" as const,
    };
  }
  if (lead.stageSlug === "new_enquiry" || lead.stageSlug === "contact_pending") {
    return {
      action: lead.hasPhone
        ? "Make first contact and log the outcome."
        : "Request a reachable phone or WhatsApp number.",
      intent: "high" as const,
    };
  }
  if (lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= new Date()) {
    return {
      action: "Follow-up is overdue. Contact the traveller today.",
      intent: "high" as const,
    };
  }
  if (lead.hasQuote && lead.quoteStatus === "sent") {
    return {
      action: "Proposal is awaiting a decision. Follow up on questions and dates.",
      intent: "high" as const,
    };
  }
  if (lead.staleDays >= 7) {
    return {
      action: "Lead is stale. Send a re-engagement message if consent allows.",
      intent: "medium" as const,
    };
  }
  if (lead.stageSlug === "qualified" || lead.stageSlug === "trip_requirements_confirmed") {
    return {
      action: "Share a matching published package and confirm budget.",
      intent: "medium" as const,
    };
  }
  return {
    action: "Log the latest interaction and set the next follow-up.",
    intent: "low" as const,
  };
}
