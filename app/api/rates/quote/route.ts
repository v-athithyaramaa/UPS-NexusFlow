import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { weightKg, lengthCm, widthCm, heightCm, senderZip, recipientZip } = await req.json();

    const actualWeight = parseFloat(weightKg) || 1;
    const l = parseFloat(lengthCm) || 10;
    const w = parseFloat(widthCm) || 10;
    const h = parseFloat(heightCm) || 10;
    
    const dimWeight = (l * w * h) / 5000;
    const billableWeight = Math.max(actualWeight, dimWeight);
    
    const sZip = parseInt(senderZip) || 90210;
    const rZip = parseInt(recipientZip) || 10001;
    const zipDelta = Math.abs(sZip - rZip) / 1000;

    const tiers = [
      {
        id: 'ground',
        name: 'UPS Ground',
        cost: 8.50 + (billableWeight * 1.20) + zipDelta,
        speed: '3-5 Business Days',
        carbonKg: +(0.45 * billableWeight).toFixed(2),
        tag: 'Best Value'
      },
      {
        id: 'second_day',
        name: 'UPS 2nd Day Air',
        cost: 18.00 + (billableWeight * 2.80) + zipDelta,
        speed: '2 Business Days',
        carbonKg: +(1.80 * billableWeight).toFixed(2)
      },
      {
        id: 'next_day',
        name: 'UPS Next Day Saver',
        cost: 35.00 + (billableWeight * 4.90) + zipDelta,
        speed: 'Next Business Day',
        carbonKg: +(3.90 * billableWeight).toFixed(2),
        tag: 'Fastest'
      }
    ];

    return NextResponse.json({ tiers });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute rates' }, { status: 500 });
  }
}
