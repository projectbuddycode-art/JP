import { createAdminClient } from "@/lib/supabase/admin";

export async function scanFollowUps() {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: overdue } = await admin
    .from("tasks")
    .select("id, title, assigned_to, lead_id")
    .eq("status", "open")
    .eq("type", "follow_up")
    .lte("due_at", now)
    .limit(50);

  for (const task of overdue ?? []) {
    if (!task.assigned_to) continue;
    await admin.from("notifications").insert({
      profile_id: task.assigned_to,
      title: "Overdue follow-up",
      body: task.title,
      href: task.lead_id ? `/leads/${task.lead_id}` : "/leads",
    });
  }
  return { notified: overdue?.length ?? 0 };
}
