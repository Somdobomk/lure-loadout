import { NextRequest, NextResponse } from "next/server";
import { Lure, Conditions } from "@/lib/types";
import { LureSchema, ConditionsSchema, RecommendationSchema, safeParseJson } from "@/lib/schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  lures:     z.array(LureSchema),
  conditions: ConditionsSchema,
  aiContext: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: `Invalid request: ${msg}` }, { status: 400 });
    }

    const { lures, conditions, aiContext } = parsed.data;

    if (lures.length === 0) {
      return NextResponse.json({ error: "No lures in inventory." }, { status: 400 });
    }

    const systemContext = aiContext || "You are an expert fishing guide.";

    const prompt = `${systemContext}

Based on the angler's lure inventory and current conditions, recommend the best lures to use today.

CURRENT CONDITIONS:
- Water Clarity: ${conditions.clarity}
- Weather: ${conditions.weather}
- Season: ${conditions.season}
- Time of Day: ${conditions.timeOfDay}
- Target Species: ${conditions.species || "Bass"}
- Additional Notes: ${conditions.notes || "None"}

AVAILABLE LURES IN INVENTORY:
${lures.map((l: Lure) => `- ${l.name} | Type: ${l.type} | Color: ${l.color} | Weight: ${l.weight ?? "unknown"} | Size: ${l.size} | Qty: ${l.quantity}${l.notes ? ` | Notes: ${l.notes}` : ""}`).join("\n")}

Respond in JSON only (no markdown, no backticks, no preamble):
{
  "topPicks": [{ "lure": "name", "reason": "why", "technique": "how" }],
  "avoid": ["lure or type with reason"],
  "proTip": "one actionable tip"
}

Recommend 2–4 top picks from the actual inventory. Be species-specific and condition-specific.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const validated = safeParseJson(RecommendationSchema, text, "recommendation");
    if (!validated.success) {
      console.error("AI response validation failed:", validated.error);
      return NextResponse.json({ error: "AI returned an unexpected response format." }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("Recommendation error:", err);
    return NextResponse.json({ error: "Failed to get recommendations." }, { status: 500 });
  }
}
