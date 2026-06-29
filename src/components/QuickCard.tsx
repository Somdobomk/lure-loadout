"use client";

import { Button } from "./Button";
import { TextField, SelectField } from "./Fields";
import { fieldCls as inputCls, labelCls } from "@/lib/classes";
import { useState, useEffect, useRef } from "react";
import {
  Lure, Conditions, TargetSpecies, SPECIES_PROFILES,
  WATER_CLARITY, WEATHER, SEASONS, TIME_OF_DAY, SPECIES,
  QuickCard as QuickCardType, QuickCardTimeBlock, QuickCardDecisionRule,
} from "@/lib/types";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  lures: Lure[];
  targetSpecies: TargetSpecies;
}

import { fieldCls as inputCls, labelCls } from "@/lib/classes";

const MOOD_COLORS: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  dawn:      { bg: "bg-purple-900/30",  border: "border-purple-500/40",  label: "text-purple-300", icon: "🌅" },
  morning:   { bg: "bg-gb-yellow2/10",  border: "border-gb-yellow2/40",  label: "text-gb-yellow",  icon: "☀️" },
  midday:    { bg: "bg-gb-red2/10",     border: "border-gb-red2/40",     label: "text-gb-red",     icon: "🔆" },
  afternoon: { bg: "bg-gb-orange/10",   border: "border-gb-orange/40",   label: "text-gb-orange",  icon: "🌤" },
  evening:   { bg: "bg-blue-900/30",    border: "border-blue-500/40",    label: "text-gb-blue",    icon: "🌙" },
};

const ROLE_COLORS: Record<string, string> = {
  "PRIMARY":     "bg-gb-green2 text-gb-bg",
  "FOLLOW-UP":   "bg-gb-yellow2 text-gb-bg",
  "SITUATIONAL": "bg-gb-orange/80 text-gb-bg",
  "CLEANUP":     "bg-gb-border2 text-gb-fg",
};

