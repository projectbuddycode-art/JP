import { Badge, Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { profileRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { formatIst } from "@/lib/reports/timezone";

export const instant = false;

export default async function ApprovalsPage() {
  const { supabase, profile } = await requireActiveProfile();
  if (!["owner", "admin"].includes(profileRole(profile))) redirect("/overview");
  const { data: items } = await supabase.from("approvals").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <div>
      <PageHeader title="Approvals inbox" description="Discounts, refunds, cancellations, and publish requests wait here. Automated actions cannot skip this queue." />
      <div className="space-y-3">
        {(items ?? []).length ? (items ?? []).map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{item.type}</h2>
              <Badge>{item.status ?? "pending"}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{item.entity_type} {item.entity_id} · {formatIst(item.created_at)}</p>
          </Card>
        )) : (
          <Card>No approval requests. Discount, refund, and social publish rules will appear here when submitted.</Card>
        )}
      </div>
    </div>
  );
}
