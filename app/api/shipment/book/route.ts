import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const { draft, idempotencyKey } = await request.json();

    if (!draft || !draft.sessionToken) {
      return NextResponse.json({ error: 'Invalid draft data' }, { status: 400 });
    }

    // Check idempotency in Redis (optional, to prevent double booking)
    const hasBooked = await redis.get(`booked:${idempotencyKey}`);
    if (hasBooked) {
      return NextResponse.json({ error: 'Shipment already booked' }, { status: 409 });
    }

    const trackingNumber = `1Z999${Math.random().toString().substring(2, 10).toUpperCase()}`;

    const { data, error } = await supabaseAdmin.from('shipments').insert({
      tracking_number: trackingNumber.substring(0, 20),
      user_email: (draft.sender.email || 'guest@example.com').substring(0, 50),
      sender_name: (draft.sender.name || '').substring(0, 50),
      sender_address: (draft.sender.address || '').substring(0, 100),
      sender_city: (draft.sender.city || '').substring(0, 50),
      sender_zip: (draft.sender.zip || '').substring(0, 20),
      recipient_name: (draft.recipient.name || '').substring(0, 50),
      recipient_address: (draft.recipient.address || '').substring(0, 100),
      recipient_city: (draft.recipient.city || '').substring(0, 50),
      recipient_zip: (draft.recipient.zip || '').substring(0, 20),
      weight_kg: draft.parcel.weightKg || 0,
      length_cm: draft.parcel.lengthCm || 0,
      width_cm: draft.parcel.widthCm || 0,
      height_cm: draft.parcel.heightCm || 0,
      service_tier: (draft.selectedTier?.name || 'Standard').substring(0, 20),
      rate_amount: draft.selectedTier?.cost || 0,
      carbon_footprint_kg: draft.selectedTier?.carbonKg || 0,
      status: 'Order Placed',
      channel_origin: (draft.channelOrigin || 'WEB').substring(0, 20),
    }).select().single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: 'Failed to save shipment to database' }, { status: 500 });
    }

    // Mark as booked
    await redis.set(`booked:${idempotencyKey}`, 'true', { ex: 86400 });
    
    // Clear the draft or mark as booked
    await redis.del(`draft:${draft.sessionToken}`);

    return NextResponse.json({ shipment: data, trackingNumber });
  } catch (error) {
    console.error("Booking error", error);
    return NextResponse.json({ error: 'Failed to book shipment' }, { status: 500 });
  }
}
