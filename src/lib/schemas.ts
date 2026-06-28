/**
 * Zod schemas for LureLoadout.
 * Single source of truth for all runtime validation.
 */
import { z } from "zod";

// ── Inventory ──────────────────────────────────────────────────────────────

export const LureSchema = z.object({
  id:       z.number(),
  name:     z.string().min(1, "Name is required"),
  type:     z.string().default("Other"),
  color:    z.string().default("Other"),
  weight:   z.string().default(""),   // empty string for soft plastics, weight string for hard baits
  size:     z.string().default('Medium (2–4")'),
  quantity: z.number().int().min(0).default(1),
  notes:    z.string().default(""),
});

export const RodSchema = z.object({
  id:     z.number(),
  name:   z.string().min(1, "Name is required"),
  brand:  z.string().default(""),
  type:   z.string().default("Casting"),
  length: z.string().default('6\'6"–7\''),
  power:  z.string().default("Medium"),
  action: z.string().default("Fast"),
  notes:  z.string().default(""),
});

export const ReelSchema = z.object({
  id:           z.number(),
  name:         z.string().min(1, "Name is required"),
  brand:        z.string().default(""),
  type:         z.string().default("Baitcaster"),
  gearRatio:    z.string().default("6:1–7:1 (Fast)"),
  ballBearings: z.string().default("4–6"),
  notes:        z.string().default(""),
});

export const CatchSchema = z.object({
  id:       z.number(),
  species:  z.string().default("Bass (Largemouth)"),
  weight:   z.string().default(""),
  length:   z.string().default(""),
  lureUsed: z.string().default(""),
  notes:    z.string().default(""),
  photo:    z.string().optional(),
});

export const TripSchema = z.object({
  id:           z.number(),
  date:         z.string(),
  location:     z.string().default(""),
  waterBody:    z.string().default("Lake"),
  waterClarity: z.string().default("Clear"),
  weather:      z.string().default("Sunny & Calm"),
  temperature:  z.string().default(""),
  duration:     z.string().default("Half day"),
  catches:      z.array(CatchSchema).default([]),
  notes:        z.string().default(""),
});

// Import schemas — more lenient (id is optional, will be assigned on import)
export const ImportLureSchema = LureSchema.omit({ id: true }).extend({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
});

export const ImportRodSchema = RodSchema.omit({ id: true }).extend({
  id: z.number().optional(),
});

export const ImportReelSchema = ReelSchema.omit({ id: true }).extend({
  id: z.number().optional(),
});

// ── Sync API body ─────────────────────────────────────────────────────────

export const SyncPostSchema = z.object({
  lures:         z.array(LureSchema).optional(),
  rods:          z.array(RodSchema).optional(),
  reels:         z.array(ReelSchema).optional(),
  trips:         z.array(TripSchema).optional(),
  targetSpecies: z.string().optional(),
  onboarded:     z.boolean().optional(),
});

// ── Conditions (Daily Picks / Quick Card) ─────────────────────────────────

export const ConditionsSchema = z.object({
  clarity:   z.string(),
  weather:   z.string(),
  season:    z.string(),
  timeOfDay: z.string(),
  species:   z.string(),
  notes:     z.string().default(""),
});

// ── AI Responses ──────────────────────────────────────────────────────────

export const LurePickSchema = z.object({
  lure:      z.string(),
  reason:    z.string(),
  technique: z.string(),
});

export const RecommendationSchema = z.object({
  topPicks: z.array(LurePickSchema).default([]),
  avoid:    z.array(z.string()).default([]),
  proTip:   z.string().default(""),
});

export const QuickCardRodSchema = z.object({
  number: z.number(),
  lure:   z.string(),
  color:  z.string(),
  role:   z.string().transform(s => s.toUpperCase().replace("-", "-")).pipe(z.enum(["PRIMARY", "FOLLOW-UP", "SITUATIONAL", "CLEANUP"])).catch("SITUATIONAL"),
  tips:   z.array(z.string()).default([]),
});

export const QuickCardTimeBlockSchema = z.object({
  time:  z.string(),
  label: z.string(),
  mood:  z.string().transform(s => s.toLowerCase()).pipe(z.enum(["dawn", "morning", "midday", "afternoon", "evening"])).catch("morning"),
  focus: z.string(),
  rods:  z.array(QuickCardRodSchema).default([]),
});

export const QuickCardDecisionRuleSchema = z.object({
  lureType:  z.string(),
  meaning:   z.string(),
  ifItWorks: z.string(),
  color:     z.string().transform(s => s.toLowerCase()).pipe(z.enum(["green", "yellow", "orange", "blue"])).catch("green"),
});

export const QuickCardSchema = z.object({
  headline:       z.string().default("Game Plan"),
  bestWindow:     z.string().default("Best available window"),
  timeBlocks:     z.array(QuickCardTimeBlockSchema).default([]),
  decisionRules:  z.array(QuickCardDecisionRuleSchema).default([]),
  oneLineStrategy: z.string().default("Find → Position → Slow Down → Finish"),
  proTip:         z.string().default(""),
});

// ── Stripe checkout request ───────────────────────────────────────────────

export const CheckoutRequestSchema = z.object({
  // No body needed — userId comes from Clerk auth
}).optional();

// ── Helper: safe JSON parse + validate ───────────────────────────────────

export function safeParseJson<T>(
  schema: z.ZodSchema<T>,
  raw: string,
  context?: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Strip markdown fences, leading/trailing whitespace
    let cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // If Gemini wrapped the JSON in extra text, extract the JSON object/array
    const firstBrace  = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    const start = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
      ? firstBrace : firstBracket;
    if (start > 0) cleaned = cleaned.slice(start);

    const lastBrace   = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const end = Math.max(lastBrace, lastBracket);
    if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);

    const json = JSON.parse(cleaned);
    const result = schema.safeParse(json);
    if (result.success) return { success: true, data: result.data };
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    console.error(`safeParseJson (${context}): validation failed — ${msg}`);
    console.error(`safeParseJson raw text snippet:`, raw.slice(0, 500));
    return { success: false, error: `Validation failed${context ? ` (${context})` : ""}: ${msg}` };
  } catch (err) {
    console.error(`safeParseJson (${context}): JSON parse error —`, err, "raw:", raw.slice(0, 300));
    return { success: false, error: `JSON parse error${context ? ` (${context})` : ""}` };
  }
}
