"use client";

import { useState, useEffect } from "react";
import { Lure, Conditions, Recommendations, WATER_CLARITY, WEATHER, SEASONS, TIME_OF_DAY, SPECIES, TargetSpecies, SPECIES_PROFILES } from "@/lib/types";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  lures: Lure[];
  targetSpecies: TargetSpecies;
}

const labelCls = "block text-[11px] text-gb-faint font-semibold uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-3 py-2 bg-gb-bg border border-gb-border text-gb-fg text-sm rounded-xl focus:outline-none focus:border-gb-green2 focus:ring-1 focus:ring-gb-green2/30 transition-all";


function cacheAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DailyPicks({ lures, targetSpecies }: Props) {
  const { subscribed, loading, startCheckout, openPortal, customerId, checkoutError, clearCheckoutError } = useSubscription();
  const profile = SPECIES_PROFILES[targetSpecies];

  const [conditions, setConditions] = useState<Conditions>({
    clarity: "Clear", weather: "Sunny & Calm", season: "Summer",
    timeOfDay: "Morning", species: targetSpecies === "All Species" ? "Bass" : targetSpecies, notes: "",
  });
  const [rec, setRec]           = useState<Recommendations | null>(null);
  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError]       = useState("");
  const [usage, setUsage]       = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [savedAt, setSavedAt]   = useState<string | null>(null);
  const [picksSyncing, setPicksSyncing] = useState(false);

  useEffect(() => {
    // Load usage counts
    fetch("/api/usage")
      .then(r => r.json())
      .then(d => { if (d.daily_picks) setUsage(d.daily_picks); })
      .catch(() => {});

    // Load cached picks from Supabase
    setPicksSyncing(true);
    fetch("/api/picks-sync")
      .then(r => r.json())
      .then(d => {
        if (d.picks && d.savedAt) {
          const age = Date.now() - new Date(d.savedAt).getTime();
          if (age < 24 * 60 * 60 * 1000) {
            setRec(d.picks);
            setSavedAt(d.savedAt);
            if (d.conditions) setConditions(d.conditions);
          }
        }
      })
      .catch(() => {})
      .finally(() => setPicksSyncing(false));

    // Auto-fill location in Extra Notes if permission is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { "User-Agent": "LureLoadout/1.0 (lureloadout.com)" } }
            );
            const data = await res.json();
            const city  = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            if (city || state) {
              const loc = [city, state].filter(Boolean).join(", ");
              setConditions(c => ({ ...c, notes: c.notes ? c.notes : `Location: ${loc}` }));
            }
          } catch {}
        },
        () => {} // permission denied — fail silently
      );
    }
  }, []);

  const set = (key: keyof Conditions, val: string) => setConditions((c) => ({ ...c, [key]: val }));

  const fetchRecs = async () => {
    if (!lures.length) { setError("Add some lures to your inventory first."); return; }
    setFetching(true); setRec(null); setError(""); setProgress("Analyzing your lure inventory…");
    const progressSteps = [
      { delay: 2000,  msg: "Checking today's conditions…" },
      { delay: 5000,  msg: "Matching lures to the conditions…" },
      { delay: 10000, msg: "Almost there — finalizing picks…" },
      { delay: 20000, msg: "Taking a little longer than usual — still working…" },
    ];
    const timers = progressSteps.map(({ delay, msg }) =>
      setTimeout(() => setProgress(msg), delay)
    );
    try {
      const res = await fetch("/api/recommend", {
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
      const newRec = await res.json();
      setRec(newRec);
      const now = new Date().toISOString();
      setSavedAt(now);
      setUsage(u => u ? { ...u, used: u.used + 1, remaining: Math.max(0, u.remaining - 1) } : null);
      // Save to Supabase in background
      fetch("/api/picks-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: newRec, conditions }),
      }).catch(console.error);
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't get recommendations — check your API key and try again."); }
    timers.forEach(clearTimeout);
    setProgress("");
    setFetching(false);
  };

  const conditionFields: Array<{ label: string; key: keyof Conditions; options: string[] }> = [
    { label: "Water Clarity",  key: "clarity",   options: WATER_CLARITY },
    { label: "Weather",        key: "weather",   options: WEATHER },
    { label: "Season",         key: "season",    options: SEASONS },
    { label: "Time of Day",    key: "timeOfDay", options: TIME_OF_DAY },
    { label: "Target Species", key: "species",   options: SPECIES },
  ];

  if (loading) {
    return <div className="text-center py-20 text-gb-faint text-xs uppercase tracking-widest">Checking subscription…</div>;
  }

  if (!subscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-5xl mb-4">🌤</div>
        <div className="text-gb-yellow font-bold uppercase tracking-widest text-sm mb-2">Daily Picks — Pro Feature</div>
        <p className="text-gb-muted text-sm max-w-sm mb-2 leading-relaxed">
          Get AI-powered {targetSpecies} lure recommendations tailored to your exact inventory, weather, water clarity, season, and conditions.
        </p>
        <p className="text-gb-faint text-xs mb-8">$4.99 / month · Cancel any time</p>
        {checkoutError && (
          <div className="mb-4 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl max-w-sm text-left">
            ⚠️ {checkoutError}
            <button onClick={clearCheckoutError} className="ml-2 text-gb-dark hover:text-gb-red text-xs underline">dismiss</button>
          </div>
        )}
        <button onClick={startCheckout} className="px-8 py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green transition-all mb-3 shadow-sm">
          Unlock Daily Picks →
        </button>
        <div className="mt-6 bg-gb-surface border border-gb-border rounded-2xl p-5 max-w-sm w-full text-left shadow-sm">
          <div className="text-gb-yellow text-[10px] uppercase tracking-widest font-bold mb-3">What you get</div>
          {["2–4 top lure picks from your actual inventory", `${profile.emoji} ${targetSpecies}-specific AI recommendations`, "Technique details for each pick", "What to skip and a daily pro tip"].map((f) => (
            <div key={f} className="flex gap-2 items-start mb-2">
              <span className="text-gb-green mt-0.5">✓</span>
              <span className="text-gb-fg2 text-xs">{f}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pro badge + species indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-gb-border border border-gb-yellow text-gb-yellow text-[10px] uppercase tracking-widest rounded-sm font-bold">⚡ Pro</span>
          <span className="text-gb-faint text-[11px]">{profile.emoji} {targetSpecies} mode</span>
        </div>
        {customerId && (
          <button onClick={openPortal} className="text-gb-faint text-[11px] hover:text-gb-muted transition-colors underline underline-offset-2">Manage subscription</button>
        )}
      </div>

      <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
        <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs mb-4">Today&apos;s Conditions</div>
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
            <input className={inputCls} value={conditions.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Water temp, structure…" />
          </div>
        </div>
        {/* Usage counter */}
        {usage && (
          <div className="flex items-center justify-end mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${usage.remaining === 0 ? "bg-gb-red2/20 text-gb-red" : usage.remaining === 1 ? "bg-gb-yellow2/20 text-gb-yellow" : "bg-gb-surface text-gb-faint"}`}>
              {usage.remaining}/{usage.limit} picks left today
            </span>
          </div>
        )}

        {fetching && (
          <p className="text-gb-faint text-xs text-center mb-3">
            You can switch tabs while we work — your picks will be ready when you return.
          </p>
        )}
        <button onClick={fetchRecs} disabled={fetching}
          className="w-full py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm transition-all hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          {fetching && <span className="inline-block w-3.5 h-3.5 border-2 border-gb-bg/30 border-t-gb-bg rounded-full animate-spin" />}
          {fetching ? (progress || "Starting…") : "Get Today's Recommendations"}
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl">{error}</div>}

      {picksSyncing && !rec && (
        <div className="text-center py-6 text-gb-faint text-xs animate-pulse">Loading saved picks…</div>
      )}

      {rec && (
        <div className="flex flex-col gap-3">
          <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs">🏆 Top Picks for Today</div>
          {rec.topPicks?.map((pick, i) => (
            <div key={i} className="bg-gb-surface border border-gb-border border-l-2 border-l-gb-green2 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
              <div className="w-7 h-7 shrink-0 flex items-center justify-center bg-gb-green2 text-gb-bg font-bold text-xs rounded-xl">{i + 1}</div>
              <div className="flex-1">
                <div className="font-bold text-gb-fg text-sm mb-1">{pick.lure}</div>
                <div className="text-gb-fg2 text-xs leading-relaxed mb-2">{pick.reason}</div>
                <div className="text-gb-muted text-[11px] bg-gb-bg px-2.5 py-1.5 rounded-sm border-l-2 border-gb-yellow2 leading-relaxed">
                  <span className="text-gb-yellow2 font-bold">Technique: </span>{pick.technique}
                </div>
              </div>
            </div>
          ))}
          {rec.avoid?.length > 0 && (
            <div className="bg-gb-surface border border-gb-border border-l-2 border-l-gb-red2 rounded-2xl p-4 shadow-sm">
              <div className="text-gb-red font-bold uppercase tracking-widest text-[11px] mb-2">⚠️ Skip Today</div>
              {rec.avoid.map((a, i) => <div key={i} className="text-gb-dark text-xs mb-1 leading-relaxed">• {a}</div>)}
            </div>
          )}
          {rec.proTip && (
            <div className="bg-gb-surface border border-gb-border border-l-2 border-l-gb-yellow2 rounded-2xl p-4 shadow-sm">
              <div className="text-gb-yellow font-bold uppercase tracking-widest text-[11px] mb-2">💡 Pro Tip</div>
              <div className="text-gb-muted text-xs leading-relaxed">{rec.proTip}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
