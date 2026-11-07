import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { KPI_DEFINITIONS } from "@/lib/kpi";
import { formatCurrency } from "@/lib/utils";

export const instant = false;

export default async function CampaignsPage() {
  const { supabase } = await requireActiveProfile();
  const { data: campaigns } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  const { data: leads } = await supabase.from("leads").select("id, campaign_id, stage_id, estimated_value");
  const { data: bookings } = await supabase.from("bookings").select("campaign_id, confirmed_amount, booking_status");
  const { data: stages } = await supabase.from("lead_stages").select("id, slug, probability");
  const qualifiedIds = new Set((stages ?? []).filter((stage) => Number(stage.probability) >= 0.25).map((stage) => stage.id));

  return (
    <div>
      <PageHeader
        title="Campaigns & attribution"
        description={`${KPI_DEFINITIONS.firstTouchAttribution} ${KPI_DEFINITIONS.latestTouchAttribution} Spend and revenue appear only when recorded.`}
      />
      {!campaigns?.length ? (
        <EmptyState title="No campaigns" body="Create a campaign record when you launch ads or seasonal offers. Numbers stay empty until data exists." />
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const campaignLeads = (leads ?? []).filter((lead) => lead.campaign_id === campaign.id);
            const qualified = campaignLeads.filter((lead) => qualifiedIds.has(lead.stage_id)).length;
            const campaignBookings = (bookings ?? []).filter(
              (booking) => booking.campaign_id === campaign.id && ["confirmed", "completed"].includes(booking.booking_status),
            );
            const revenue = campaignBookings.reduce((sum, booking) => sum + Number(booking.confirmed_amount ?? 0), 0);
            const spend = campaign.recorded_spend == null ? null : Number(campaign.recorded_spend);
            const cpl = spend != null && campaignLeads.length ? spend / campaignLeads.length : null;
            return (
              <Card key={campaign.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-serif text-2xl">{campaign.name}</h2>
                    <p className="text-sm text-muted">{campaign.destination} · {campaign.platform ?? campaign.source}</p>
                  </div>
                  <Badge>{campaign.platform ?? "offline"}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div><dt className="text-muted">Leads</dt><dd>{campaignLeads.length}</dd></div>
                  <div><dt className="text-muted">Qualified</dt><dd>{qualified}</dd></div>
                  <div><dt className="text-muted">Bookings</dt><dd>{campaignBookings.length}</dd></div>
                  <div><dt className="text-muted">Recorded revenue</dt><dd>{formatCurrency(revenue)}</dd></div>
                  <div><dt className="text-muted">Recorded spend</dt><dd>{spend == null ? "Not recorded" : formatCurrency(spend)}</dd></div>
                  <div><dt className="text-muted">Cost per lead</dt><dd>{cpl == null ? "Unavailable" : formatCurrency(cpl)}</dd></div>
                </dl>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
