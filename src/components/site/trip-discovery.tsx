"use client";

import { useMemo, useState } from "react";
import { TripCard } from "@/components/site/trip-card";
import type { PublicPackage } from "@/lib/site/types";

const FILTERS = [
  { id: "all", label: "All trips" },
  { id: "group", label: "Group departures" },
  { id: "private", label: "Private journeys" },
  { id: "adventure", label: "Adventure" },
  { id: "custom", label: "Custom trips" },
] as const;

function matches(pack: PublicPackage, filter: string) {
  const type = (pack.trip_type ?? "").toLowerCase();
  const difficulty = (pack.difficulty ?? "").toLowerCase();
  if (filter === "all") return true;
  if (filter === "group") return type.includes("group");
  if (filter === "private") return type.includes("private");
  if (filter === "custom") return type.includes("custom");
  if (filter === "adventure") return type.includes("adventure") || difficulty.includes("challenging") || difficulty.includes("moderate");
  return true;
}

export function TripDiscovery({ packages }: { packages: PublicPackage[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const rows = useMemo(() => packages.filter((pack) => matches(pack, filter)), [packages, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.18em] ${
              filter === item.id ? "bg-[#c4a574] text-[#111]" : "border border-white/20 text-white/70"
            }`}
            aria-pressed={filter === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.length ? rows.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
          <p className="text-white/50">No published trips match this view.</p>
        )}
      </div>
    </div>
  );
}
