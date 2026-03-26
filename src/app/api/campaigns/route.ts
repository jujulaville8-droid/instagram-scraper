import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../auth';

export async function GET(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, hashtag_configs(*), campaign_leads(lead_id)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all((data ?? []).map(async (campaign) => {
    const leadIds = campaign.campaign_leads?.map((cl: { lead_id: string }) => cl.lead_id) ?? [];
    let stats = { total: leadIds.length, contacted: 0, replied: 0, converted: 0 };

    if (leadIds.length > 0) {
      const { data: leads } = await supabase
        .from('leads')
        .select('status')
        .in('id', leadIds);

      stats.contacted = leads?.filter(l => ['contacted', 'replied', 'converted'].includes(l.status)).length ?? 0;
      stats.replied = leads?.filter(l => ['replied', 'converted'].includes(l.status)).length ?? 0;
      stats.converted = leads?.filter(l => l.status === 'converted').length ?? 0;
    }

    return { ...campaign, stats };
  }));

  return NextResponse.json({ campaigns: enriched });
}

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { name, hashtag_config_id, template } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, hashtag_config_id: hashtag_config_id ?? null, template: template ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
