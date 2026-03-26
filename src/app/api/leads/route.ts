import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../auth';

export async function GET(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const hashtag = searchParams.get('hashtag');
  const minScore = searchParams.get('min_score');
  const sort = searchParams.get('sort') ?? 'score';
  const limit = 50;

  let query = supabase.from('leads').select('*');

  if (status) query = query.eq('status', status);
  if (hashtag) query = query.eq('source_hashtag', hashtag);
  if (minScore) query = query.gte('lead_score', parseInt(minScore));

  if (sort === 'score') {
    query = query.order('lead_score', { ascending: false }).order('created_at', { ascending: false });
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'name') {
    query = query.order('display_name', { ascending: true });
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data, count: data?.length ?? 0 });
}

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('leads')
    .upsert(body, { onConflict: 'instagram_handle', ignoreDuplicates: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}
