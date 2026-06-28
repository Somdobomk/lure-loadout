import { NextRequest, NextResponse } from "next/server";
import { Lure, Conditions } from "@/lib/types";
import { LureSchema, ConditionsSchema, QuickCardSchema, safeParseJson } from "@/lib/schemas";
import { callGemini, GeminiError, geminiUserMessage, MODELS } from "@/lib/gemini";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  lures:      z.array(LureSchema),
  conditions: ConditionsSchema,
  aiContext:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid request: ${parsed.error.issues.map(i => i.message).join(", ")}` },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { lures, conditions, aiContext } = parsed.data;
  if (!lures.length) {
    return NextResponse.json({ error: "No lures in inventory." }, { status: 400 });
  }

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

  try {
    // Quick Card uses the primary model — time-blocked game plans need
    // stronger reasoning to structure multiple rods and decision trees
    const result = await callGemini(prompt, MODELS.primary, { maxOutputTokens: 2048, temperature: 0.4 });

    if (result.usedFallback) {
      console.log("quickcard: used fallback model", result.model);
    }

    const validated = safeParseJson(QuickCardSchema, result.text, "quick card");
    if (!validated.success) {
      console.error("quickcard: schema validation failed:", validated.error);
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error("quickcard: GeminiError:", err.message, err.status);
      return NextResponse.json(
        { error: geminiUserMessage(err.status) },
        { status: err.status }
      );
    }
    console.error("quickcard: unexpected error:", err);
    return NextResponse.json(
      { error: "The AI fishing assistant encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
