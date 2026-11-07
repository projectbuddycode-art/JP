export type ConsentState = {
  marketingOptIn: boolean;
  transactionalAllowed: boolean;
  suppressed: boolean;
};

export type MessagingWindow = {
  lastCustomerMessageAt: string | null;
  now?: Date;
};

export function withinCustomerServiceWindow(window: MessagingWindow) {
  if (!window.lastCustomerMessageAt) return false;
  const now = window.now ?? new Date();
  const last = new Date(window.lastCustomerMessageAt);
  return now.getTime() - last.getTime() <= 24 * 60 * 60 * 1000;
}

export function canSendWhatsApp(input: {
  connected: boolean;
  templateApproved?: boolean;
  messageKind: "session" | "template" | "marketing";
  consent: ConsentState;
  window: MessagingWindow;
  humanTakeover: boolean;
}) {
  if (!input.connected) {
    return { allowed: false, reason: "WhatsApp provider is not connected" };
  }
  if (input.consent.suppressed && input.messageKind === "marketing") {
    return { allowed: false, reason: "Recipient is on the suppression list" };
  }
  if (input.humanTakeover && input.messageKind !== "session") {
    return { allowed: false, reason: "Automation is paused after human takeover" };
  }
  if (input.messageKind === "marketing" && !input.consent.marketingOptIn) {
    return { allowed: false, reason: "Marketing opt-in is required" };
  }
  if (input.messageKind === "session") {
    if (!input.consent.transactionalAllowed) {
      return { allowed: false, reason: "No consent to message this contact" };
    }
    if (!withinCustomerServiceWindow(input.window)) {
      return {
        allowed: false,
        reason: "Customer service window is closed; an approved template is required",
      };
    }
  }
  if (input.messageKind === "template" && !input.templateApproved) {
    return { allowed: false, reason: "Selected template is not approved" };
  }
  return { allowed: true, reason: null };
}

export function isOptOutText(body: string) {
  const normalized = body.trim().toUpperCase();
  return ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(normalized);
}
