import { createServerClient } from "@/lib/supabase/server";
import { enrichProfile } from "@/lib/enrichment";
import { buildDraftPrompt } from "@/lib/draft-prompt";
import { generateText } from "@/lib/ai-client";
import { ManualUrlInput } from "@/components/manual-url-input";
import { LeadsPageClient } from "@/app/leads/leads-page-client";
import type { Lead, Draft, ProfileData } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function fetchProfileAction(
  url: string,
): Promise<{ success: boolean; error?: string }> {
  "use server";

  const handleMatch = url.match(/instagram\.com\/([^/?]+)/);
  if (!handleMatch) {
    return { success: false, error: "Invalid Instagram URL" };
  }
  const handle = handleMatch[1];

  try {
    const res = await fetch(
      `https://www.instagram.com/${handle}/?__a=1&__d=dis`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
      },
    );

    if (res.ok) {
      const json = await res.json();
      const user = json?.graphql?.user;
      if (user) {
        const profile: ProfileData = {
          instagram_handle: `@${handle}`,
          display_name: user.full_name || null,
          bio: user.biography || null,
          profile_pic_url: user.profile_pic_url_hd || null,
          follower_count: user.edge_followed_by?.count ?? 0,
          following_count: user.edge_follow?.count ?? 0,
          post_count: user.edge_owner_to_timeline_media?.count ?? 0,
          website_url: user.external_url || null,
        };

        const enriched = enrichProfile(profile, "manual", "manual");
        const supabase = createServerClient();
        const { error } = await supabase
          .from("leads")
          .upsert(enriched, {
            onConflict: "instagram_handle",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        revalidatePath("/leads");
        return { success: true };
      }
    }
  } catch {
    // Public endpoint failed
  }

  return {
    success: false,
    error:
      "Instagram public API blocked. Run the scraper locally to fetch this profile.",
  };
}

async function updateStatusAction(leadId: string, status: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/leads");
}

async function updateNotesAction(leadId: string, notes: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("leads").update({ notes }).eq("id", leadId);
}

async function generateDraftAction(leadId: string): Promise<Draft | null> {
  "use server";
  const supabase = createServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (!lead) return null;

  const prompt = buildDraftPrompt({
    display_name: lead.display_name,
    bio: lead.bio,
    bio_keywords: lead.bio_keywords,
    has_linktree: lead.has_linktree,
    website_url: lead.website_url,
    lead_score: lead.lead_score,
  });

  const content = await generateText(
    "You are a freelance web developer writing a cold outreach DM to a small business on Instagram. Be genuine, not spammy.",
    prompt,
  );

  const { data: draft } = await supabase
    .from("drafts")
    .insert({ lead_id: leadId, channel: "dm", content })
    .select()
    .single();

  return (draft as Draft) ?? null;
}

async function getDraftsAction(leadId: string): Promise<Draft[]> {
  "use server";
  const supabase = createServerClient();
  const { data } = await supabase
    .from("drafts")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  return (data as Draft[]) ?? [];
}

async function markDraftSentAction(draftId: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("drafts").update({ is_sent: true }).eq("id", draftId);
}

export default async function LeadsPage() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads: Lead[] = error ? [] : (data as Lead[]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
            Leads
          </h1>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Manual URL input */}
      <ManualUrlInput onSubmit={fetchProfileAction} />

      {/* Table + Detail Panel */}
      <LeadsPageClient
        leads={leads}
        updateStatusAction={updateStatusAction}
        updateNotesAction={updateNotesAction}
        generateDraftAction={generateDraftAction}
        getDraftsAction={getDraftsAction}
        markDraftSentAction={markDraftSentAction}
      />
    </div>
  );
}
