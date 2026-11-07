"use client";

import { useEffect, useSyncExternalStore } from "react";

const KEY = "northridge-analytics-consent";
const listeners = new Set<() => void>();

function emitConsent() {
  listeners.forEach((listener) => listener());
}

function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function consentSnapshot(): "unknown" | "yes" | "no" {
  const stored = window.localStorage.getItem(KEY);
  return stored === "yes" || stored === "no" ? stored : "unknown";
}

export function ConsentAnalytics({
  ga4,
  pixel,
}: {
  ga4?: string;
  pixel?: string;
}) {
  const enabled = Boolean(ga4 || pixel);
  const consent = useSyncExternalStore(subscribeConsent, consentSnapshot, () => "unknown" as const);

  useEffect(() => {
    if (consent !== "yes") return;
    if (ga4) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
      script.async = true;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", ga4, { anonymize_ip: true });
    }
    if (pixel) {
      window.fbq =
        window.fbq ||
        function fbq(...args: unknown[]) {
          (window.fbq.q = window.fbq.q || []).push(args);
        };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.async = true;
      document.head.appendChild(script);
      window.fbq("init", pixel);
      window.fbq("track", "PageView");
    }
  }, [consent, ga4, pixel]);

  if (!enabled || consent !== "unknown") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-[#0c0f12] px-4 py-3 text-sm text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-white/70">
          Analytics cookies load only if you accept. Enquiry forms work without them.
        </p>
        <div className="flex gap-2">
          <button
            className="border border-white/30 px-3 py-1.5"
            onClick={() => {
              window.localStorage.setItem(KEY, "no");
              emitConsent();
            }}
          >
            Decline
          </button>
          <button
            className="bg-[#c4a574] px-3 py-1.5 text-[#111]"
            onClick={() => {
              window.localStorage.setItem(KEY, "yes");
              emitConsent();
            }}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}
