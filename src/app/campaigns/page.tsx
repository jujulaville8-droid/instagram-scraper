export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { CampaignList } from "@/components/campaign-list";
import type { Campaign, HashtagConfig } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface CampaignWithStats extends Campaign {
  hashtag?: string | null;
  total: number;
  contacted: number;
  replied: number;
  converted: number;
}

async function createCampaign(
  name: string,
  hashtagConfigId: string | null,
  template: string | null,
): Promise<{ success: boolean; error?: string }> {
  "use server";

  if (!name.trim()) {
    return { success: false, error: "Campaign name is required" };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("campaigns").insert({
    name: name.trim(),
    hashtag_config_id: hashtagConfigId || null,
    template: template?.trim() || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/campaigns");
  return { success: true };
}

async function deleteCampaign(id: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("campaign_leads").delete().eq("campaign_id", id);
  await supabase.from("campaigns").delete().eq("id", id);
  revalidatePath("/campaigns");
}

export default async function CampaignsPage() {
  const supabase = createServerClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: hashtags } = await supabase
    .from("hashtag_configs")
    .select("*")
    .order("hashtag", { ascending: true });

  const hashtagConfigs: HashtagConfig[] = hashtags ?? [];
  const rawCampaigns: Campaign[] = campaigns ?? [];

  // Build stats for each campaign
  const campaignsWithStats: CampaignWithStats[] = [];

  for (const c of rawCampaigns) {
    // Get linked hashtag name
    const linkedHashtag = hashtagConfigs.find((h) => h.id === c.hashtag_config_id);

    // Get leads in this campaign with their statuses
    const { data: campaignLeads } = await supabase
      .from("campaign_leads")
      .select("lead_id")
      .eq("campaign_id", c.id);

    let contacted = 0;
    let replied = 0;
    let converted = 0;
    const total = campaignLeads?.length ?? 0;

    if (campaignLeads && campaignLeads.length > 0) {
      const leadIds = campaignLeads.map((cl) => cl.lead_id);
      const { data: leads } = await supabase
        .from("leads")
        .select("status")
        .in("id", leadIds);

      if (leads) {
        for (const lead of leads) {
          if (lead.status === "contacted") contacted++;
          if (lead.status === "replied") replied++;
          if (lead.status === "converted") converted++;
        }
      }
    }

    campaignsWithStats.push({
      ...c,
      hashtag: linkedHashtag?.hashtag ?? null,
      total,
      contacted,
      replied,
      converted,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CampaignList
        campaigns={campaignsWithStats}
        hashtags={hashtagConfigs}
        createCampaignAction={createCampaign}
        deleteCampaignAction={deleteCampaign}
      />
    </div>
  );
}
