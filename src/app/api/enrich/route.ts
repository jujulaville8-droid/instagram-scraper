import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../auth';
import { enrichProfile } from '@/lib/enrichment';
import type { ProfileData } from '@/lib/types';

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { profiles, source, source_hashtag } = body as {
    profiles: ProfileData[];
    source: 'scraper' | 'manual';
    source_hashtag: string;
  };

  if (!profiles?.length) {
    return NextResponse.json({ error: 'No profiles provided' }, { status: 400 });
  }

  const supabase = createServerClient();
  const enriched = profiles.map(p => enrichProfile(p, source_hashtag, source));

  const { data, error } = await supabase
    .from('leads')
    .upsert(enriched, { onConflict: 'instagram_handle', ignoreDuplicates: false })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newLeads = data?.filter(d => d.status === 'new') ?? [];
  const highScore = data?.filter(d => d.lead_score >= 70) ?? [];

  return NextResponse.json({
    total: data?.length ?? 0,
    new_leads: newLeads.length,
    high_score: highScore.length,
    leads: data,
  });
}
