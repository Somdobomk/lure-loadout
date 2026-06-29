"use client";

import { Button } from "./Button";
import { TextField, SelectField } from "./Fields";
import { useState } from "react";
import { TargetSpecies, SPECIES_PROFILES } from "@/lib/types";

interface Props {
  onSelect: (species: TargetSpecies) => void;
}

const ORDER: TargetSpecies[] = ["Bass", "Trout", "Walleye", "Pike / Muskie", "Panfish", "Catfish", "Salmon / Steelhead", "All Species"];

export default function OnboardingModal({ onSelect }: Props) {
  const [selected, setSelected] = useState<TargetSpecies>("Bass");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="bg-gb-surface border border-gb-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gb-border">
          <div className="text-3xl mb-2">🎣</div>
          <div className="text-gb-yellow font-bold uppercase tracking-widest text-base mb-1">Welcome to LureLoadout</div>
          <div className="text-gb-muted text-sm">What do you primarily fish for? We&apos;ll tailor your lure types, rod specs, and AI recommendations to match.</div>
        </div>

        {/* Species grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-2.5">
          {ORDER.map((key) => {
            const p = SPECIES_PROFILES[key];
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={[
                  "text-left px-3 py-3 rounded-2xl border transition-all duration-150",
                  active
                    ? "border-gb-yellow bg-gb-yellow/10 text-gb-yellow shadow-sm"
                    : "border-gb-border text-gb-muted hover:border-gb-green2 hover:bg-gb-green2/5 hover:text-gb-green",
                ].join(" ")}
              >
                <div className="text-base mb-0.5">{p.emoji} <span className="text-xs font-bold uppercase tracking-wide">{p.label}</span></div>
                <div className="text-[10px] text-gb-faint leading-snug">{p.description}</div>
              </button>
            );
          })}
        </div>

        {/* Preview of what changes */}
        <div className="mx-6 mb-4 px-4 py-3 bg-gb-bg border border-gb-border rounded-2xl">
          <div className="text-[10px] text-gb-faint uppercase tracking-widest mb-2">Tailored for {SPECIES_PROFILES[selected].label}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-gb-faint text-[10px]">Top lures: </span>
              <span className="text-gb-fg2 text-[10px]">{SPECIES_PROFILES[selected].lureTypes.slice(0, 3).join(", ")}</span>
            </div>
            <div>
              <span className="text-gb-faint text-[10px]">Rod: </span>
              <span className="text-gb-fg2 text-[10px]">{SPECIES_PROFILES[selected].rodPowers[0]} · {SPECIES_PROFILES[selected].rodActions[0]}</span>
            </div>
            <div>
              <span className="text-gb-faint text-[10px]">Reel: </span>
              <span className="text-gb-fg2 text-[10px]">{SPECIES_PROFILES[selected].reelTypes[0]}</span>
            </div>
            <div>
              <span className="text-gb-faint text-[10px]">Gear ratio: </span>
              <span className="text-gb-fg2 text-[10px]">{SPECIES_PROFILES[selected].gearRatios[0]}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={() => onSelect(selected)}
            className="w-full py-3.5 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green transition-colors shadow-sm"
          >
            Set Up My LureLoadout →
          </button>
          <p className="text-gb-faint text-[10px] text-center mt-2">You can change this anytime in settings</p>
        </div>
      </div>
    </div>
  );
}
