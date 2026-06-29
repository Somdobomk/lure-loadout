import { NextRequest, NextResponse } from "next/server";
import { Lure, Conditions } from "@/lib/types";
import { LureSchema, ConditionsSchema, QuickCardSchema, safeParseJson } from "@/lib/schemas";
import { callGemini, GeminiError, geminiUserMessage, MODELS } from "@/lib/gemini";
import { checkAndIncrement } from "@/lib/rateLimit";
import { auth } from "@clerk/nextjs/server";
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

STRICT RULES — these values must match exactly or the response will be rejected:
- mood field: must be exactly one of these lowercase strings: dawn, morning, midday, afternoon, evening
- role field: must be exactly one of these uppercase strings: PRIMARY, FOLLOW-UP, SITUATIONAL, CLEANUP
- color field in decisionRules: must be exactly one of these lowercase strings: green, yellow, orange, blue
- All fields shown in the JSON structure above are required — do not omit any
- Output raw JSON only — no markdown, no code fences, no explanation text before or after`;

  // Rate limit check
  const { userId } = await auth();
  if (userId) {
    const devEmails = (process.env.NEXT_PUBLIC_DEV_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
    if (!devEmails.includes(email)) {
      const usage = await checkAndIncrement(userId, "quick_card");
      if (!usage.allowed) {
        return NextResponse.json(
          { error: `Daily limit reached — you've used all ${usage.limit} Quick Cards for today. Resets at midnight UTC.`, rateLimited: true, used: usage.used, limit: usage.limit },
          { status: 429 }
        );
      }
    }
  }

  try {
    // Quick Card uses the primary model — time-blocked game plans need
    // stronger reasoning to structure multiple rods and decision trees
    const result = await callGemini(prompt, MODELS.primary, { maxOutputTokens: 2048, temperature: 0.4 });

    if (result.usedFallback) {
      console.log("quickcard: used fallback model", result.model);
    }

    let validated = safeParseJson(QuickCardSchema, result.text, "quick card");

    // If primary model returned bad format, retry with fallback model
    if (!validated.success && !result.usedFallback) {
      console.warn("quickcard: primary model returned bad format, retrying with fallback");
      try {
        const retry = await callGemini(prompt, MODELS.fallback, { maxOutputTokens: 2048, temperature: 0.3 });
        validated = safeParseJson(QuickCardSchema, retry.text, "quick card retry");
      } catch {
        // ignore retry error, fall through to original error
      }
    }

    if (!validated.success) {
      console.error("quickcard: schema validation failed after retry:", validated.error);
      return NextResponse.json(
        { error: "The AI fishing assistant is temporarily busy. Please try again in a moment." },
        { status: 503 }
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
