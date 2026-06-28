import { NextRequest, NextResponse } from "next/server";
import { Lure, Conditions } from "@/lib/types";
import { LureSchema, ConditionsSchema, QuickCardSchema, safeParseJson } from "@/lib/schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  lures:      z.array(LureSchema),
  conditions: ConditionsSchema,
  aiContext:  z.string().optional(),
});

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error("quickcard: GEMINI_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error: GEMINI_API_KEY is not set." }, { status: 500 });
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: `Invalid request: ${parsed.error.issues.map(i => i.message).join(", ")}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const { lures, conditions, aiContext } = parsed.data;
  if (!lures.length) return NextResponse.json({ error: "No lures in inventory." }, { status: 400 });

  const systemContext = aiContext || "You are an expert bass fishing guide.";
  const prompt = `${systemContext}

Create a QUICK CARD game plan. Based on the angler's lure inventory and today's conditions, build a time-blocked fishing game plan.

CURRENT CONDITIONS:
- Water Clarity: ${conditions.clarity}
- Weather: ${conditions.weather}
- Season: ${conditions.season}
- Time of Day starting: ${conditions.timeOfDay}
- Target Species: ${conditions.species || "Bass"}
- Additional Notes: ${conditions.notes || "None"}

AVAILABLE LURES (only recommend lures from this list):
${lures.map((l: Lure) => `- ${l.name} | Type: ${l.type} | Color: ${l.color} | Weight: ${l.weight ?? "unknown"} | Size: ${l.size} | Qty: ${l.quantity}${l.notes ? ` | Notes: ${l.notes}` : ""}`).join("\n")}

Respond in JSON only (no markdown, no backticks, no preamble):
{
  "headline": "punchy headline",
  "bestWindow": "best fishing window",
  "timeBlocks": [
    { "time": "6:30-8:00 AM", "label": "POWER SEARCH", "mood": "morning", "focus": "behavior", "rods": [
      { "number": 1, "lure": "name", "color": "color", "role": "PRIMARY", "tips": ["tip1","tip2"] }
    ]}
  ],
  "decisionRules": [
    { "lureType": "type", "meaning": "= FIND FISH", "ifItWorks": "stay fast", "color": "green" }
  ],
  "oneLineStrategy": "Find → Position → Slow Down → Finish",
  "proTip": "one tip"
}

mood must be one of: dawn/morning/midday/afternoon/evening
role must be one of: PRIMARY/FOLLOW-UP/SITUATIONAL/CLEANUP
decision rule color must be one of: green/yellow/orange/blue`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
    });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error("quickcard: fetch to Gemini failed:", msg);
    return NextResponse.json({ error: `Network error calling Gemini: ${msg}` }, { status: 500 });
  }

  if (!geminiRes.ok) {
    const body = await geminiRes.text();
    console.error(`quickcard: Gemini returned ${geminiRes.status}:`, body);
    return NextResponse.json(
      { error: `Gemini error ${geminiRes.status}: ${body.slice(0, 400)}` },
      { status: 500 }
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await geminiRes.json();
  } catch {
    console.error("quickcard: failed to parse Gemini JSON response");
    return NextResponse.json({ error: "Gemini returned non-JSON response." }, { status: 500 });
  }

  const text = (data?.candidates as { content?: { parts?: { text?: string }[] } }[])?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    console.error("quickcard: Gemini returned no text. Full response:", JSON.stringify(data).slice(0, 500));
    return NextResponse.json({ error: "Gemini returned an empty response. This may indicate a quota or safety filter issue." }, { status: 500 });
  }

  const validated = safeParseJson(QuickCardSchema, text, "quick card");
  if (!validated.success) {
    console.error("quickcard: schema validation failed:", validated.error, "raw text:", text.slice(0, 300));
    return NextResponse.json({ error: `AI response format error: ${validated.error}` }, { status: 500 });
  }

  return NextResponse.json(validated.data);
}
