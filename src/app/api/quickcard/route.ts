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

    const systemContext = aiContext || "You are an expert bass fishing guide.";

    const prompt = `${systemContext}

You are creating a QUICK CARD game plan for a bass angler. Based on their lure inventory and today's conditions, build a detailed time-blocked fishing game plan similar to a professional fishing guide card.

CURRENT CONDITIONS:
- Water Clarity: ${conditions.clarity}
- Weather: ${conditions.weather}
- Season: ${conditions.season}
- Time of Day starting: ${conditions.timeOfDay}
- Target Species: ${conditions.species || "Bass"}
- Additional Notes: ${conditions.notes || "None"}

AVAILABLE LURES IN INVENTORY (only recommend lures from this list):
${lures.map((l: Lure) => `- ${l.name} | Type: ${l.type} | Color: ${l.color} | Weight: ${l.weight ?? "unknown"} | Size: ${l.size} | Qty: ${l.quantity}${l.notes ? ` | Notes: ${l.notes}` : ""}`).join("\n")}

Respond in JSON only (no markdown, no backticks, no preamble):
{
  "headline": "punchy headline summarizing today's opportunity",
  "bestWindow": "best fishing window (e.g. 'Dawn – 10:00 AM')",
  "timeBlocks": [
    {
      "time": "6:30 – 8:00 AM",
      "label": "POWER SEARCH WINDOW",
      "mood": "morning",
      "focus": "fish behavior and location this window",
      "rods": [
        { "number": 1, "lure": "name from inventory", "color": "color", "role": "PRIMARY", "tips": ["tip1", "tip2"] }
      ]
    }
  ],
  "decisionRules": [
    { "lureType": "type", "meaning": "= FIND FISH", "ifItWorks": "stay fast", "color": "green" }
  ],
  "oneLineStrategy": "Find → Position → Slow Down → Finish",
  "proTip": "one critical tip for today"
}

Rules: only use lures from inventory, 2-3 time blocks, 2-4 rods per block, mood must be one of: dawn/morning/midday/afternoon/evening, role must be one of: PRIMARY/FOLLOW-UP/SITUATIONAL/CLEANUP, decision rule color must be one of: green/yellow/orange/blue.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const validated = safeParseJson(QuickCardSchema, text, "quick card");
    if (!validated.success) {
      console.error("Quick card validation failed:", validated.error);
      return NextResponse.json({ error: "AI returned an unexpected response format." }, { status: 500 });
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("quickcard error:", errMsg);
    return NextResponse.json({ error: errMsg || "Failed — check server logs." }, { status: 500 });
  }
}
