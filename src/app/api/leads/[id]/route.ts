import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../../auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ lead: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const allowedFields = ['status', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from('leads').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
