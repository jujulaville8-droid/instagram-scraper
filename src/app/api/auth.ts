import { NextRequest, NextResponse } from 'next/server';

export function authenticateRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.API_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'API_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
