import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Draft } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const draft = await redis.get(`draft:${token}`);
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve draft' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let sessionToken = body.sessionToken;

    if (!sessionToken) {
      sessionToken = `NEXUS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    const draftData: Draft = {
      sessionToken,
      channelOrigin: body.channelOrigin || 'WEB_PORTAL',
      step: body.step || 1,
      sender: body.sender || { name: '', address: '', city: '', zip: '', email: '' },
      recipient: body.recipient || { name: '', address: '', city: '', zip: '' },
      parcel: body.parcel || { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 },
      selectedTier: body.selectedTier || null,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`draft:${sessionToken}`, draftData, { ex: 86400 });

    return NextResponse.json({ sessionToken, draft: draftData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
