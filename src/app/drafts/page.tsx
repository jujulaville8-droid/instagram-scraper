export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { DraftList } from "@/components/draft-list";
import type { Draft } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface DraftWithLead extends Draft {
  lead_handle: string;
  lead_name: string | null;
}

async function updateDraft(draftId: string, content: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase
    .from("drafts")
    .update({ content, is_edited: true })
    .eq("id", draftId);
  revalidatePath("/drafts");
}

async function markSent(draftId: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("drafts").update({ is_sent: true }).eq("id", draftId);
  revalidatePath("/drafts");
}

export default async function DraftsPage() {
  const supabase = createServerClient();

  const { data: drafts } = await supabase
    .from("drafts")
    .select("*, leads(instagram_handle, display_name)")
    .order("created_at", { ascending: false });

  const draftsWithLeads: DraftWithLead[] = (drafts ?? []).map((d: Record<string, unknown>) => {
    const lead = d.leads as { instagram_handle: string; display_name: string | null } | null;
    return {
      id: d.id as string,
      created_at: d.created_at as string,
      lead_id: d.lead_id as string,
      campaign_id: d.campaign_id as string | null,
      channel: d.channel as Draft["channel"],
      content: d.content as string,
      is_edited: d.is_edited as boolean,
      is_sent: d.is_sent as boolean,
      lead_handle: lead?.instagram_handle ?? "Unknown",
      lead_name: lead?.display_name ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <DraftList
        drafts={draftsWithLeads}
        updateDraftAction={updateDraft}
        markSentAction={markSent}
      />
    </div>
  );
}
