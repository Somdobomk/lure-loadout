"use client";

import { TargetSpecies, SPECIES_PROFILES } from "@/lib/types";
import { UserButton } from "@clerk/nextjs";
import { useSync } from "@/hooks/useSync";
import Inventory from "./Inventory";
import RodReelInventory from "./RodReelInventory";
import DailyPicks from "./DailyPicks";
import QuickCard from "./QuickCard";
import TripLog from "./TripLog";
import SearchBar from "./SearchBar";
import OnboardingModal from "./OnboardingModal";
import SettingsModal from "./SettingsModal";
import HelpPage from "./HelpPage";
import MigrationBanner from "./MigrationBanner";
import { Button } from "./Button";
import { TextField, SelectField } from "./Fields";
import { useState, useRef, useEffect, useCallback } from "react";

type View = "inventory" | "rodsreels" | "recommendations" | "quickcard" | "trips" | "help";

const NAV: { key: View; label: string; icon: React.ReactNode }[] = [
  {
    key: "inventory",
    label: "Lures",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 4C6 4 4 6 4 9C4 12 6 13 8 13C10 13 11 12 12 11L20 4L16 8" />
        <path d="M12 11L8 16C7 17.5 7 19 8.5 20C10 21 11.5 20.5 12.5 19L15 16" />
        <circle cx="17" cy="7" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "rodsreels",
    label: "Rods",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="4" y1="20" x2="20" y2="4" />
        <path d="M16 4L20 4L20 8" />
        <circle cx="8" cy="16" r="2" />
        <line x1="8" y1="14" x2="8" y2="10" />
      </svg>
    ),
  },
  {
    key: "trips",
    label: "Trips",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    key: "recommendations",
    label: "Picks",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: "quickcard",
    label: "Card",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

function download(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LureLoadout() {
  const { state, update, backupToCloud, dismissMigration } = useSync();
  const [view, setView] = useState<View>("inventory");
  const [showSettings, setShowSettings] = useState(false);
  const [navVisible, setNavVisible]     = useState(true);
  const lastScrollY  = useRef(0);
  const scrollRef    = useRef<HTMLDivElement>(null);

  const { lures, rods, reels, trips, targetSpecies, onboarded,
          loading, syncing, syncError, lastSynced, hasPendingMigration } = state;

  const profile = SPECIES_PROFILES[targetSpecies];

  const handleSelectSpecies = (species: TargetSpecies) => {
    update("targetSpecies", species);
    update("onboarded", true);
  };

  const saveLures  = (v: typeof lures)  => update("lures",  v);
  const saveRods   = (v: typeof rods)   => update("rods",   v);
  const saveReels  = (v: typeof reels)  => update("reels",  v);
  const saveTrips  = (v: typeof trips)  => update("trips",  v);

  // Hide nav on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    const diff = currentY - lastScrollY.current;
    if (diff > 8)  setNavVisible(false);   // scrolling down — hide
    if (diff < -8) setNavVisible(true);    // scrolling up  — show
    if (currentY < 50) setNavVisible(true); // near top — always show
    lastScrollY.current = currentY;
  }, []);

  const VIEW_TITLES: Record<View, string> = {
    inventory:       "Lure inventory",
    rodsreels:       "Rods & reels",
    trips:           "Trip log",
    recommendations: "Daily picks",
    quickcard:       "Quick card",
    help:            "Help",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gb-bg flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gb-green2 flex items-center justify-center text-xl animate-pulse">🪝</div>
        <div className="text-gb-faint text-sm">Loading your tackle…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gb-bg">
      {!onboarded && <OnboardingModal onSelect={handleSelectSpecies} />}
      {showSettings && <SettingsModal current={targetSpecies} onSelect={handleSelectSpecies} onClose={() => setShowSettings(false)} />}

      {/* ── Pocket-style app shell ──────────────────────────────────────── */}
      {/* Dark header band */}
      <div
        className="bg-gb-bg shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Top bar: menu / brand / avatar — Pocket pattern */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gb-surface border border-gb-border text-gb-faint hover:text-gb-fg transition-colors"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14M12 2v2m0 18v2M2 12h2m18 0h2"/>
            </svg>
          </button>

          {/* Brand center */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gb-green2 flex items-center justify-center text-sm font-bold text-gb-bg">🪝</div>
            <span className="text-gb-fg font-bold text-[15px] tracking-tight">LureLoadout</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Help — mobile only (desktop uses top nav) */}
            <button
              onClick={() => setView("help")}
              className={[
                "md:hidden w-8 h-8 flex items-center justify-center rounded-xl border transition-colors",
                view === "help" ? "bg-gb-yellow/10 border-gb-yellow text-gb-yellow" : "bg-gb-surface border-gb-border text-gb-faint hover:text-gb-fg",
              ].join(" ")}
              aria-label="Help"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <UserButton />
          </div>
        </div>

        {/* Page title + sync status — contextual header */}
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-gb-fg font-bold text-2xl leading-none tracking-tight">
                {VIEW_TITLES[view]}
              </h1>
              <p className="text-gb-faint text-[11px] mt-1 font-medium">
                {profile.emoji} {targetSpecies}
                {syncing && <span className="text-gb-yellow2 ml-2 animate-pulse">· syncing…</span>}
                {syncError && !syncing && <span className="text-gb-orange ml-2" title={syncError}>· offline</span>}
                {lastSynced && !syncing && !syncError && (
                  <span className="text-gb-green2 ml-2" title={`Last synced: ${new Date(lastSynced).toLocaleString()}`}>
                    · synced {formatRelative(lastSynced)}
                  </span>
                )}
              </p>
            </div>
            {/* Search */}
            <div className="w-36">
              <SearchBar lures={lures} rods={rods} reels={reels} onNavigate={(tab) => setView(tab as View)} />
            </div>
          </div>
        </div>

        {/* ── Desktop / tablet horizontal nav — hidden on mobile ── */}
        <nav className="hidden md:flex items-center gap-1 px-5 pb-3">
          {[...NAV, { key: "help" as View, label: "Help", icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )}].map(({ key, label, icon }) => {
            const active = view === key;
            return (
              <button key={key} onClick={() => setView(key)}
                className={["flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
                  active ? "bg-gb-bg text-gb-yellow shadow-sm" : "text-gb-faint hover:text-gb-muted hover:bg-gb-bg/50",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span className={`transition-colors ${active ? "text-gb-yellow" : "text-gb-dark"}`}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Pocket signature: rounded-t-2xl body panel lifts from below ── */}
      <div className="flex-1 bg-gb-surface rounded-t-3xl overflow-hidden flex flex-col">

        {/* Migration banner sits inside the panel */}
        {hasPendingMigration && (
          <MigrationBanner onMigrate={backupToCloud} onDismiss={dismissMigration} syncing={syncing} />
        )}

        {/* Scrollable content area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto [--nav-padding:80px] md:[--nav-padding:24px]"
          style={{ paddingBottom: "calc(var(--nav-padding, 80px) + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="max-w-2xl mx-auto px-4 pt-5">
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
          </div>
        </div>

        {/* ── Mobile bottom tab bar — hidden on md+ (desktop uses top nav) ── */}
        {/* Hides on scroll down, shows on scroll up. 5 primary tabs only — Help is in header. */}
        <div
          className={[
            "md:hidden shrink-0 bg-gb-surface border-t border-gb-border transition-transform duration-300 ease-in-out",
            navVisible ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
          style={{
            position: "sticky",
            bottom: 0,
            paddingBottom: "env(safe-area-inset-bottom, 12px)",
          }}
        >
          <div className="flex">
            {NAV.map(({ key, label, icon }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-1.5 transition-colors min-w-0"
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                >
                  <div className={`w-1 h-1 rounded-full mb-0.5 transition-all ${active ? "bg-gb-yellow" : "bg-transparent"}`} />
                  <div className={`transition-colors ${active ? "text-gb-yellow" : "text-gb-dark"}`}>
                    {icon}
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors leading-tight ${active ? "text-gb-yellow" : "text-gb-dark"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
