import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { weightKg, lengthCm, widthCm, heightCm, senderZip, recipientZip } = await request.json();

    // Convert to lbs and inches for standard calculation
    const weightLbs = weightKg * 2.20462;
    const lengthIn = lengthCm * 0.393701;
    const widthIn = widthCm * 0.393701;
    const heightIn = heightCm * 0.393701;

    // Calculate Dimensional Weight
    const dimWeight = (lengthIn * widthIn * heightIn) / 139;
    const billableWeight = Math.max(weightLbs, dimWeight, 1); // Minimum 1 lb

    const baseWeightMarkup = billableWeight * 0.5;

    const tiers = [
      {
        id: 'ground',
        name: 'UPS Ground',
        cost: 14.50 + baseWeightMarkup,
        speed: '3-5 days delivery',
        carbonKg: 0.8,
        tag: null
      },
      {
        id: '2nd_day',
        name: 'UPS 2nd Day Air',
        cost: 28.00 + baseWeightMarkup * 1.5,
        speed: '2 business days',
        carbonKg: 2.1,
        tag: null
      },
      {
        id: 'next_day',
        name: 'UPS Next Day Saver',
        cost: 49.00 + baseWeightMarkup * 2.5,
        speed: 'Next day delivery',
        carbonKg: 4.6,
        tag: 'Fastest'
      }
    ];

    return NextResponse.json({ tiers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate rates' }, { status: 500 });
  }
}
