"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { updateLeadStageAction } from "@/app/actions/crm";
import { Badge } from "@/components/ui";
import { daysBetween } from "@/lib/utils";

type Stage = { id: string; name: string; slug: string; is_lost: boolean; is_won: boolean };
type Lead = {
  id: string;
  full_name: string | null;
  destination: string | null;
  priority: string;
  next_follow_up_at: string | null;
  created_at: string;
  stage_id: string;
  estimated_value: number | null;
};

export function PipelineBoard({ stages, leads }: { stages: Stage[]; leads: Lead[] }) {
  const [items, setItems] = useOptimistic(leads);
  const [, startTransition] = useTransition();

  function onDrop(stageId: string, leadId: string) {
    startTransition(async () => {
      setItems((current) => current.map((lead) => (lead.id === leadId ? { ...lead, stage_id: stageId } : lead)));
      await updateLeadStageAction(leadId, stageId);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const column = items.filter((lead) => lead.stage_id === stage.id);
        return (
          <section
            key={stage.id}
            className="w-72 shrink-0 rounded-xl border border-line bg-surface p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const leadId = event.dataTransfer.getData("text/lead-id");
              if (leadId) onDrop(stage.id, leadId);
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">{stage.name}</h2>
              <Badge>{column.length}</Badge>
            </div>
            <div className="space-y-2">
              {column.map((lead) => {
                const overdue = lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date();
                return (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/lead-id", lead.id)}
                    className="cursor-grab rounded-lg border border-line bg-background p-3"
                  >
                    <Link href={`/leads/${lead.id}`} className="font-medium">
                      {lead.full_name ?? "Unnamed"}
                    </Link>
                    <p className="text-xs text-muted">{lead.destination ?? "No destination"}</p>
                    <p className="mt-2 text-xs text-muted">{daysBetween(lead.created_at)}d in pipeline</p>
                    {overdue ? <p className="mt-1 text-xs text-danger">Follow-up overdue</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