const DECISION_COLORS: Record<string, string> = {
  green:  "border-gb-green2 bg-gb-green2/10 text-gb-green",
  yellow: "border-gb-yellow2 bg-gb-yellow2/10 text-gb-yellow",
  orange: "border-gb-orange bg-gb-orange/10 text-gb-orange",
  blue:   "border-gb-blue bg-gb-blue/10 text-gb-blue",
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function cacheAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function TimeBlock({ block }: { block: QuickCardTimeBlock }) {
  const mood = MOOD_COLORS[block.mood] ?? MOOD_COLORS.morning;
  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm ${mood.bg} ${mood.border}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${mood.border}`}>
        <div className="flex items-center gap-2">
          <span>{mood.icon}</span>
          <div>
            <div className={`font-bold text-sm ${mood.label}`}>{block.time}</div>
            <div className="text-gb-faint text-[10px] uppercase tracking-widest font-semibold">{block.label}</div>
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 border-b border-white/5">
        <p className="text-gb-fg2 text-xs leading-relaxed">{block.focus}</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {block.rods.map((rod) => (
          <div key={rod.number} className="flex gap-3 items-start">
            <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${ROLE_COLORS[rod.role] ?? "bg-gb-border text-gb-fg"}`}>
              {rod.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gb-fg text-sm">{rod.lure}</span>
                <span className="text-gb-yellow text-xs font-semibold">{rod.color}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ROLE_COLORS[rod.role] ?? "bg-gb-border text-gb-fg"}`}>{rod.role}</span>
              </div>
              <ul className="space-y-0.5">
                {rod.tips.map((tip, i) => (
                  <li key={i} className="text-gb-fg2 text-xs flex gap-1.5 items-start">
                    <span className="text-gb-faint shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionRule({ rule }: { rule: QuickCardDecisionRule }) {
  const cls = DECISION_COLORS[rule.color] ?? DECISION_COLORS.green;
  return (
    <div className={`flex-1 min-w-[140px] rounded-xl border p-3 ${cls}`}>
      <div className="font-bold text-sm mb-0.5">{rule.lureType}</div>
      <div className="font-semibold text-xs mb-2 opacity-80">{rule.meaning}</div>
      <div className="text-[11px] opacity-70 leading-relaxed">{rule.ifItWorks}</div>
    </div>
  );
}

export default function QuickCard({ lures, targetSpecies }: Props) {
  const { subscribed, loading, startCheckout, openPortal, customerId, checkoutError, clearCheckoutError } = useSubscription();
  const profile = SPECIES_PROFILES[targetSpecies];

  const [conditions, setConditions] = useState<Conditions>({
    clarity: "Clear", weather: "Sunny & Calm", season: "Summer",
    timeOfDay: "Morning", species: targetSpecies === "All Species" ? "Bass" : targetSpecies, notes: "",
  });
  const [card, setCard]           = useState<QuickCardType | null>(null);
  const [cardUsage, setCardUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [savedAt, setSavedAt]     = useState<string | null>(null);
  const [fetching, setFetching]   = useState(false);
  const [progress, setProgress]   = useState("");
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [syncing, setSyncing]     = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const set = (key: keyof Conditions, val: string) => setConditions((c) => ({ ...c, [key]: val }));

  // ── Load from Supabase on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!subscribed) return;
    fetch("/api/usage").then(r => r.json()).then(d => { if (d.quick_card) setCardUsage(d.quick_card); }).catch(() => {});
    (async () => {
      setSyncing(true);
      try {
        const res  = await fetch("/api/quickcard-sync");
        const data = await res.json();
        if (data.card && data.savedAt) {
          const age = Date.now() - new Date(data.savedAt).getTime();
          if (age < CACHE_TTL) {
            setCard(data.card);
            setSavedAt(data.savedAt);
            if (data.conditions) setConditions(data.conditions);
          }
        }
      } catch { /* fail silently */ }
      setSyncing(false);
    })();
  }, [subscribed]);

  // ── Generate ─────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!lures.length) { setError("Add some lures to your inventory first."); return; }
    setFetching(true); setCard(null); setError(""); setProgress("Reviewing your tackle inventory…");
    const steps = [
      { delay: 3000,  msg: "Building your time-blocked game plan…" },
      { delay: 8000,  msg: "Selecting the best 4-rod loadout…" },
      { delay: 15000, msg: "Writing your decision rules…" },
      { delay: 25000, msg: "Finalizing your Quick Card…" },
      { delay: 40000, msg: "This one's taking a moment — AI is working hard…" },
    ];
    const timers = steps.map(({ delay, msg }) => setTimeout(() => setProgress(msg), delay));
    try {
      const res = await fetch("/api/quickcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lures, conditions, aiContext: profile.aiContext }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error(errData.error || "Daily limit reached. Resets at midnight UTC.");
        }
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const newCard = await res.json();
      setCard(newCard);
      const now = new Date().toISOString();
      setSavedAt(now);
      setCardUsage(u => u ? { ...u, used: u.used + 1, remaining: Math.max(0, u.remaining - 1) } : null);
      // Push to Supabase in background
      fetch("/api/quickcard-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card: newCard, conditions }),
      }).catch(console.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate quick card — try again.");
    }
    timers.forEach(clearTimeout);
    setProgress("");
    setFetching(false);
  };

  // ── Save as image ─────────────────────────────────────────────────────────
  // Uses html-to-image (better WebKit/iOS support than html2canvas)
  // Falls back to Web Share API on iOS where <a>.click() downloads don't work
  const saveAsImage = async () => {
    if (!cardRef.current || !card) return;
    setSaving(true); setSaveMsg("");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#1d2021",
        pixelRatio: 2,         // 2× retina quality
        skipFonts: false,
      });

      const filename = `lureloadout-quickcard-${new Date().toISOString().split("T")[0]}.png`;

      // iOS Safari: use Web Share API to save to Photos
      if (navigator.share && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          title: "LureLoadout Quick Card",
          text:  "My fishing game plan for today",
          files: [file],
        });
        setSaveMsg("Shared successfully!");
      } else {
        // Desktop / Android: standard download link
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        setSaveMsg("Image saved!");
      }
    } catch (err) {
      // User cancelled share is not an error
      if (err instanceof Error && err.name === "AbortError") {
        setSaveMsg("");
      } else {
        console.error("saveAsImage error:", err);
        setSaveMsg("Save failed — try long-pressing the card to save instead.");
      }
    }
    setTimeout(() => setSaveMsg(""), 4000);
    setSaving(false);
  };

  const conditionFields: Array<{ label: string; key: keyof Conditions; options: string[] }> = [
    { label: "Water Clarity",  key: "clarity",   options: WATER_CLARITY },
    { label: "Weather",        key: "weather",   options: WEATHER },
    { label: "Season",         key: "season",    options: SEASONS },
    { label: "Time of Day",    key: "timeOfDay", options: TIME_OF_DAY },
    { label: "Target Species", key: "species",   options: SPECIES },
  ];

  // ── Paywall ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="text-center py-20 text-gb-faint text-xs uppercase tracking-widest">Checking subscription…</div>
  );

  if (!subscribed) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">🃏</div>
      <div className="text-gb-yellow font-bold uppercase tracking-widest text-sm mb-2">Quick Card — Pro Feature</div>
      <p className="text-gb-muted text-sm max-w-sm mb-2 leading-relaxed">
        Get a time-blocked 4-rod game plan tailored to your inventory and today&apos;s exact conditions.
      </p>
      <p className="text-gb-faint text-xs mb-6">$4.99 / month · Cancel any time</p>
      {checkoutError && (
        <div className="mb-4 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl max-w-sm text-left">
          ⚠️ {checkoutError}
          <button onClick={clearCheckoutError} className="ml-2 text-gb-dark hover:text-gb-red text-xs underline">dismiss</button>
        </div>
      )}
      <button onClick={startCheckout} className="px-8 py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green transition-all mb-6 shadow-sm">
        Unlock Quick Card →
      </button>
      <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 max-w-sm w-full text-left">
        <div className="text-gb-yellow text-[10px] uppercase tracking-widest font-bold mb-3">What you get</div>
        {["Time-blocked game plan (2–3 windows)", "4-rod loadout from your actual inventory", "Role labels: Primary, Follow-Up, Situational, Cleanup", "Decision rules for when to switch lures", "Save as image · Syncs across all your devices"].map((f) => (
          <div key={f} className="flex gap-2 items-start mb-2">
            <span className="text-gb-green mt-0.5">✓</span>
            <span className="text-gb-fg2 text-xs">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Subscribed view ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Pro badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-gb-border border border-gb-yellow text-gb-yellow text-[10px] uppercase tracking-widest rounded-full font-bold">⚡ Pro</span>
          <span className="text-gb-faint text-[11px]">{profile.emoji} {targetSpecies}</span>
          {syncing && <span className="text-gb-faint text-[11px] animate-pulse">· loading…</span>}
        </div>
        {customerId && (
          <button onClick={openPortal} className="text-gb-faint text-[11px] hover:text-gb-muted transition-colors underline underline-offset-2">Manage subscription</button>
        )}
      </div>

      {/* Conditions form */}
      <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
        <div className="text-gb-fg font-semibold text-sm mb-4">Today&apos;s conditions</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {conditionFields.map(({ label, key, options }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <select className={inputCls} value={conditions[key]} onChange={(e) => set(key, e.target.value)}>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className={labelCls}>Extra notes</label>
            <input className={inputCls} value={conditions.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Location, water temp…" />
          </div>
        </div>
        {/* Usage counter */}
        {cardUsage && (
          <div className="flex items-center justify-end mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cardUsage.remaining === 0 ? "bg-gb-red2/20 text-gb-red" : cardUsage.remaining === 1 ? "bg-gb-yellow2/20 text-gb-yellow" : "bg-gb-surface text-gb-faint"}`}>
              {cardUsage.remaining}/{cardUsage.limit} cards left today
            </span>
          </div>
        )}

        {fetching && (
          <p className="text-gb-faint text-xs text-center mb-3">
            Feel free to switch tabs — your card will be ready when you return.
          </p>
        )}
        <button onClick={generate} disabled={fetching}
          className="w-full py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2">
          {fetching && <span className="inline-block w-3.5 h-3.5 border-2 border-gb-bg/30 border-t-gb-bg rounded-full animate-spin" />}
          {fetching ? (progress || "Starting…") : card ? "Regenerate card" : "Generate Quick Card"}
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl">{error}</div>}

      {/* ── Card output ── */}
      {card && (
        <div className="space-y-4">
          {/* Sync / cache indicator */}
          {savedAt && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-gb-bg border border-gb-border rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gb-green2" />
                <span className="text-gb-faint text-xs">Synced across devices · generated {cacheAge(savedAt)}</span>
              </div>
              <button onClick={() => { setCard(null); setSavedAt(null); }}
                className="text-gb-dark text-xs hover:text-gb-muted transition-colors">
                Clear ✕
              </button>
            </div>
          )}

          {/* The card — ref'd for image capture */}
          <div ref={cardRef} className="space-y-4 bg-gb-bg p-1 rounded-2xl">
            {/* Header */}
            <div className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-gradient-to-r from-gb-green2/20 to-gb-yellow2/10 border-b border-gb-border">
                <div className="text-gb-yellow font-bold text-lg leading-tight mb-1">{card.headline}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gb-faint text-xs uppercase tracking-widest">Best window:</span>
                  <span className="text-gb-green font-semibold text-sm">{card.bestWindow}</span>
                  <span className="text-gb-border2">·</span>
                  <span className="text-gb-orange text-xs font-semibold uppercase tracking-wide">Be ready to adapt</span>
                </div>
              </div>
              <div className="px-5 py-3">
                <div className="text-gb-faint text-[10px] uppercase tracking-widest mb-1">One line strategy</div>
                <div className="text-gb-fg font-semibold text-sm">{card.oneLineStrategy}</div>
              </div>
            </div>

            {/* Time blocks */}
            <div className="space-y-3">
              {card.timeBlocks?.map((block, i) => <TimeBlock key={i} block={block} />)}
            </div>

            {/* Decision rules */}
            {card.decisionRules?.length > 0 && (
              <div className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-gb-border">
                  <div className="text-gb-fg font-semibold text-sm">Decision rules</div>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {card.decisionRules.map((rule, i) => <DecisionRule key={i} rule={rule} />)}
                </div>
              </div>
            )}

            {/* Pro tip */}
            {card.proTip && (
              <div className="bg-gb-surface border border-gb-border border-l-2 border-l-gb-yellow2 rounded-2xl p-4 shadow-sm">
                <div className="text-gb-yellow font-bold uppercase tracking-widest text-[11px] mb-1.5">💡 Pro Tip</div>
                <div className="text-gb-muted text-sm leading-relaxed">{card.proTip}</div>
              </div>
            )}

            {/* Branding watermark for saved image */}
            <div className="text-center py-1">
              <span className="text-gb-dark text-[10px] uppercase tracking-widest">LureLoadout · Know what to throw</span>
            </div>
          </div>

          {/* Save as image button */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button onClick={saveAsImage} disabled={saving}
              className="w-full py-2.5 rounded-xl border border-gb-border2 text-gb-blue text-sm font-semibold hover:bg-gb-border2 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {saving ? "Saving image…" : "Save as image"}
            </button>
            {saveMsg && (
              <p className={`text-xs font-medium ${saveMsg.includes("failed") ? "text-gb-red" : "text-gb-green"}`}>
                {saveMsg}
              </p>
            )}
            <p className="text-gb-dark text-[11px] text-center">
              Card syncs automatically across your devices for 24 hours
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
