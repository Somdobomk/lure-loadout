/**
 * /api/quickcard-sync
 * GET  — load saved Quick Card for current user
 * POST — save Quick Card for current user
 */
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin()
      .from("quick_cards")
      .select("card, conditions, saved_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) return NextResponse.json({ card: null });

    return NextResponse.json({
      card:       data.card,
      conditions: data.conditions,
      savedAt:    data.saved_at,
    });
  } catch (err) {
    console.error("quickcard-sync GET error:", err);
    return NextResponse.json({ card: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { card, conditions } = await req.json();
    if (!card) return NextResponse.json({ error: "No card data" }, { status: 400 });

    const { error } = await supabaseAdmin()
      .from("quick_cards")
      .upsert({
        user_id:   userId,
        card,
        conditions: conditions ?? {},
        saved_at:  new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("quickcard-sync POST error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
