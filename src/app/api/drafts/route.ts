import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../auth';
import { buildDraftPrompt } from '@/lib/draft-prompt';
import { generateText } from '@/lib/ai-client';

export async function GET(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const leadId = searchParams.get('lead_id');
  const campaignId = searchParams.get('campaign_id');
  const sent = searchParams.get('sent');

  let query = supabase
    .from('drafts')
    .select('*, leads(instagram_handle, display_name)')
    .order('created_at', { ascending: false });

  if (leadId) query = query.eq('lead_id', leadId);
  if (campaignId) query = query.eq('campaign_id', campaignId);
  if (sent !== null && sent !== undefined) query = query.eq('is_sent', sent === 'true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ drafts: data });
}

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { lead_id, campaign_id, channel } = body as {
    lead_id: string;
    campaign_id?: string;
    channel?: string;
  };

  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Optionally fetch campaign template
  let template: string | undefined;
  if (campaign_id) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('template')
      .eq('id', campaign_id)
      .single();
    template = campaign?.template ?? undefined;
  }

  // Build prompt and generate draft
  const userPrompt = buildDraftPrompt({
    display_name: lead.display_name,
    bio: lead.bio,
    bio_keywords: lead.bio_keywords ?? [],
    has_linktree: lead.has_linktree,
    website_url: lead.website_url,
    lead_score: lead.lead_score,
    template,
  });

  const systemPrompt = 'You are a professional outreach copywriter. Write concise, personalized cold DMs for a web development freelancer targeting small businesses on Instagram.';

  const content = await generateText(systemPrompt, userPrompt);

  const { data: draft, error: draftError } = await supabase
    .from('drafts')
    .insert({
      lead_id,
      campaign_id: campaign_id ?? null,
      channel: channel ?? 'dm',
      content,
      is_edited: false,
      is_sent: false,
    })
    .select()
    .single();

  if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });
  return NextResponse.json({ draft }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { id, content, is_sent } = body as {
    id: string;
    content?: string;
    is_sent?: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (content !== undefined) {
    updates.content = content;
    updates.is_edited = true;
  }
  if (is_sent !== undefined) {
    updates.is_sent = is_sent;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('drafts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
}
