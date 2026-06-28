"use client";

import { useRef, useState } from "react";
import { Lure, SpeciesProfile, SIZES, LURE_WEIGHTS, WEIGHTED_LURE_TYPES } from "@/lib/types";
import { ImportLureSchema } from "@/lib/schemas";

interface Props {
  lures: Lure[];
  profile: SpeciesProfile;
  onSaveLure: (lure: Omit<Lure, "id">, id?: number) => void;
  onDelete: (id: number) => void;
  onAdjustQty: (id: number, delta: number) => void;
  onImport: (lures: Lure[]) => void;
  onExport: () => void;
  onMassDelete: (ids: number[]) => void;
}

const blank = { name: "", type: "Crankbait", color: "Natural/Shad", weight: "1/4 oz", size: "Medium (2–4\")", quantity: 1, notes: "" };
const CUSTOM_VALUE = "__custom__";

const inputCls = "w-full px-3 py-2.5 bg-gb-bg border border-gb-border text-gb-fg text-sm rounded-xl focus:outline-none focus:border-gb-green2 focus:ring-1 focus:ring-gb-green2/30 transition-all placeholder:text-gb-dark";
const labelCls = "block text-[11px] text-gb-faint font-semibold uppercase tracking-wider mb-1.5";

export default function Inventory({ lures, profile, onSaveLure, onDelete, onAdjustQty, onImport, onExport, onMassDelete }: Props) {
  const [filter, setFilter] = useState("All");
  const [editingLure, setEditingLure] = useState<Lure | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [confirmPrompt, setConfirmPrompt] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const types = ["All", ...Array.from(new Set(lures.map((l) => l.type)))];
  const filtered = filter === "All" ? lures : lures.filter((l) => l.type === filter);

  const openAdd = () => { setEditingLure(null); setForm({ ...blank }); setShowForm(true); };
  const openEdit = (lure: Lure) => { setEditingLure(lure); setForm({ name: lure.name, type: lure.type, color: lure.color, weight: lure.weight ?? "1/4 oz", size: lure.size, quantity: lure.quantity, notes: lure.notes }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    onSaveLure({ ...form, weight: form.weight, quantity: Number(form.quantity) }, editingLure?.id);
    setShowForm(false); setEditingLure(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(""); setImportSuccess("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.lures) ? raw.lures : null;
        if (!arr) throw new Error("Expected a JSON array of lures.");
        const imported: Lure[] = arr.map((item, i) => {
          const result = ImportLureSchema.safeParse(item);
          if (!result.success) {
            const msg = result.error.issues.map((e) => e.message).join(", ");
            throw new Error(`Item ${i + 1}: ${msg}`);
          }
          return { ...result.data, id: Date.now() + i };
        });
        if (!imported.length) throw new Error("No lures found in file.");
        onImport(imported);
        setImportSuccess(`Imported ${imported.length} lure${imported.length !== 1 ? "s" : ""}.`);
        setTimeout(() => setImportSuccess(""), 4000);
      } catch (err) { setImportError((err as Error).message); }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const askConfirm = (message: string, onConfirm: () => void) => setConfirmPrompt({ message, onConfirm });

  return (
    <div>
      {/* Confirm dialog */}
      {confirmPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-gb-surface border border-gb-red2/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-gb-red font-bold text-sm mb-2">⚠️ Confirm Delete</div>
            <div className="text-gb-fg1 text-sm mb-5 leading-relaxed">{confirmPrompt.message}</div>
            <div className="flex gap-3">
              <button onClick={confirmPrompt.onConfirm} className="flex-1 py-2.5 rounded-xl bg-gb-red2 text-white font-semibold text-sm hover:bg-gb-red transition-colors">Delete</button>
              <button onClick={() => setConfirmPrompt(null)} className="px-5 py-2.5 rounded-xl border border-gb-border text-gb-muted text-sm hover:border-gb-border2 hover:text-gb-fg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Species badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gb-surface border border-gb-border rounded-full text-[11px] font-semibold text-gb-muted">
          {profile.emoji} {profile.label} lures
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={["px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                filter === t ? "bg-gb-green2 text-gb-bg shadow-sm" : "bg-gb-surface text-gb-faint hover:text-gb-green border border-gb-border",
              ].join(" ")}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬆ Import</button>
          <button onClick={onExport} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬇ Export</button>
          <button onClick={openAdd} className="px-3 py-1.5 rounded-lg bg-gb-green2 text-gb-bg text-xs font-semibold hover:bg-gb-green transition-colors shadow-sm">+ Add</button>
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      </div>

      {/* Mass delete */}
      {lures.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gb-surface/60 border border-gb-border rounded-xl">
          <span className="text-gb-faint text-xs font-medium mr-auto">Mass delete</span>
          {filter !== "All" && (
            <button onClick={() => askConfirm(`Delete all ${filter} lures?`, () => { onMassDelete(filtered.map((l) => l.id)); setConfirmPrompt(null); setFilter("All"); })}
              className="px-3 py-1 rounded-lg border border-gb-border text-gb-dark text-xs font-medium hover:border-gb-red2 hover:text-gb-red transition-all">
              🗑 Delete {filter} ({filtered.length})
            </button>
          )}
          <button onClick={() => askConfirm(`Delete all ${lures.length} lures?`, () => { onMassDelete(lures.map((l) => l.id)); setConfirmPrompt(null); setFilter("All"); })}
            className="px-3 py-1 rounded-lg border border-gb-red2/50 text-gb-red text-xs font-medium hover:bg-gb-red2/20 transition-all">
            🗑 Clear all ({lures.length})
          </button>
        </div>
      )}

      {/* Banners */}
      {importError   && <div className="mb-3 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl">{importError}</div>}
      {importSuccess && <div className="mb-3 px-4 py-3 bg-gb-green2/10 border border-gb-green2/40 text-gb-green text-sm rounded-xl">✓ {importSuccess}</div>}

      {/* Inline form */}
      {showForm && (
        <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-5 shadow-lg">
          <div className="text-gb-fg font-semibold text-sm mb-4">{editingLure ? "Edit Lure" : "Add New Lure"}</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className={labelCls}>Lure Name</label>
              <input className={inputCls} placeholder="e.g. Rapala Original Floater" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            {([["Type", "type", profile.lureTypes], ["Color", "color", profile.colors]] as [string, string, string[]][]).map(([label, key, opts]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <select className={inputCls}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({
                      ...f,
                      [key]: val,
                      // Clear weight when switching to soft plastic
                      ...(key === "type" && !WEIGHTED_LURE_TYPES.has(val) ? { weight: "" } : {}),
                      ...(key === "type" && WEIGHTED_LURE_TYPES.has(val) && !(f as Record<string,unknown>).weight ? { weight: "1/4 oz" } : {}),
                    }));
                  }}
                >
                  {opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {/* Weight — only for hard baits */}
            {WEIGHTED_LURE_TYPES.has(form.type) && (
              <div>
                <label className={labelCls}>Weight</label>
                {form.weight && !LURE_WEIGHTS.includes(form.weight) ? (
                  <div className="flex gap-2">
                    <input className={inputCls} value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="e.g. 1.65 oz" autoFocus />
                    <button onClick={() => setForm((f) => ({ ...f, weight: "1/4 oz" }))} className="px-2.5 rounded-xl border border-gb-border text-gb-faint text-xs hover:text-gb-fg transition-colors shrink-0" title="Back to list">↩</button>
                  </div>
                ) : (
                  <select className={inputCls}
                    value={LURE_WEIGHTS.includes(form.weight) ? form.weight : CUSTOM_VALUE}
                    onChange={(e) => {
                      if (e.target.value === CUSTOM_VALUE) setForm((f) => ({ ...f, weight: "" }));
                      else setForm((f) => ({ ...f, weight: e.target.value }));
                    }}
                  >
                    {LURE_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                    <option value={CUSTOM_VALUE}>Custom…</option>
                  </select>
                )}
              </div>
            )}

            {([["Size", "size", SIZES]] as [string, string, string[]][]).map(([label, key, opts]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <select className={inputCls} value={(form as Record<string, unknown>)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}>
                  {opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className={labelCls}>Quantity</label>
              <input className={inputCls} type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Notes</label>
            <input className={inputCls} placeholder="Rigging tips, best conditions…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              {editingLure ? "Save Changes" : "Add to Inventory"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingLure(null); }}
              className="px-5 py-2.5 rounded-xl border border-gb-border text-gb-muted text-sm hover:border-gb-border2 hover:text-gb-fg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gb-faint">
          <div className="text-5xl mb-4">🪝</div>
          <p className="text-sm font-medium">No lures yet — add some or import a JSON file.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((lure) => (
            <div key={lure.id} className="bg-gb-surface border border-gb-border rounded-2xl px-4 py-3.5 hover:border-gb-border2 transition-colors shadow-sm group">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-gb-fg text-[15px] leading-snug">{lure.name}</div>
                    <a href={`https://www.amazon.com/s?k=${encodeURIComponent(lure.name + " fishing lure")}${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ? `&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG}` : ""}`}
                      target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gb-orange/50 text-gb-orange hover:bg-gb-orange hover:text-gb-bg transition-all opacity-0 group-hover:opacity-100">
                      Buy ↗
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[lure.type, lure.color, WEIGHTED_LURE_TYPES.has(lure.type) ? lure.weight : null, lure.size].filter(Boolean).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gb-bg border border-gb-border text-gb-faint text-[11px] font-medium rounded-full">{tag}</span>
                    ))}
                  </div>
                  {lure.notes && <div className="text-gb-dark text-xs italic mt-2 leading-relaxed">{lure.notes}</div>}
                </div>
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onAdjustQty(lure.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gb-bg border border-gb-border text-gb-green hover:bg-gb-border text-base font-medium transition-colors">−</button>
                    <span className={`min-w-[2rem] text-center font-bold text-base ${lure.quantity === 0 ? "text-gb-red" : "text-gb-yellow"}`}>{lure.quantity}</span>
                    <button onClick={() => onAdjustQty(lure.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gb-bg border border-gb-border text-gb-green hover:bg-gb-border text-base font-medium transition-colors">+</button>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(lure)} className="px-2.5 py-1 rounded-lg border border-gb-border2 text-gb-blue text-xs font-medium hover:bg-gb-border2 transition-colors">Edit</button>
                    <button onClick={() => onDelete(lure.id)} className="px-2.5 py-1 rounded-lg border border-gb-border text-gb-dark text-xs font-medium hover:border-gb-red2 hover:text-gb-red transition-colors">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
