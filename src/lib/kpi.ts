export const KPI_DEFINITIONS = {
  newLeads: "Leads created in the selected date range, excluding archived records.",
  qualifiedLeads:
    "Leads currently in or beyond the Qualified stage, created or updated in range.",
  followUpsDueToday: "Open tasks of type follow_up whose due date is today.",
  overdueFollowUps: "Open follow-up tasks with due_at earlier than now.",
  activeProposals: "Proposals in draft, sent, or viewed status that have not expired.",
  confirmedBookings:
    "Bookings whose booking_status is confirmed or completed in the selected range.",
  recordedRevenue:
    "Sum of amount received on booking payment records (or amount_paid). Promised booking value is excluded.",
  weightedPipelineValue:
    "Sum of estimated_value × stage probability for open leads not in won/lost stages.",
  leadToBookingConversion:
    "Confirmed/completed bookings in range divided by leads created in range.",
  firstTouchAttribution:
    "The first recorded campaign or source associated with the contact.",
  latestTouchAttribution:
    "The most recent campaign or source associated with the converting lead.",
} as const;

export type KpiKey = keyof typeof KPI_DEFINITIONS;

export function stageProbability(slug: string, isWon: boolean, isLost: boolean) {
  if (isLost) return 0;
  if (isWon) return 1;
  const map: Record<string, number> = {
    new_enquiry: 0.05,
    contact_pending: 0.08,
    contacted: 0.12,
    qualified: 0.25,
    trip_requirements_confirmed: 0.35,
    itinerary_shared: 0.45,
    quotation_sent: 0.5,
    follow_up_due: 0.4,
    negotiation: 0.6,
    booking_pending: 0.8,
    confirmed_booking: 1,
    travel_completed: 1,
    lost: 0,
  };
  return map[slug] ?? 0.1;
}
