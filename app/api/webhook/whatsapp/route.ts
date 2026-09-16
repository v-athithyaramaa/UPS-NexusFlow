import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = formData.get("Body")?.toString() || "";
    const from = formData.get("From")?.toString() || "";
    const mediaUrl = formData.get("MediaUrl0")?.toString();

    // Generate or retrieve 6-character session token
    // If we want a persistant session per phone, we could lookup:
    // let token = await redis.get(`wa_session:${from}`);
    
    // For now just generate a fresh one or we can do a lookup
    const token = "NX-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Extract info via Gemini
    let extracted = {
      sender: { name: "", city: "", zip: "", address: "" },
      recipient: { name: "", city: "", zip: "", address: "" },
      parcel: { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 }
    };
    
    if (body || mediaUrl) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const systemInstruction = `You are a UPS Logistics AI. Extract shipment details from the user's input or package photo. Return ONLY valid JSON with this exact schema:
        {
          "sender": { "name": "string", "city": "string", "zip": "string", "address": "string" },
          "recipient": { "name": "string", "city": "string", "zip": "string", "address": "string" },
          "parcel": { "weightKg": 0, "lengthCm": 0, "widthCm": 0, "heightCm": 0 },
          "urgency": "GROUND"
        }
        Infer realistic package dimensions/weight if an image is provided. Fallback missing string fields to "" and numbers to 1.0.`;

        let parts: any[] = [{ text: systemInstruction }, { text: `User request: ${body || "Analyze this package image"}` }];
        // Note: Twilio MediaUrl needs to be fetched and converted to base64, 
        // but for hackathon speed we'll just pass the URL as text if it exists
        if (mediaUrl) {
           parts.push({ text: `Image URL provided: ${mediaUrl}` });
        }

        const result = await model.generateContent(parts);
        const parsed = JSON.parse(result.response.text());
        extracted = { ...extracted, ...parsed };
      } catch(e) {
        console.error("Gemini parse failed in webhook", e);
      }
    }

    // Draft structure
    const draft = {
      sessionToken: token,
      channelOrigin: "WHATSAPP",
      step: 2,
      sender: extracted.sender || { name: "", address: "", city: "", zip: "", email: "" },
      recipient: extracted.recipient || { name: "", address: "", city: "", zip: "" },
      parcel: extracted.parcel || { weightKg: 0, lengthCm: 0, widthCm: 0, heightCm: 0 },
      selectedTier: null,
      updatedAt: new Date().toISOString()
    };

    await redis.set(`draft:${token}`, draft, { ex: 86400 });

    // Return valid TwiML
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>UPS NexusFlow: Draft captured! Resume your omnichannel booking instantly: ${baseUrl}/?session=${token}</Message>
</Response>`;

    return new NextResponse(xmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    return new NextResponse(`<Response><Message>Error creating draft: ${err.message}</Message></Response>`, { status: 500, headers: { "Content-Type": "text/xml" } });
  }
}
