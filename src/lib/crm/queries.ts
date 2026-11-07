import type { SupabaseClient } from "@supabase/supabase-js";
import { stageProbability } from "@/lib/kpi";
import { inIstRange, istDateKey } from "@/lib/reports/timezone";

export async function dashboardMetrics(
  supabase: SupabaseClient,
  from: string,
  to: string,
  now = new Date(),
) {
  const [{ data: leads }, { data: tasks }, { data: proposals }, { data: bookings }, { data: stages }] =
    await Promise.all([
      supabase.from("leads").select("*, lead_stages:lead_stages!stage_id(*)").is("archived_at", null),
      supabase.from("tasks").select("*").eq("status", "open"),
      supabase.from("proposals").select("*"),
      supabase.from("bookings").select("*"),
      supabase.from("lead_stages").select("*"),
    ]);

  const inRange = (value: string | null) => inIstRange(value, from, to);
  const today = istDateKey(now);
  const weekStart = istDateKey(new Date(now.getTime() - 6 * 86_400_000));

  const newLeads = (leads ?? []).filter((lead) => inRange(lead.received_at || lead.created_at));
  const newLeadsToday = (leads ?? []).filter((lead) => istDateKey(new Date(lead.received_at || lead.created_at || now.toISOString())) === today);
  const newLeadsWeek = (leads ?? []).filter((lead) => {
    const key = istDateKey(new Date(lead.received_at || lead.created_at || now.toISOString()));
    return key >= weekStart && key <= today;
  });
  const qualified = (leads ?? []).filter((lead) => (lead.lead_stages?.probability ?? 0) >= 0.25);
  const followUpsDueToday = (tasks ?? []).filter(
    (task) => task.type === "follow_up" && task.due_at && istDateKey(new Date(task.due_at)) === today,
  );
  const overdue = (tasks ?? []).filter(
    (task) => task.type === "follow_up" && task.due_at && task.due_at < new Date().toISOString(),
  );
  const activeProposals = (proposals ?? []).filter((item) =>
    ["draft", "sent", "viewed"].includes(item.status),
  );
  const confirmed = (bookings ?? []).filter(
    (booking) =>
      ["confirmed", "completed"].includes(booking.booking_status) && inRange(booking.created_at),
  );
  const recordedRevenue = (bookings ?? [])
    .filter((booking) => booking.booking_status !== "cancelled")
    .reduce(
      (sum, booking) => sum + Number(booking.amount_received ?? booking.amount_paid ?? 0),
      0,
    );
  const activeBookings = (bookings ?? []).filter((booking) => booking.booking_status !== "cancelled");
  const bookingValue = activeBookings.reduce((sum, booking) => sum + Number(booking.confirmed_amount ?? 0), 0);
  const outstandingBalance = activeBookings.reduce((sum, booking) => {
    const due = Number(booking.confirmed_amount ?? 0) - Number(booking.amount_received ?? booking.amount_paid ?? 0);
    return sum + Math.max(0, due);
  }, 0);
  const paymentsOverdue = activeBookings.filter((booking) => {
    const due = Number(booking.confirmed_amount ?? 0) - Number(booking.amount_received ?? booking.amount_paid ?? 0);
    return due > 0 && ["confirmed", "completed"].includes(booking.booking_status);
  }).length;
  const bySource = new Map<string, number>();
  for (const lead of leads ?? []) {
    bySource.set(lead.source ?? "unknown", (bySource.get(lead.source ?? "unknown") ?? 0) + 1);
  }
  const weightedPipelineValue = (leads ?? []).reduce((sum, lead) => {
    const stage = lead.lead_stages;
    if (!stage || stage.is_lost || stage.is_won) return sum;
    const probability = Number(stage.probability ?? stageProbability(stage.slug, false, false));
    return sum + Number(lead.estimated_value ?? 0) * probability;
  }, 0);
  const conversion =
    newLeads.length === 0 ? 0 : confirmed.length / newLeads.length;

  return {
    newLeads: newLeads.length,
    newLeadsToday: newLeadsToday.length,
    newLeadsWeek: newLeadsWeek.length,
    qualifiedLeads: qualified.length,
    followUpsDueToday: followUpsDueToday.length,
    overdueFollowUps: overdue.length,
    activeProposals: activeProposals.length,
    confirmedBookings: confirmed.length,
    paymentsOverdue,
    bookingValue,
    outstandingBalance,
    recordedRevenue,
    weightedPipelineValue,
    leadToBookingConversion: conversion,
    sources: [...bySource.entries()],
    leads: leads ?? [],
    tasks: tasks ?? [],
    stages: stages ?? [],
    bookings: bookings ?? [],
  };
}
