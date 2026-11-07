import { PageHeader } from "@/components/ui";
import { PipelineBoard } from "@/components/pipeline-board";
import { requireActiveProfile } from "@/lib/auth/session";

export const instant = false;

export default async function PipelinePage() {
  const { supabase } = await requireActiveProfile();
  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase.from("lead_stages").select("*").order("sort_order"),
    supabase.from("leads").select("*").is("archived_at", null),
  ]);
  return (
    <div>
      <PageHeader
        title="Sales pipeline"
        description="Drag a card to change stage. Required fields are enforced on the server. Confirmed booking is never inferred from a message send."
      />
      <PipelineBoard stages={stages ?? []} leads={leads ?? []} />
    </div>
  );
}
