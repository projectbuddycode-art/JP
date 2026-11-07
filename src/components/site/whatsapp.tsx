"use client";

import { trackSiteEventAction } from "@/app/actions/public";

export function WhatsAppLink({ number, path }: { number: string; path: string }) {
  const href = `https://wa.me/${number.replace(/\D/g, "")}`;
  return (
    <a
      href={href}
      rel="noreferrer"
      onClick={() => {
        const data = new FormData();
        data.set("event_name", "whatsapp_click");
        data.set("path", path);
        void trackSiteEventAction(data);
      }}
    >
      WhatsApp
    </a>
  );
}
