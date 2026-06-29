import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ picks: null });

    const { data } = await supabaseAdmin()
      .from("daily_picks")
      .select("picks, conditions, saved_at")
      .eq("user_id", userId)
      .single();

    if (!data) return NextResponse.json({ picks: null });
    return NextResponse.json({ picks: data.picks, conditions: data.conditions, savedAt: data.saved_at });
  } catch {
    return NextResponse.json({ picks: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { picks, conditions } = await req.json();
    if (!picks) return NextResponse.json({ error: "No picks data" }, { status: 400 });

    await supabaseAdmin()
      .from("daily_picks")
      .upsert({ user_id: userId, picks, conditions: conditions ?? {}, saved_at: new Date().toISOString() }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("picks-sync POST error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
