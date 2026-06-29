/**
 * AI usage rate limiter — server-side only.
 * Tracks daily call counts per user per feature in Supabase.
 * Resets automatically at UTC midnight (new date = new row).
 */
import { supabaseAdmin } from "@/lib/supabase";

export type AiFeature = "daily_picks" | "quick_card";

export const DAILY_LIMITS: Record<AiFeature, number> = {
  daily_picks: 3,
  quick_card:  3,
};

export interface UsageResult {
  allowed: boolean;
  used:    number;
  limit:   number;
  remaining: number;
}

/**
 * Check if a user is within their daily limit for a feature.
 * Returns current usage info without incrementing.
 */
export async function checkUsage(userId: string, feature: AiFeature): Promise<UsageResult> {
  const limit = DAILY_LIMITS[feature];
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC

  try {
    const { data } = await supabaseAdmin()
      .from("ai_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", feature)
      .eq("date", today)
      .single();

    const used = data?.count ?? 0;
    return { allowed: used < limit, used, limit, remaining: Math.max(0, limit - used) };
  } catch {
    // On error, allow the request (fail open — better UX than blocking)
    return { allowed: true, used: 0, limit, remaining: limit };
  }
}

/**
 * Increment usage count for a user/feature.
 * Call this only after a successful AI response.
 */
export async function incrementUsage(userId: string, feature: AiFeature): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data } = await supabaseAdmin()
      .from("ai_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", feature)
      .eq("date", today)
      .single();

    if (data) {
      await supabaseAdmin()
        .from("ai_usage")
        .update({ count: data.count + 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("feature", feature)
        .eq("date", today);
    } else {
      await supabaseAdmin()
        .from("ai_usage")
        .insert({ user_id: userId, feature, date: today, count: 1 });
    }
  } catch (err) {
    console.error("incrementUsage error:", err);
  }
}

/**
 * Check and increment in one call — use this in API routes.
 * Returns the usage result BEFORE incrementing so you can check it first.
 */
export async function checkAndIncrement(userId: string, feature: AiFeature): Promise<UsageResult> {
  const usage = await checkUsage(userId, feature);
  if (usage.allowed) {
    // Increment in background — don't await so it doesn't slow the response
    incrementUsage(userId, feature).catch(console.error);
  }
  return usage;
}
