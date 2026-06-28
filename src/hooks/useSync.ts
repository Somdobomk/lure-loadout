/**
 * useSync — manages all data loading and saving via Supabase.
 *
 * Strategy:
 * 1. On mount, load from Supabase (source of truth).
 * 2. If Supabase returns nothing and localStorage has data, offer migration.
 * 3. Every mutation calls a debounced sync to Supabase.
 * 4. localStorage is kept as a read-through cache for instant load on revisit.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lure, Rod, Reel, Trip, TargetSpecies, DEFAULT_LURES } from "@/lib/types";

const LS_LURES    = "lure-loadout-lures";
const LS_RODS     = "lure-loadout-rods";
const LS_REELS    = "lure-loadout-reels";
const LS_TRIPS    = "lure-loadout-trips";
const LS_SPECIES  = "lure-loadout-species";
const LS_ONBOARD  = "lure-loadout-onboarded";
const LS_MIGRATED = "lure-loadout-migrated";
const LS_SYNCED   = "lure-loadout-last-synced";

export interface SyncState {
  lures:         Lure[];
  rods:          Rod[];
  reels:         Reel[];
  trips:         Trip[];
  targetSpecies: TargetSpecies;
  onboarded:     boolean;
  loading:       boolean;
  syncing:       boolean;
  syncError:     string | null;
  lastSynced:    string | null;   // ISO timestamp of last successful push
  hasPendingMigration: boolean;
}

function ls<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    lures: [], rods: [], reels: [], trips: [],
    targetSpecies: "Bass", onboarded: false,
    loading: true, syncing: false, syncError: null,
    lastSynced: null,
    hasPendingMigration: false,
  });

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef  = useRef(state);
  stateRef.current = state;

  // ── Initial load from Supabase ──────────────────────────────────────────
  useEffect(() => {
    // Restore last-synced timestamp from cache while loading
    const cachedSynced = localStorage.getItem(LS_SYNCED);
    if (cachedSynced) setState((s) => ({ ...s, lastSynced: cachedSynced }));

    (async () => {
      try {
        const res  = await fetch("/api/sync");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        const hasCloudData =
          data.lures.length > 0 || data.rods.length > 0 ||
          data.reels.length > 0 || data.trips.length > 0;

        const alreadyMigrated = localStorage.getItem(LS_MIGRATED) === "true";
        const lsLures   = ls<Lure[]>(LS_LURES, []);
        const lsHasData = lsLures.length > 0 || ls<Rod[]>(LS_RODS, []).length > 0;
        const hasPendingMigration = !hasCloudData && lsHasData && !alreadyMigrated;

        if (hasCloudData) {
          lsSet(LS_LURES,   data.lures);
          lsSet(LS_RODS,    data.rods);
          lsSet(LS_REELS,   data.reels);
          lsSet(LS_TRIPS,   data.trips);
          if (data.targetSpecies) lsSet(LS_SPECIES, data.targetSpecies);
          lsSet(LS_ONBOARD, data.onboarded);

          setState((s) => ({
            ...s,
            lures:         data.lures,
            rods:          data.rods,
            reels:         data.reels,
            trips:         data.trips,
            targetSpecies: data.targetSpecies ?? s.targetSpecies,
            onboarded:     data.onboarded,
            loading:       false,
            hasPendingMigration: false,
          }));
        } else {
          const species   = ls<TargetSpecies>(LS_SPECIES, "Bass");
          const onboarded = ls<boolean>(LS_ONBOARD, false);
          setState((s) => ({
            ...s,
            lures:         lsLures.length > 0 ? lsLures : hasPendingMigration ? lsLures : DEFAULT_LURES,
            rods:          ls<Rod[]>(LS_RODS,   []),
            reels:         ls<Reel[]>(LS_REELS, []),
            trips:         ls<Trip[]>(LS_TRIPS, []),
            targetSpecies: species,
            onboarded,
            loading:       false,
            hasPendingMigration,
          }));
        }
      } catch (err) {
        console.warn("Sync load failed, using localStorage:", err);
        setState((s) => ({
          ...s,
          lures:         ls<Lure[]>(LS_LURES,   DEFAULT_LURES),
          rods:          ls<Rod[]>(LS_RODS,      []),
          reels:         ls<Reel[]>(LS_REELS,    []),
          trips:         ls<Trip[]>(LS_TRIPS,    []),
          targetSpecies: ls<TargetSpecies>(LS_SPECIES, "Bass"),
          onboarded:     ls<boolean>(LS_ONBOARD, false),
          loading:       false,
          syncError:     "Offline — changes saved locally.",
        }));
      }
    })();
  }, []);

  // ── Debounced push to Supabase ──────────────────────────────────────────
  const schedulePush = useCallback((patch: Partial<SyncState>) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const s = stateRef.current;
      setState((prev) => ({ ...prev, syncing: true, syncError: null }));
      try {
        const body: Record<string, unknown> = {};
        if ("lures"  in patch) body.lures  = patch.lures;
        if ("rods"   in patch) body.rods   = patch.rods;
        if ("reels"  in patch) body.reels  = patch.reels;
        if ("trips"  in patch) body.trips  = patch.trips;
        if ("targetSpecies" in patch || "onboarded" in patch) {
          body.targetSpecies = patch.targetSpecies ?? s.targetSpecies;
          body.onboarded     = patch.onboarded     ?? s.onboarded;
        }
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        const now = new Date().toISOString();
        localStorage.setItem(LS_SYNCED, now);
        setState((prev) => ({ ...prev, syncing: false, lastSynced: now, syncError: null }));
      } catch (err) {
        console.error("Sync push failed:", err);
        setState((prev) => ({ ...prev, syncing: false, syncError: "Sync failed — changes saved locally." }));
      }
    }, 800);
  }, []);

  // ── Generic updater ─────────────────────────────────────────────────────
  function update<K extends keyof SyncState>(key: K, value: SyncState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    if (key === "lures")         lsSet(LS_LURES,   value);
    if (key === "rods")          lsSet(LS_RODS,    value);
    if (key === "reels")         lsSet(LS_REELS,   value);
    if (key === "trips")         lsSet(LS_TRIPS,   value);
    if (key === "targetSpecies") lsSet(LS_SPECIES, value);
    if (key === "onboarded")     lsSet(LS_ONBOARD, value);
    schedulePush({ [key]: value });
  }

  // ── Manual backup (migrate or re-push all data) ─────────────────────────
  const backupToCloud = useCallback(async () => {
    const s = stateRef.current;
    setState((prev) => ({ ...prev, syncing: true, hasPendingMigration: false, syncError: null }));
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lures: s.lures, rods: s.rods, reels: s.reels, trips: s.trips,
          targetSpecies: s.targetSpecies, onboarded: s.onboarded,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const now = new Date().toISOString();
      localStorage.setItem(LS_SYNCED,   now);
      localStorage.setItem(LS_MIGRATED, "true");
      setState((prev) => ({ ...prev, syncing: false, lastSynced: now, syncError: null }));
    } catch {
      setState((prev) => ({ ...prev, syncing: false, syncError: "Backup failed — try again." }));
    }
  }, []);

  const dismissMigration = () => {
    localStorage.setItem(LS_MIGRATED, "true");
    setState((prev) => ({ ...prev, hasPendingMigration: false }));
  };

  return { state, update, backupToCloud, dismissMigration };
}
