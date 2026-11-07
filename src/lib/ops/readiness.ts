export const CHECKLIST_TEMPLATE = [
  { key: "traveller_list", label: "Traveller list completed", group: "customers", critical: true },
  { key: "contacts_verified", label: "Customer contacts verified", group: "customers", critical: false },
  { key: "emergency_contacts", label: "Emergency contacts recorded", group: "customers", critical: true },
  { key: "documents_checked", label: "Required documents checked", group: "customers", critical: false },
  { key: "payments_checked", label: "Payments checked", group: "finance", critical: true },
  { key: "itinerary_shared", label: "Itinerary shared", group: "customers", critical: false },
  { key: "vehicles_assigned", label: "Vehicles assigned", group: "transport", critical: true },
  { key: "driver_confirmed", label: "Driver confirmed", group: "transport", critical: true },
  { key: "pickup_confirmed", label: "Pickup details confirmed", group: "transport", critical: false },
  { key: "transport_cost", label: "Transport cost recorded", group: "finance", critical: false },
  { key: "hotel_confirmed", label: "Hotel/homestay confirmed", group: "accommodation", critical: true },
  { key: "rooms_allocated", label: "Room allocation completed", group: "accommodation", critical: false },
  { key: "checkin_recorded", label: "Check-in information recorded", group: "accommodation", critical: false },
  { key: "trip_leader", label: "Trip leader assigned", group: "operations", critical: true },
  { key: "guide_confirmed", label: "Local guide confirmed", group: "operations", critical: false },
  { key: "activities_confirmed", label: "Activities confirmed", group: "operations", critical: false },
  { key: "ops_reviewed", label: "Required operational information reviewed", group: "operations", critical: false },
  { key: "customer_outstanding", label: "Customer outstanding amounts reviewed", group: "finance", critical: false },
  { key: "supplier_advances", label: "Supplier advances recorded", group: "finance", critical: false },
  { key: "costs_reviewed", label: "Expected trip costs reviewed", group: "finance", critical: false },
] as const;

export function readinessStatus(
  items: Array<{ item_key?: string; key?: string; critical?: boolean; completed?: boolean }>,
) {
  const rows = items.map((item) => ({
    key: item.item_key || item.key || "",
    critical: Boolean(item.critical),
    completed: Boolean(item.completed),
  }));
  const criticalMissing = rows.filter((item) => item.critical && !item.completed);
  if (criticalMissing.length) {
    return rows.some((item) => item.completed) ? "needs_attention" : "not_ready";
  }
  const done = rows.filter((item) => item.completed).length;
  if (!rows.length) return "not_ready";
  if (done === rows.length) return "ready";
  if (done >= rows.length - 2) return "almost_ready";
  return "needs_attention";
}

export const READINESS_LABEL: Record<string, string> = {
  not_ready: "Not ready",
  needs_attention: "Needs attention",
  almost_ready: "Almost ready",
  ready: "Ready for departure",
};
