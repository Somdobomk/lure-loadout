"use client";

import { useRef, useState } from "react";
import { Rod, Reel, SpeciesProfile, ROD_LENGTHS, BALL_BEARINGS } from "@/lib/types";
import { ImportRodSchema, ImportReelSchema } from "@/lib/schemas";

interface Props {
  rods: Rod[];
  reels: Reel[];
  onSaveRod: (rod: Omit<Rod, "id">, id?: number) => void;
  onDeleteRod: (id: number) => void;
  onSaveReel: (reel: Omit<Reel, "id">, id?: number) => void;
  onDeleteReel: (id: number) => void;
  profile: SpeciesProfile;
  onImportRods: (rods: Rod[]) => void;
  onExportRods: () => void;
  onImportReels: (reels: Reel[]) => void;
  onExportReels: () => void;
}

const blankRod:  Omit<Rod,  "id"> = { name: "", brand: "", length: "6'6\"–7'", power: "Medium", action: "Fast", type: "Casting", notes: "" };
const blankReel: Omit<Reel, "id"> = { name: "", brand: "", type: "Baitcaster", gearRatio: "6:1–7:1 (Fast)", ballBearings: "4–6", notes: "" };

// fieldCls and labelCls imported from @/lib/classes
const saveBtnCls = "flex-1 py-2.5 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm";
const cancelBtnCls = "px-5 py-2.5 rounded-xl border border-gb-border text-gb-muted text-sm hover:border-gb-border2 hover:text-gb-fg transition-colors";

type Tab = "rods" | "reels";

function parseRodsJson(text: string): Omit<Rod, "id">[] {
  const raw = JSON.parse(text);
  const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.rods) ? raw.rods : null;
  if (!arr) throw new Error("Expected a JSON array of rods.");
  return arr.map((item, i) => {
    const result = ImportRodSchema.safeParse(item);
    if (!result.success) {
      const msg = result.error.issues.map((e) => e.message).join(", ");
      throw new Error(`Item ${i + 1}: ${msg}`);
    }
    return result.data;
  });
}

function parseReelsJson(text: string): Omit<Reel, "id">[] {
  const raw = JSON.parse(text);
  const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.reels) ? raw.reels : null;
  if (!arr) throw new Error("Expected a JSON array of reels.");
  return arr.map((item, i) => {
    const result = ImportReelSchema.safeParse(item);
    if (!result.success) {
      const msg = result.error.issues.map((e) => e.message).join(", ");
      throw new Error(`Item ${i + 1}: ${msg}`);
    }
    return result.data;
  });
}

