"use client";

import { TargetSpecies, SPECIES_PROFILES } from "@/lib/types";

interface Props {
  current: TargetSpecies;
  onSelect: (species: TargetSpecies) => void;
  onClose: () => void;
}

const ORDER: TargetSpecies[] = ["Bass", "Trout", "Walleye", "Pike / Muskie", "Panfish", "Catfish", "Salmon / Steelhead", "All Species"];

export default function SettingsModal({ current, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-gb-surface border border-gb-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gb-border">
          <div className="text-gb-yellow font-bold uppercase tracking-widest text-sm">⚙️ Target Species</div>
          <button onClick={onClose} className="text-gb-faint hover:text-gb-fg transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4">
          <p className="text-gb-muted text-xs mb-4 leading-relaxed">
            Changing your target species will update lure type options, rod & reel defaults, and how AI recommendations are generated.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {ORDER.map((key) => {
              const p = SPECIES_PROFILES[key];
              const active = current === key;
              return (
                <button
                  key={key}
                  onClick={() => { onSelect(key); onClose(); }}
                  className={[
                    "text-left px-3 py-3 rounded-2xl border transition-all duration-150",
                    active
                      ? "border-gb-yellow bg-gb-border text-gb-yellow"
                      : "border-gb-border text-gb-muted hover:border-gb-green2 hover:bg-gb-green2/5 hover:text-gb-green",
                  ].join(" ")}
                >
                  <div className="text-base mb-0.5">{p.emoji} <span className="text-xs font-bold uppercase tracking-wide">{p.label}</span></div>
                  <div className="text-[10px] text-gb-faint leading-snug">{p.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 border border-gb-border text-gb-muted text-sm rounded-xl hover:border-gb-border2 hover:text-gb-fg transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
