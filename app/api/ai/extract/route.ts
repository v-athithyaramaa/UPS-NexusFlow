import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt, imageBase64 } = await request.json();

    const systemPrompt = `Extract shipment details from the user prompt or image and return ONLY a JSON object adhering strictly to this format:
    {
      "senderCity": "string or null",
      "recipientCity": "string or null",
      "weightKg": number or null,
      "lengthCm": number or null,
      "widthCm": number or null,
      "heightCm": number or null,
      "urgency": "string (e.g., 'high', 'low', 'standard') or null"
    }
    Rules:
    1. If the user provides a city without specifying if it's origin or destination, assume it is the recipientCity (destination), UNLESS they explicitly say "from [City]".
    2. If they provide dimensions like "30x40x50", YOU MUST assign them to lengthCm, widthCm, and heightCm respectively. Do not leave them null.
    3. If they provide weight like "50kgs" or "5kg", YOU MUST assign it to weightKg as a number. Do not leave it null.
    4. Return ONLY the JSON object, without markdown blocks, without any other text.`;

    console.log("--- AI EXTRACT TRIGGERED ---");
    console.log("Received Prompt:", prompt);
    console.log("Has Image:", !!imageBase64);

    if (!prompt && !imageBase64) {
      return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
    }

    let responseText = "";

    if (imageBase64) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
            systemPrompt,
            prompt || "Analyze this image for parcel dimensions and details.",
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            }
        ]
      });
      responseText = response.text || "";
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
            systemPrompt,
            prompt
        ]
      });
      responseText = response.text || "";
    }

    console.log("RAW GEMINI RESPONSE:");
    console.log(responseText);

    // Attempt to parse JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let extractedData = {};
    if (jsonMatch) {
      try {
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse Gemini JSON output", e);
      }
    } else {
      console.error("NO JSON MATCH FOUND IN GEMINI RESPONSE");
    }

    console.log("PARSED DATA:", extractedData);
    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error("AI Extraction Error:", error);
    const errorMessage = error?.message || 'Failed to extract information';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
