"use client";

import { useMemo, useState } from "react";
import { TripCard } from "@/components/site/trip-card";
import type { PublicDeparture, PublicPackage } from "@/lib/site/types";

const TYPES = [
  { id: "all", label: "All trips" },
  { id: "group", label: "Group" },
  { id: "private", label: "Private" },
  { id: "adventure", label: "Adventure" },
  { id: "custom", label: "Custom" },
] as const;

function durationBucket(days?: number | null) {
  if (!days) return "unknown";
  if (days <= 4) return "short";
  if (days <= 8) return "mid";
  return "long";
}

export function TripDiscovery({
  packages,
  departures = [],
}: {
  packages: PublicPackage[];
  departures?: PublicDeparture[];
}) {
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("all");
  const [destination, setDestination] = useState("all");
  const [duration, setDuration] = useState("all");
  const [price, setPrice] = useState("all");
  const [month, setMonth] = useState("all");
  const destinations = useMemo(
    () => Array.from(new Set(packages.map((item) => item.destination))).sort(),
    [packages],
  );
  const months = useMemo(
    () => Array.from(new Set(departures.map((item) => item.start_date.slice(0, 7)))).sort(),
    [departures],
  );
  const byPackage = useMemo(() => {
    const map = new Map<string, PublicDeparture[]>();
    for (const row of departures) {
      if (!row.package_id) continue;
      map.set(row.package_id, [...(map.get(row.package_id) ?? []), row]);
    }
    return map;
  }, [departures]);

  const rows = useMemo(() => {
    return packages.filter((pack) => {
      const tripType = (pack.trip_type ?? "").toLowerCase();
      const difficulty = (pack.difficulty ?? "").toLowerCase();
      if (type === "group" && !tripType.includes("group")) return false;
      if (type === "private" && !tripType.includes("private")) return false;
      if (type === "custom" && !tripType.includes("custom")) return false;
      if (type === "adventure" && !(tripType.includes("adventure") || difficulty.includes("challenging") || difficulty.includes("moderate"))) return false;
      if (destination !== "all" && pack.destination !== destination) return false;
      if (duration !== "all" && durationBucket(pack.duration_days) !== duration) return false;
      if (price === "listed" && (pack.price_per_person == null || pack.price_visibility === "request_quote" || pack.price_visibility === "contact")) return false;
      if (price === "request" && pack.price_visibility !== "request_quote" && pack.price_visibility !== "contact" && pack.price_per_person != null) return false;
      if (month !== "all") {
        const listed = byPackage.get(pack.id) ?? [];
        if (!listed.some((item) => item.start_date.startsWith(month))) return false;
      }
      return true;
    });
  }, [packages, type, destination, duration, price, month, byPackage]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setType(item.id)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold ${
              type === item.id ? "bg-[#12324d] text-white" : "bg-white text-[#3d5364] shadow-sm"
            }`}
            aria-pressed={type === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <select className="site-input" value={destination} onChange={(event) => setDestination(event.target.value)}>
          <option value="all">All destinations</option>
          {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="site-input" value={duration} onChange={(event) => setDuration(event.target.value)}>
          <option value="all">Any duration</option>
          <option value="short">1–4 days</option>
          <option value="mid">5–8 days</option>
          <option value="long">9+ days</option>
        </select>
        <select className="site-input" value={price} onChange={(event) => setPrice(event.target.value)}>
          <option value="all">Any price display</option>
          <option value="listed">Listed starting price</option>
          <option value="request">Price on request</option>
        </select>
        <select className="site-input" value={month} onChange={(event) => setMonth(event.target.value)}>
          <option value="all">Any departure month</option>
          {months.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.length ? rows.map((pack) => {
          const next = (byPackage.get(pack.id) ?? [])[0];
          return (
            <TripCard
              key={pack.id}
              pack={pack}
              departureDate={next?.start_date}
              seatsRemaining={next?.seats_remaining ?? null}
            />
          );
        }) : (
          <p className="text-[#5d6d7a]">No published trips match this view.</p>
        )}
      </div>
    </div>
  );
}
