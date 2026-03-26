export const dynamic = 'force-dynamic';

import { createServerClient } from "@/lib/supabase/server";
import { HashtagList } from "@/components/hashtag-list";
import type { HashtagConfig } from "@/lib/types";
import { revalidatePath } from "next/cache";

async function addHashtag(
  hashtag: string,
  marketLabel: string,
): Promise<{ success: boolean; error?: string }> {
  "use server";

  const cleaned = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
  if (cleaned.length < 2) {
    return { success: false, error: "Hashtag is too short" };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("hashtag_configs")
    .insert({ hashtag: cleaned.toLowerCase(), market_label: marketLabel, is_active: true });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Hashtag already exists" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/hashtags");
  return { success: true };
}

async function toggleActive(id: string, isActive: boolean): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("hashtag_configs").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/hashtags");
}

async function deleteHashtag(id: string): Promise<void> {
  "use server";
  const supabase = createServerClient();
  await supabase.from("hashtag_configs").delete().eq("id", id);
  revalidatePath("/hashtags");
}

export default async function HashtagsPage() {
  const supabase = createServerClient();

  const { data: hashtags } = await supabase
    .from("hashtag_configs")
    .select("*")
    .order("created_at", { ascending: false });

  const hashtagConfigs: HashtagConfig[] = hashtags ?? [];

  // Get lead counts per hashtag
  const leadCounts: Record<string, number> = {};
  if (hashtagConfigs.length > 0) {
    const hashtagNames = hashtagConfigs.map((h) => h.hashtag);
    const { data: leads } = await supabase
      .from("leads")
      .select("source_hashtag")
      .in("source_hashtag", hashtagNames);

    if (leads) {
      for (const lead of leads) {
        if (lead.source_hashtag) {
          leadCounts[lead.source_hashtag] = (leadCounts[lead.source_hashtag] ?? 0) + 1;
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <HashtagList
        hashtags={hashtagConfigs}
        leadCounts={leadCounts}
        addHashtagAction={addHashtag}
        toggleActiveAction={toggleActive}
        deleteHashtagAction={deleteHashtag}
      />
    </div>
  );
}
