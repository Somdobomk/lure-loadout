"use client";

import { TargetSpecies, SPECIES_PROFILES } from "@/lib/types";
import { UserButton } from "@clerk/nextjs";
import { useSync } from "@/hooks/useSync";
import Inventory from "./Inventory";
import RodReelInventory from "./RodReelInventory";
import DailyPicks from "./DailyPicks";
import TripLog from "./TripLog";
import SearchBar from "./SearchBar";
import OnboardingModal from "./OnboardingModal";
import SettingsModal from "./SettingsModal";
import HelpPage from "./HelpPage";
import QuickCard from "./QuickCard";
import MigrationBanner from "./MigrationBanner";
import { useState } from "react";

type View = "inventory" | "rodsreels" | "recommendations" | "quickcard" | "trips" | "help";

const NAV: { key: View; label: string; icon: string }[] = [
  { key: "inventory",       label: "Lures",        icon: "🪝" },
  { key: "rodsreels",       label: "Rods & Reels",  icon: "🎣" },
  { key: "trips",           label: "Trip Log",      icon: "📋" },
  { key: "recommendations", label: "Daily Picks",   icon: "✨" },
  { key: "quickcard",       label: "Quick Card",    icon: "🃏" },
  { key: "help",            label: "Help",          icon: "❓" },
];

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function download(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LureLoadout() {
  const { state, update, backupToCloud, dismissMigration } = useSync();
  const [view, setView] = useState<View>("inventory");
  const [showSettings, setShowSettings] = useState(false);

  const { lures, rods, reels, trips, targetSpecies, onboarded,
          loading, syncing, syncError, lastSynced, hasPendingMigration } = state;

  const profile = SPECIES_PROFILES[targetSpecies];

  const handleSelectSpecies = (species: TargetSpecies) => {
    update("targetSpecies", species);
    update("onboarded", true);
  };

  // ── Generic collection updaters ─────────────────────────────────────────
  const saveLures  = (v: typeof lures)  => update("lures",  v);
  const saveRods   = (v: typeof rods)   => update("rods",   v);
  const saveReels  = (v: typeof reels)  => update("reels",  v);
  const saveTrips  = (v: typeof trips)  => update("trips",  v);

  if (loading) {
    return (
      <div className="min-h-screen bg-gb-bg flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-pulse">🪝</div>
        <div className="text-gb-faint text-sm">Loading your tackle…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gb-bg">
      {!onboarded && <OnboardingModal onSelect={handleSelectSpecies} />}
      {showSettings && <SettingsModal current={targetSpecies} onSelect={handleSelectSpecies} onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <header
        className="header-glass sticky top-0 z-20"
        style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}
      >
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gb-green2 flex items-center justify-center text-base shadow-lg">🪝</div>
              <div>
                <div className="text-gb-fg font-bold text-[15px] leading-none tracking-tight">LureLoadout</div>
                <div className="text-gb-faint text-[11px] mt-0.5 font-medium flex items-center gap-1.5">
                  {profile.emoji} {targetSpecies}
                  {/* Sync indicator */}
                  {syncing && <span className="text-gb-yellow2 text-[10px] animate-pulse">· syncing…</span>}
                  {syncError && !syncing && <span className="text-gb-orange text-[10px]" title={syncError}>· offline</span>}
                  {lastSynced && !syncing && !syncError && (
                    <span className="text-gb-green2 text-[10px]" title={`Last synced: ${new Date(lastSynced).toLocaleString()}`}>
                      · synced {formatRelative(lastSynced)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <SearchBar lures={lures} rods={rods} reels={reels} onNavigate={(tab) => setView(tab as View)} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowSettings(true)} title="Target species settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gb-faint hover:text-gb-fg hover:bg-gb-border transition-all duration-150">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14M12 2v2m0 18v2M2 12h2m18 0h2"/>
                </svg>
              </button>
              <UserButton />
            </div>
          </div>
          <div className="flex gap-1 p-1 bg-gb-bg rounded-xl">
            {NAV.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setView(key)}
                className={["flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[12px] font-semibold transition-all duration-200",
                  view === key ? "bg-gb-surface text-gb-yellow shadow-sm" : "text-gb-faint hover:text-gb-muted hover:bg-gb-surface/50",
                ].join(" ")}>
                <span className="text-sm">{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Migration banner */}
      {hasPendingMigration && (
        <MigrationBanner onMigrate={backupToCloud} onDismiss={dismissMigration} syncing={syncing} />
      )}

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-5"
        style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

        {view === "inventory" && (
          <Inventory
            lures={lures} profile={profile}
            onSaveLure={(lure, id) => saveLures(id !== undefined ? lures.map((l) => l.id === id ? { ...lure, id } : l) : [...lures, { ...lure, id: Date.now() }])}
            onDelete={(id) => { if (confirm("Remove this lure?")) saveLures(lures.filter((l) => l.id !== id)); }}
            onAdjustQty={(id, d) => saveLures(lures.map((l) => l.id === id ? { ...l, quantity: Math.max(0, l.quantity + d) } : l))}
            onImport={(imported) => { const e = new Set(lures.map((l) => l.name.toLowerCase())); saveLures([...lures, ...imported.filter((l) => !e.has(l.name.toLowerCase()))]); }}
            onExport={() => download(lures, "lure-loadout-lures.json")}
            onMassDelete={(ids) => saveLures(lures.filter((l) => !ids.includes(l.id)))}
          />
        )}
        {view === "rodsreels" && (
          <RodReelInventory
            rods={rods} reels={reels} profile={profile}
            onSaveRod={(rod, id) => saveRods(id !== undefined ? rods.map((r) => r.id === id ? { ...rod, id } : r) : [...rods, { ...rod, id: Date.now() }])}
            onDeleteRod={(id) => { if (confirm("Remove this rod?")) saveRods(rods.filter((r) => r.id !== id)); }}
            onSaveReel={(reel, id) => saveReels(id !== undefined ? reels.map((r) => r.id === id ? { ...reel, id } : r) : [...reels, { ...reel, id: Date.now() }])}
            onDeleteReel={(id) => { if (confirm("Remove this reel?")) saveReels(reels.filter((r) => r.id !== id)); }}
            onImportRods={(imported) => { const e = new Set(rods.map((r) => r.name.toLowerCase())); saveRods([...rods, ...imported.filter((r) => !e.has(r.name.toLowerCase()))]); }}
            onExportRods={() => download(rods, "lure-loadout-rods.json")}
            onImportReels={(imported) => { const e = new Set(reels.map((r) => r.name.toLowerCase())); saveReels([...reels, ...imported.filter((r) => !e.has(r.name.toLowerCase()))]); }}
            onExportReels={() => download(reels, "lure-loadout-reels.json")}
          />
        )}
        {view === "trips" && (
          <TripLog trips={trips} lures={lures}
            onSaveTrip={(trip, id) => saveTrips(id !== undefined ? trips.map((t) => t.id === id ? { ...trip, id } : t) : [...trips, { ...trip, id: Date.now() }])}
            onDeleteTrip={(id) => saveTrips(trips.filter((t) => t.id !== id))}
          />
        )}
        {view === "recommendations" && <DailyPicks lures={lures} targetSpecies={targetSpecies} />}
        {view === "quickcard" && <QuickCard lures={lures} targetSpecies={targetSpecies} />}
        {view === "help" && <HelpPage onBackupToCloud={backupToCloud} syncing={syncing} lastSynced={lastSynced} syncError={syncError} />}
      </main>
    </div>
  );
}
