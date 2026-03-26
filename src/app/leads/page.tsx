import { createServerClient } from "@/lib/supabase/server";
import { enrichProfile } from "@/lib/enrichment";
import { ManualUrlInput } from "@/components/manual-url-input";
import { LeadsTable } from "@/components/leads-table";
import type { Lead, ProfileData } from "@/lib/types";
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

      {/* Table */}
      <LeadsTable leads={leads} />
    </div>
  );
}
