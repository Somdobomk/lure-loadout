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
  role:   z.enum(["PRIMARY", "FOLLOW-UP", "SITUATIONAL", "CLEANUP"]),
  tips:   z.array(z.string()).default([]),
});

export const QuickCardTimeBlockSchema = z.object({
  time:  z.string(),
  label: z.string(),
  mood:  z.enum(["dawn", "morning", "midday", "afternoon", "evening"]),
  focus: z.string(),
  rods:  z.array(QuickCardRodSchema).default([]),
});

export const QuickCardDecisionRuleSchema = z.object({
  lureType:  z.string(),
  meaning:   z.string(),
  ifItWorks: z.string(),
  color:     z.enum(["green", "yellow", "orange", "blue"]),
});

export const QuickCardSchema = z.object({
  headline:       z.string(),
  bestWindow:     z.string(),
  timeBlocks:     z.array(QuickCardTimeBlockSchema).default([]),
  decisionRules:  z.array(QuickCardDecisionRuleSchema).default([]),
  oneLineStrategy: z.string(),
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
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const result = schema.safeParse(json);
    if (result.success) return { success: true, data: result.data };
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return { success: false, error: `Validation failed${context ? ` (${context})` : ""}: ${msg}` };
  } catch {
    return { success: false, error: `JSON parse error${context ? ` (${context})` : ""}` };
  }
}
