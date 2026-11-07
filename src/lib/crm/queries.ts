import type { SupabaseClient } from "@supabase/supabase-js";
import { stageProbability } from "@/lib/kpi";

export async function dashboardMetrics(
  supabase: SupabaseClient,
  from: string,
  to: string,
) {
  const [{ data: leads }, { data: tasks }, { data: proposals }, { data: bookings }, { data: stages }] =
    await Promise.all([
      supabase.from("leads").select("*, lead_stages:lead_stages!stage_id(*)").is("archived_at", null),
      supabase.from("tasks").select("*").eq("status", "open"),
      supabase.from("proposals").select("*"),
      supabase.from("bookings").select("*"),
      supabase.from("lead_stages").select("*"),
    ]);

  const inRange = (value: string | null) => {
    if (!value) return false;
    return value >= from && value <= `${to}T23:59:59`;
  };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = start.toISOString();

  const newLeads = (leads ?? []).filter((lead) => inRange(lead.created_at));
  const qualified = (leads ?? []).filter((lead) => (lead.lead_stages?.probability ?? 0) >= 0.25);
  const followUpsDueToday = (tasks ?? []).filter(
    (task) => task.type === "follow_up" && task.due_at && task.due_at.slice(0, 10) === today.slice(0, 10),
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
  const paymentsOverdue = (bookings ?? []).filter((booking) => {
    if (booking.booking_status === "cancelled") return false;
    const due = Number(booking.confirmed_amount ?? 0) - Number(booking.amount_received ?? booking.amount_paid ?? 0);
    return due > 0 && ["confirmed", "completed"].includes(booking.booking_status);
  }).length;
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
    qualifiedLeads: qualified.length,
    followUpsDueToday: followUpsDueToday.length,
    overdueFollowUps: overdue.length,
    activeProposals: activeProposals.length,
    confirmedBookings: confirmed.length,
    paymentsOverdue,
    recordedRevenue,
    weightedPipelineValue,
    leadToBookingConversion: conversion,
    leads: leads ?? [],
    tasks: tasks ?? [],
    stages: stages ?? [],
  };
}
