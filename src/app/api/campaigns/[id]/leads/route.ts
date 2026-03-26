import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../../../auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { lead_ids } = body as { lead_ids: string[] };

  if (!lead_ids || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const rows = lead_ids.map(lead_id => ({ campaign_id: id, lead_id }));

  const { data, error } = await supabase
    .from('campaign_leads')
    .upsert(rows, { onConflict: 'campaign_id,lead_id', ignoreDuplicates: true })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ added: data?.length ?? 0 }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const { lead_ids } = body as { lead_ids: string[] };

  if (!lead_ids || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('campaign_leads')
    .delete()
    .eq('campaign_id', id)
    .in('lead_id', lead_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
