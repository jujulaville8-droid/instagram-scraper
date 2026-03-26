import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateRequest } from '../auth';

export async function GET(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('hashtag_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hashtags: data });
}

export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('hashtag_configs')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hashtag: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('hashtag_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hashtag: data });
}

export async function DELETE(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('hashtag_configs')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
