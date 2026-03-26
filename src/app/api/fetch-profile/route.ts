import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../auth';
import { enrichProfile } from '@/lib/enrichment';
import { createServerClient } from '@/lib/supabase/server';
import type { ProfileData } from '@/lib/types';

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { url } = body as { url: string };

  const handleMatch = url.match(/instagram\.com\/([^/?]+)/);
  if (!handleMatch) {
    return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
  }
  const handle = handleMatch[1];

  try {
    const res = await fetch(`https://www.instagram.com/${handle}/?__a=1&__d=dis`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });

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

        const enriched = enrichProfile(profile, 'manual', 'manual');
        const supabase = createServerClient();
        const { data, error } = await supabase
          .from('leads')
          .upsert(enriched, { onConflict: 'instagram_handle', ignoreDuplicates: false })
          .select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ lead: data, method: 'public_api' });
      }
    }
  } catch {
    // Public endpoint failed, fall through
  }

  // Fallback: create a minimal lead from just the handle
  // User can enrich it manually later
  const minimalProfile: ProfileData = {
    instagram_handle: `@${handle}`,
    display_name: body.display_name ?? null,
    bio: body.bio ?? null,
    profile_pic_url: null,
    follower_count: body.follower_count ?? 0,
    following_count: body.following_count ?? 0,
    post_count: body.post_count ?? 0,
    website_url: body.website_url ?? null,
  };

  const enriched = enrichProfile(minimalProfile, 'manual', 'manual');
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('leads')
    .upsert(enriched, { onConflict: 'instagram_handle', ignoreDuplicates: false })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data, method: 'fallback_minimal' });
}
