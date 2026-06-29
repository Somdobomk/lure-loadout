"use client";

import { useState } from "react";
import { Lure, LURE_TYPES, COLORS, SIZES, LURE_WEIGHTS, WEIGHTED_LURE_TYPES } from "@/lib/types";
import { fieldCls as inputCls, labelCls } from "@/lib/classes";

interface Props {
  initial: Lure | null;
  onSave: (lure: Omit<Lure, "id">, id?: number) => void;
  onCancel: () => void;
}

const CUSTOM_VALUE = "__custom__";

const blank: Omit<Lure, "id"> = {
  name: "", type: "Crankbait", color: "Natural/Shad",
  weight: "1/4 oz", size: 'Medium (2–4")', quantity: 1, notes: "",
};


function isCustomWeight(weight: string) {
  return weight !== "" && !LURE_WEIGHTS.includes(weight);
}

export default function LureForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Lure, "id">>(
    initial ? { ...initial } : { ...blank }
  );
  // Track whether the user has selected "Custom…" from the dropdown
  const [useCustomWeight, setUseCustomWeight] = useState(
    initial ? isCustomWeight(initial.weight ?? "") : false
  );

  const set = (key: keyof Omit<Lure, "id">, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const showWeight = WEIGHTED_LURE_TYPES.has(form.type);

  const handleTypeChange = (newType: string) => {
    set("type", newType);
    // If switching to a soft plastic/fly, clear weight
    if (!WEIGHTED_LURE_TYPES.has(newType)) {
      set("weight", "");
      setUseCustomWeight(false);
    } else if (!form.weight) {
      // If switching back to a hard bait with no weight set, restore default
      set("weight", "1/4 oz");
      setUseCustomWeight(false);
    }
  };

  const handleWeightSelect = (val: string) => {
    if (val === CUSTOM_VALUE) {
      setUseCustomWeight(true);
      set("weight", "");
    } else {
      setUseCustomWeight(false);
      set("weight", val);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      name:     form.name.trim(),
      type:     form.type,
      color:    form.color,
      weight:   showWeight ? form.weight : "",
      size:     form.size,
      quantity: Number(form.quantity),
      notes:    form.notes,
    }, initial?.id);
  };

  return (
    <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 max-w-lg shadow-sm">
      <div className="text-gb-yellow font-semibold text-sm mb-5">
        {initial ? "✏️ Edit Lure" : "➕ Add New Lure"}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Name — full width */}
        <div className="col-span-2">
          <label className={labelCls}>Lure Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Rapala Original Floater"
          />
        </div>

        {/* Type */}
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
            {LURE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className={labelCls}>Color</label>
          <select className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)}>
            {COLORS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Weight — only for hard baits */}
        {showWeight && (
          <div className={useCustomWeight ? "" : ""}>
            <label className={labelCls}>Weight</label>
            {!useCustomWeight ? (
              <select
                className={inputCls}
                value={LURE_WEIGHTS.includes(form.weight) ? form.weight : CUSTOM_VALUE}
                onChange={(e) => handleWeightSelect(e.target.value)}
              >
                {LURE_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                <option value={CUSTOM_VALUE}>Custom…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="e.g. 1.65 oz"
                  autoFocus
                />
                <button
                  onClick={() => { setUseCustomWeight(false); set("weight", "1/4 oz"); }}
                  className="px-2.5 rounded-xl border border-gb-border text-gb-faint text-xs hover:text-gb-fg transition-colors shrink-0"
                  title="Back to list"
                >
                  ↩
                </button>
              </div>
            )}
          </div>
        )}

        {/* Size */}
        <div>
          <label className={labelCls}>Size</label>
          <select className={inputCls} value={form.size} onChange={(e) => set("size", e.target.value)}>
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className={labelCls}>Quantity</label>
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Notes — full width */}
      <div className="mb-5">
        <label className={labelCls}>Notes</label>
        <input
          className={inputCls}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Rigging tips, best conditions, etc."
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex-1 py-2.5 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {initial ? "Save Changes" : "Add to Inventory"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-gb-border text-gb-muted text-sm hover:border-gb-border2 hover:text-gb-fg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
