import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageBase64 } = await req.json();
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

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

    let parts: any[] = [{ text: systemInstruction }, { text: `User request: ${prompt || "Analyze this package image"}` }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    const result = await model.generateContent(parts);
    const parsed = JSON.parse(result.response.text());
    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("AI Extraction Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
