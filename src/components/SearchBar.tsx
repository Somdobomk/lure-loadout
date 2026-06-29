"use client";

import { useState, useRef, useEffect } from "react";
import { Lure, Rod, Reel } from "@/lib/types";

interface Props {
  lures: Lure[];
  rods: Rod[];
  reels: Reel[];
  onNavigate: (tab: string) => void;
}

type Result =
  | { kind: "lure";  item: Lure;  tab: "inventory" }
  | { kind: "rod";   item: Rod;   tab: "rodsreels" }
  | { kind: "reel";  item: Reel;  tab: "rodsreels" };

const kindLabel: Record<string, string> = { lure: "Lure", rod: "Rod", reel: "Reel" };
const kindColor: Record<string, string> = {
  lure: "text-gb-green border-gb-green",
  rod:  "text-gb-blue  border-gb-blue",
  reel: "text-gb-orange border-gb-orange",
};

export default function SearchBar({ lures, rods, reels, onNavigate }: Props) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [focused, setFocused] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = query.toLowerCase().trim();

  const results: Result[] = q.length < 2 ? [] : [
    ...lures.filter((l) => [l.name, l.type, l.color, l.notes].join(" ").toLowerCase().includes(q)).map((l) => ({ kind: "lure" as const, item: l, tab: "inventory" as const })),
    ...rods.filter((r)  => [r.name, r.brand, r.type, r.notes].join(" ").toLowerCase().includes(q)).map((r) => ({ kind: "rod"  as const, item: r, tab: "rodsreels" as const })),
    ...reels.filter((r) => [r.name, r.brand, r.type, r.notes].join(" ").toLowerCase().includes(q)).map((r) => ({ kind: "reel" as const, item: r, tab: "rodsreels" as const })),
  ].slice(0, 8);

  useEffect(() => { setFocused(-1); }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown")  { e.preventDefault(); setFocused((f) => Math.min(f + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setFocused((f) => Math.max(f - 1, -1)); }
    if (e.key === "Enter" && focused >= 0) selectResult(results[focused]);
    if (e.key === "Escape") { setOpen(false); setQuery(""); }
  };

  const selectResult = (r: Result) => {
    onNavigate(r.tab);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const getSubtitle = (r: Result) => {
    if (r.kind === "lure") return `${r.item.type} · ${r.item.color} · ${r.item.size} · qty ${r.item.quantity}`;
    if (r.kind === "rod")  return `${r.item.brand} · ${r.item.type} · ${r.item.length} · ${r.item.power}`;
    return `${r.item.brand} · ${r.item.type} · ${r.item.gearRatio}`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gb-faint text-xs">🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search gear…"
          className="w-full pl-7 pr-2 py-1.5 bg-gb-bg border border-gb-border text-gb-fg text-xs rounded-xl focus:outline-none focus:border-gb-green2 transition-all placeholder:text-gb-dark"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gb-faint hover:text-gb-fg transition-colors text-xs">✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gb-surface border border-gb-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.item.id}`}
              onClick={() => selectResult(r)}
              className={["w-full text-left px-3 py-2.5 border-b border-gb-border last:border-0 transition-colors",
                i === focused ? "bg-gb-border" : "hover:bg-gb-border2",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] uppercase tracking-widest border px-1 py-0.5 rounded-sm font-bold ${kindColor[r.kind]}`}>{kindLabel[r.kind]}</span>
                <span className="text-gb-fg text-xs font-bold">{r.item.name}</span>
              </div>
              <div className="text-gb-faint text-[11px] pl-10 truncate">{getSubtitle(r)}</div>
            </button>
          ))}
          <div className="px-3 py-1.5 text-gb-faint text-[10px] uppercase tracking-widest border-t border-gb-border bg-gb-bg">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {open && q.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gb-surface border border-gb-border rounded-2xl shadow-2xl z-50 px-4 py-3 text-gb-faint text-sm">
          No gear found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