export default function RodReelInventory({ rods, reels, profile, onSaveRod, onDeleteRod, onSaveReel, onDeleteReel, onImportRods, onExportRods, onImportReels, onExportReels }: Props) {
  const [tab, setTab] = useState<Tab>("rods");
  const [editingRod,   setEditingRod]   = useState<Rod  | null>(null);
  const [editingReel,  setEditingReel]  = useState<Reel | null>(null);
  const [showRodForm,  setShowRodForm]  = useState(false);
  const [showReelForm, setShowReelForm] = useState(false);
  const [rodForm,  setRodForm]  = useState<Omit<Rod,  "id">>({ ...blankRod });
  const [reelForm, setReelForm] = useState<Omit<Reel, "id">>({ ...blankReel });
  const [importError,   setImportError]   = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const rodFileRef  = useRef<HTMLInputElement>(null);
  const reelFileRef = useRef<HTMLInputElement>(null);

  const openAddRod  = () => { setEditingRod(null);  setRodForm({ name: "", brand: "", length: ROD_LENGTHS[3] ?? "6'6\"–7'", power: profile.rodPowers[0] ?? "Medium", action: profile.rodActions[0] ?? "Fast", type: profile.rodTypes[0] ?? "Casting", notes: "" }); setShowRodForm(true); };
  const openEditRod = (r: Rod) => { setEditingRod(r); setRodForm({ name: r.name, brand: r.brand, length: r.length, power: r.power, action: r.action, type: r.type, notes: r.notes }); setShowRodForm(true); };
  const saveRod = () => { if (!rodForm.name.trim()) return; onSaveRod(rodForm, editingRod?.id); setShowRodForm(false); };

  const openAddReel  = () => { setEditingReel(null);  setReelForm({ name: "", brand: "", type: profile.reelTypes[0] ?? "Baitcaster", gearRatio: profile.gearRatios[0] ?? "6:1–7:1 (Fast)", ballBearings: "4–6", notes: "" }); setShowReelForm(true); };
  const openEditReel = (r: Reel) => { setEditingReel(r); setReelForm({ name: r.name, brand: r.brand, type: r.type, gearRatio: r.gearRatio, ballBearings: r.ballBearings, notes: r.notes }); setShowReelForm(true); };
  const saveReel = () => { if (!reelForm.name.trim()) return; onSaveReel(reelForm, editingReel?.id); setShowReelForm(false); };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>, type: "rods" | "reels") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(""); setImportSuccess("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (type === "rods") {
          const imported = parseRodsJson(ev.target?.result as string);
          const hydrated = imported.map((r, i) => ({ ...blankRod, ...r, id: Date.now() + i }));
          onImportRods(hydrated);
          setImportSuccess(`Imported ${hydrated.length} rod${hydrated.length !== 1 ? "s" : ""}.`);
        } else {
          const imported = parseReelsJson(ev.target?.result as string);
          const hydrated = imported.map((r, i) => ({ ...blankReel, ...r, id: Date.now() + i }));
          onImportReels(hydrated);
          setImportSuccess(`Imported ${hydrated.length} reel${hydrated.length !== 1 ? "s" : ""}.`);
        }
        setTimeout(() => setImportSuccess(""), 4000);
      } catch (err) { setImportError((err as Error).message); }
      if (rodFileRef.current)  rodFileRef.current.value  = "";
      if (reelFileRef.current) reelFileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {(["rods", "reels"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setImportError(""); setImportSuccess(""); }}
            className={["flex-1 py-2 rounded-xl border text-xs font-semibold transition-all duration-150",
              tab === t ? "border-gb-yellow bg-gb-yellow/10 text-gb-yellow shadow-sm" : "border-gb-border text-gb-faint bg-gb-surface hover:border-gb-green2 hover:text-gb-green",
            ].join(" ")}>
            {t === "rods" ? `🎣 Rods (${rods.length})` : `🎡 Reels (${reels.length})`}
          </button>
        ))}
      </div>

      {/* Banners */}
      {importError   && <div className="mb-3 px-4 py-3 bg-gb-red2/10 border border-gb-red2/40 text-gb-red text-sm rounded-xl">{importError}</div>}
      {importSuccess && <div className="mb-3 px-4 py-3 bg-gb-green2/10 border border-gb-green2/40 text-gb-green text-sm rounded-xl">✓ {importSuccess}</div>}

      {/* ── RODS ── */}
      {tab === "rods" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs">Rod Inventory</div>
            <div className="flex gap-2">
              <button onClick={() => rodFileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬆ Import</button>
              <button onClick={onExportRods} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬇ Export</button>
              <button onClick={openAddRod} className="px-3 py-1.5 rounded-lg bg-gb-green2 text-gb-bg text-xs font-semibold hover:bg-gb-green transition-colors shadow-sm">+ Add Rod</button>
            </div>
            <input ref={rodFileRef} type="file" accept=".json" onChange={(e) => handleImportFile(e, "rods")} className="hidden" />
          </div>

          {showRodForm && (
            <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
              <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs mb-4">{editingRod ? "✏️ Edit Rod" : "➕ Add Rod"}</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input className={inputCls} placeholder="e.g. St. Croix Mojo Bass" value={rodForm.name} onChange={(e) => setRodForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <input className={inputCls} placeholder="e.g. St. Croix" value={rodForm.brand} onChange={(e) => setRodForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                {([["Type", "type", profile.rodTypes], ["Length", "length", ROD_LENGTHS], ["Power", "power", profile.rodPowers], ["Action", "action", profile.rodActions]] as [string, keyof Omit<Rod,"id">, string[]][]).map(([label, key, opts]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <select className={inputCls} value={rodForm[key] as string} onChange={(e) => setRodForm((f) => ({ ...f, [key]: e.target.value }))}>
                      {opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className={labelCls}>Notes</label>
                <input className={inputCls} placeholder="Paired reel, favourite techniques, etc." value={rodForm.notes} onChange={(e) => setRodForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={saveRod} disabled={!rodForm.name.trim()} className={saveBtnCls}>{editingRod ? "Save Changes" : "Add Rod"}</button>
                <button onClick={() => setShowRodForm(false)} className={cancelBtnCls}>Cancel</button>
              </div>
            </div>
          )}

          {rods.length === 0 ? (
            <div className="text-center py-12 text-gb-faint"><div className="text-3xl mb-2">🎣</div><p className="text-sm">No rods yet — add your first one.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {rods.map((rod) => (
                <div key={rod.id} className="bg-gb-surface border border-gb-border hover:border-gb-border2 rounded-2xl px-4 py-4 transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gb-fg text-sm mb-0.5">{rod.name}</div>
                      {rod.brand && <div className="text-gb-faint text-[11px] mb-2">{rod.brand}</div>}
                      <div className="flex flex-wrap gap-1">
                        {[rod.type, rod.length, rod.power, rod.action].map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gb-bg border border-gb-border text-gb-faint text-[11px] font-medium rounded-full">{tag}</span>
                        ))}
                      </div>
                      {rod.notes && <div className="text-gb-dark text-[11px] italic mt-1.5">{rod.notes}</div>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEditRod(rod)} className="px-2.5 py-1 border border-gb-border2 text-gb-blue text-xs font-medium rounded-lg hover:bg-gb-border2 transition-colors">Edit</button>
                      <button onClick={() => onDeleteRod(rod.id)} className="px-2.5 py-1 border border-gb-border text-gb-dark text-xs font-medium rounded-lg hover:border-gb-red2 hover:text-gb-red transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REELS ── */}
      {tab === "reels" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs">Reel Inventory</div>
            <div className="flex gap-2">
              <button onClick={() => reelFileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬆ Import</button>
              <button onClick={onExportReels} className="px-3 py-1.5 rounded-lg bg-gb-surface border border-gb-border text-gb-faint text-xs font-medium hover:border-gb-blue hover:text-gb-blue transition-all">⬇ Export</button>
              <button onClick={openAddReel} className="px-3 py-1.5 rounded-lg bg-gb-green2 text-gb-bg text-xs font-semibold hover:bg-gb-green transition-colors shadow-sm">+ Add Reel</button>
            </div>
            <input ref={reelFileRef} type="file" accept=".json" onChange={(e) => handleImportFile(e, "reels")} className="hidden" />
          </div>

          {showReelForm && (
            <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
              <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs mb-4">{editingReel ? "✏️ Edit Reel" : "➕ Add Reel"}</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input className={inputCls} placeholder="e.g. Shimano Curado" value={reelForm.name} onChange={(e) => setReelForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <input className={inputCls} placeholder="e.g. Shimano" value={reelForm.brand} onChange={(e) => setReelForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                {([["Type", "type", profile.reelTypes], ["Gear Ratio", "gearRatio", profile.gearRatios], ["Ball Bearings", "ballBearings", BALL_BEARINGS]] as [string, keyof Omit<Reel,"id">, string[]][]).map(([label, key, opts]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <select className={inputCls} value={reelForm[key] as string} onChange={(e) => setReelForm((f) => ({ ...f, [key]: e.target.value }))}>
                      {opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className={labelCls}>Notes</label>
                <input className={inputCls} placeholder="Line type/weight, paired rod, etc." value={reelForm.notes} onChange={(e) => setReelForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={saveReel} disabled={!reelForm.name.trim()} className={saveBtnCls}>{editingReel ? "Save Changes" : "Add Reel"}</button>
                <button onClick={() => setShowReelForm(false)} className={cancelBtnCls}>Cancel</button>
              </div>
            </div>
          )}

          {reels.length === 0 ? (
            <div className="text-center py-12 text-gb-faint"><div className="text-3xl mb-2">🎡</div><p className="text-sm">No reels yet — add your first one.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {reels.map((reel) => (
                <div key={reel.id} className="bg-gb-surface border border-gb-border hover:border-gb-border2 rounded-2xl px-4 py-4 transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gb-fg text-sm mb-0.5">{reel.name}</div>
                      {reel.brand && <div className="text-gb-faint text-[11px] mb-2">{reel.brand}</div>}
                      <div className="flex flex-wrap gap-1">
                        {[reel.type, reel.gearRatio, `${reel.ballBearings} BB`].map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gb-bg border border-gb-border text-gb-faint text-[11px] font-medium rounded-full">{tag}</span>
                        ))}
                      </div>
                      {reel.notes && <div className="text-gb-dark text-[11px] italic mt-1.5">{reel.notes}</div>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEditReel(reel)} className="px-2.5 py-1 border border-gb-border2 text-gb-blue text-xs font-medium rounded-lg hover:bg-gb-border2 transition-colors">Edit</button>
                      <button onClick={() => onDeleteReel(reel.id)} className="px-2.5 py-1 border border-gb-border text-gb-dark text-xs font-medium rounded-lg hover:border-gb-red2 hover:text-gb-red transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
