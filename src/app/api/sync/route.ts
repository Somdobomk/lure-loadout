/**
 * /api/sync — single endpoint for all data sync operations.
 *
 * GET  /api/sync  — fetch all user data
 * POST /api/sync  — upsert all user data (full replace per table)
 */
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Lure, Rod, Reel, Trip } from "@/lib/types";
import { SyncPostSchema } from "@/lib/schemas";

// Force dynamic rendering — this route uses auth() and env vars at request time
export const dynamic = "force-dynamic";

// ── Map app types → DB rows ──────────────────────────────────────────────

function lureToRow(l: Lure, userId: string) {
  return { id: l.id, user_id: userId, name: l.name, type: l.type, color: l.color, weight: l.weight ?? "1/4 oz", size: l.size, quantity: l.quantity, notes: l.notes };
}
function rodToRow(r: Rod, userId: string) {
  return { id: r.id, user_id: userId, name: r.name, brand: r.brand, type: r.type, length: r.length, power: r.power, action: r.action, notes: r.notes };
}
function reelToRow(r: Reel, userId: string) {
  return { id: r.id, user_id: userId, name: r.name, brand: r.brand, type: r.type, gear_ratio: r.gearRatio, ball_bearings: r.ballBearings, notes: r.notes };
}
function tripToRow(t: Trip, userId: string) {
  return { id: t.id, user_id: userId, date: t.date, location: t.location, water_body: t.waterBody, water_clarity: t.waterClarity, weather: t.weather, temperature: t.temperature, duration: t.duration, catches: t.catches, notes: t.notes };
}

// ── Map DB rows → app types ──────────────────────────────────────────────

function rowToLure(r: Record<string, unknown>): Lure {
  return { id: Number(r.id), name: String(r.name), type: String(r.type), color: String(r.color), weight: String(r.weight ?? "1/4 oz"), size: String(r.size), quantity: Number(r.quantity), notes: String(r.notes ?? "") };
}
function rowToRod(r: Record<string, unknown>): Rod {
  return { id: Number(r.id), name: String(r.name), brand: String(r.brand ?? ""), type: String(r.type), length: String(r.length), power: String(r.power), action: String(r.action), notes: String(r.notes ?? "") };
}
function rowToReel(r: Record<string, unknown>): Reel {
  return { id: Number(r.id), name: String(r.name), brand: String(r.brand ?? ""), type: String(r.type), gearRatio: String(r.gear_ratio), ballBearings: String(r.ball_bearings), notes: String(r.notes ?? "") };
}
function rowToTrip(r: Record<string, unknown>): Trip {
  return { id: Number(r.id), date: String(r.date), location: String(r.location), waterBody: String(r.water_body), waterClarity: String(r.water_clarity), weather: String(r.weather), temperature: String(r.temperature ?? ""), duration: String(r.duration), catches: (r.catches as Trip["catches"]) ?? [], notes: String(r.notes ?? "") };
}

// Helper: delete rows not in the provided id list
async function deleteExcept(client: ReturnType<typeof supabaseAdmin>, table: string, userId: string, ids: number[]) {
  const idList = ids.length ? `(${ids.join(",")})` : "(0)";
  await client.from(table).delete().eq("user_id", userId).not("id", "in", idList);
}

// ── GET ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = supabaseAdmin();

    const [luresRes, rodsRes, reelsRes, tripsRes, prefsRes] = await Promise.all([
      client.from("lures").select("*").eq("user_id", userId).order("created_at"),
      client.from("rods").select("*").eq("user_id", userId).order("created_at"),
      client.from("reels").select("*").eq("user_id", userId).order("created_at"),
      client.from("trips").select("*").eq("user_id", userId).order("date", { ascending: false }),
      client.from("user_prefs").select("*").eq("user_id", userId).single(),
    ]);

    return NextResponse.json({
      lures:         (luresRes.data  ?? []).map(rowToLure),
      rods:          (rodsRes.data   ?? []).map(rowToRod),
      reels:         (reelsRes.data  ?? []).map(rowToReel),
      trips:         (tripsRes.data  ?? []).map(rowToTrip),
      targetSpecies: prefsRes.data?.target_species ?? null,
      onboarded:     prefsRes.data?.onboarded ?? false,
    });
  } catch (err) {
    console.error("Sync GET error:", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawBody = await req.json();
    const bodyParsed = SyncPostSchema.safeParse(rawBody);
    if (!bodyParsed.success) {
      const msg = bodyParsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: `Invalid request body: ${msg}` }, { status: 400 });
    }
    const body = bodyParsed.data;
    const client = supabaseAdmin();

    // Lures
    if (body.lures !== undefined) {
      const lures = body.lures as Lure[];
      await deleteExcept(client, "lures", userId, lures.map((l) => l.id));
      if (lures.length > 0) {
        await client.from("lures").upsert(lures.map((l) => lureToRow(l, userId)), { onConflict: "id" });
      }
    }

    // Rods
    if (body.rods !== undefined) {
      const rods = body.rods as Rod[];
      await deleteExcept(client, "rods", userId, rods.map((r) => r.id));
      if (rods.length > 0) {
        await client.from("rods").upsert(rods.map((r) => rodToRow(r, userId)), { onConflict: "id" });
      }
    }

    // Reels
    if (body.reels !== undefined) {
      const reels = body.reels as Reel[];
      await deleteExcept(client, "reels", userId, reels.map((r) => r.id));
      if (reels.length > 0) {
        await client.from("reels").upsert(reels.map((r) => reelToRow(r, userId)), { onConflict: "id" });
      }
    }

    // Trips
    if (body.trips !== undefined) {
      const trips = body.trips as Trip[];
      await deleteExcept(client, "trips", userId, trips.map((t) => t.id));
      if (trips.length > 0) {
        await client.from("trips").upsert(trips.map((t) => tripToRow(t, userId)), { onConflict: "id" });
      }
    }

    // Preferences
    if (body.targetSpecies !== undefined || body.onboarded !== undefined) {
      await client.from("user_prefs").upsert({
        user_id:        userId,
        target_species: body.targetSpecies,
        onboarded:      body.onboarded ?? true,
        updated_at:     new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Sync POST error:", err);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
