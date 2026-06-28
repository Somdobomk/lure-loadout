import { NextRequest, NextResponse } from "next/server";
import { Lure, Conditions } from "@/lib/types";
import { LureSchema, ConditionsSchema, RecommendationSchema, safeParseJson } from "@/lib/schemas";
import { callGemini, GeminiError, geminiUserMessage, MODELS } from "@/lib/gemini";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  lures:      z.array(LureSchema),
  conditions: ConditionsSchema,
  aiContext:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Parse and validate request
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

  try {
    // Daily Picks uses the primary model — lure recommendations benefit from
    // better reasoning about conditions, species behaviour, and technique
    const result = await callGemini(prompt, MODELS.primary, { maxOutputTokens: 1024, temperature: 0.4 });

    if (result.usedFallback) {
      console.log("recommend: used fallback model", result.model);
    }

    const validated = safeParseJson(RecommendationSchema, result.text, "recommendation");
    if (!validated.success) {
      console.error("recommend: schema validation failed:", validated.error);
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error("recommend: GeminiError:", err.message, err.status);
      return NextResponse.json(
        { error: geminiUserMessage(err.status) },
        { status: err.status }
      );
    }
    console.error("recommend: unexpected error:", err);
    return NextResponse.json(
      { error: "The AI fishing assistant encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
