"use client";

import { useState } from "react";
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

const labelCls = "block text-[11px] text-gb-faint font-semibold uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-3 py-2 bg-gb-bg border border-gb-border text-gb-fg text-sm rounded-xl focus:outline-none focus:border-gb-green2 focus:ring-1 focus:ring-gb-green2/30 transition-all";

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

function TimeBlock({ block }: { block: QuickCardTimeBlock }) {
  const mood = MOOD_COLORS[block.mood] ?? MOOD_COLORS.morning;
  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm ${mood.bg} ${mood.border}`}>
      {/* Block header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${mood.border}`}>
        <div className="flex items-center gap-2">
          <span>{mood.icon}</span>
          <div>
            <div className={`font-bold text-sm ${mood.label}`}>{block.time}</div>
            <div className="text-gb-faint text-[10px] uppercase tracking-widest font-semibold">{block.label}</div>
          </div>
        </div>
      </div>
      {/* Focus */}
      <div className="px-4 py-2.5 border-b border-white/5">
        <p className="text-gb-fg2 text-xs leading-relaxed">{block.focus}</p>
      </div>
      {/* Rod lineup */}
      <div className="px-4 py-3 space-y-3">
        {block.rods.map((rod) => (
          <div key={rod.number} className="flex gap-3 items-start">
            {/* Rod number badge */}
            <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${ROLE_COLORS[rod.role] ?? "bg-gb-border text-gb-fg"}`}>
              {rod.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gb-fg text-sm">{rod.lure}</span>
                <span className="text-gb-yellow text-xs font-semibold">{rod.color}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ROLE_COLORS[rod.role] ?? "bg-gb-border text-gb-fg"}`}>
                  {rod.role}
                </span>
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
  const [card, setCard]         = useState<QuickCardType | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState("");

  const set = (key: keyof Conditions, val: string) => setConditions((c) => ({ ...c, [key]: val }));

  const generate = async () => {
    if (!lures.length) { setError("Add some lures to your inventory first."); return; }
    setFetching(true); setCard(null); setError("");
    try {
      const res = await fetch("/api/quickcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lures, conditions, aiContext: profile.aiContext }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      setCard(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't generate quick card — check your API key and try again."); }
    setFetching(false);
  };

  const conditionFields: Array<{ label: string; key: keyof Conditions; options: string[] }> = [
    { label: "Water Clarity",  key: "clarity",   options: WATER_CLARITY },
    { label: "Weather",        key: "weather",   options: WEATHER },
    { label: "Season",         key: "season",    options: SEASONS },
    { label: "Time of Day",    key: "timeOfDay", options: TIME_OF_DAY },
    { label: "Target Species", key: "species",   options: SPECIES },
  ];

  // ── Paywall ──────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="text-center py-20 text-gb-faint text-xs uppercase tracking-widest">Checking subscription…</div>;
  }

  if (!subscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-5xl mb-4">🃏</div>
        <div className="text-gb-yellow font-bold uppercase tracking-widest text-sm mb-2">Quick Card — Pro Feature</div>
        <p className="text-gb-muted text-sm max-w-sm mb-2 leading-relaxed">
          Get a time-blocked 4-rod game plan tailored to your inventory and today&apos;s exact conditions — just like a professional guide card.
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
          {[
            "Time-blocked game plan (2–3 windows)",
            "4-rod loadout from your actual inventory",
            "Role labels: Primary, Follow-Up, Situational, Cleanup",
            "Decision rules for when to switch lures",
            "One-line strategy + pro tip",
          ].map((f) => (
            <div key={f} className="flex gap-2 items-start mb-2">
              <span className="text-gb-green mt-0.5">✓</span>
              <span className="text-gb-fg2 text-xs">{f}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Subscribed view ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Pro badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-gb-border border border-gb-yellow text-gb-yellow text-[10px] uppercase tracking-widest rounded-full font-bold">⚡ Pro</span>
          <span className="text-gb-faint text-[11px]">{profile.emoji} {targetSpecies} · Quick Card</span>
        </div>
        {customerId && (
          <button onClick={openPortal} className="text-gb-faint text-[11px] hover:text-gb-muted transition-colors underline underline-offset-2">Manage subscription</button>
        )}
      </div>

      {/* Conditions form */}
      <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
        <div className="text-gb-fg font-semibold text-sm mb-4">Today&apos;s Conditions</div>
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
            <label className={labelCls}>Extra Notes</label>
            <input className={inputCls} value={conditions.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Location, water temp, structure…" />
          </div>
        </div>
        <button onClick={generate} disabled={fetching}
          className="w-full py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
          {fetching ? "Building your game plan… 🃏" : "Generate Quick Card"}
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl">{error}</div>}

      {/* ── Quick Card output ── */}
      {card && (
        <div className="space-y-4">
          {/* Header card */}
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
              <div className="text-gb-faint text-[10px] uppercase tracking-widest mb-1">One Line Strategy</div>
              <div className="text-gb-fg font-semibold text-sm">{card.oneLineStrategy}</div>
            </div>
          </div>

          {/* Time blocks */}
          <div className="space-y-3">
            {card.timeBlocks?.map((block, i) => (
              <TimeBlock key={i} block={block} />
            ))}
          </div>

          {/* Decision rules */}
          {card.decisionRules?.length > 0 && (
            <div className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gb-border">
                <div className="text-gb-fg font-semibold text-sm">Decision Rules</div>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {card.decisionRules.map((rule, i) => (
                  <DecisionRule key={i} rule={rule} />
                ))}
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
        </div>
      )}
    </div>
  );
}
