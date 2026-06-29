/**
 * /api/usage — returns today's AI usage counts for the current user.
 * Used by the UI to show remaining Daily Picks and Quick Cards.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkUsage, DAILY_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Dev bypass — unlimited for dev emails
    const devEmails = (process.env.NEXT_PUBLIC_DEV_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    if (devEmails.length > 0) {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
      if (devEmails.includes(email)) {
        return NextResponse.json({
          daily_picks: { used: 0, limit: DAILY_LIMITS.daily_picks, remaining: DAILY_LIMITS.daily_picks },
          quick_card:  { used: 0, limit: DAILY_LIMITS.quick_card,  remaining: DAILY_LIMITS.quick_card  },
          devBypass: true,
        });
      }
    }

    const [picksUsage, cardUsage] = await Promise.all([
      checkUsage(userId, "daily_picks"),
      checkUsage(userId, "quick_card"),
    ]);

    return NextResponse.json({
      daily_picks: { used: picksUsage.used, limit: picksUsage.limit, remaining: picksUsage.remaining },
      quick_card:  { used: cardUsage.used,  limit: cardUsage.limit,  remaining: cardUsage.remaining  },
    });
  } catch (err) {
    console.error("usage route error:", err);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
