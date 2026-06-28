"use client";

import { useRef, useState } from "react";
import { Trip, Catch, Lure, WATER_BODY_TYPES, FISH_SPECIES, WATER_CLARITY, WEATHER, TRIP_DURATIONS } from "@/lib/types";

interface Props {
  trips: Trip[];
  lures: Lure[];
  onSaveTrip: (trip: Omit<Trip, "id">, id?: number) => void;
  onDeleteTrip: (id: number) => void;
}

const inputCls = "w-full px-3 py-2.5 bg-gb-bg border border-gb-border text-gb-fg text-sm rounded-xl focus:outline-none focus:border-gb-green2 focus:ring-1 focus:ring-gb-green2/30 transition-all placeholder:text-gb-dark";
const labelCls = "block text-[11px] text-gb-faint font-semibold uppercase tracking-wider mb-1.5";

const blankCatch: Omit<Catch, "id"> = { species: "Bass (Largemouth)", weight: "", length: "", lureUsed: "", notes: "", photo: undefined };
const blankTrip: Omit<Trip, "id"> = {
  date: new Date().toISOString().split("T")[0],
  location: "", waterBody: "Lake", waterClarity: "Clear",
  weather: "Sunny & Calm", temperature: "", duration: "Half day",
  catches: [], notes: "",
};

function CatchForm({ lures, onAdd, onCancel }: { lures: Lure[]; onAdd: (c: Catch) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Catch, "id">>({ ...blankCatch, lureUsed: lures[0]?.name ?? "" });
  const photoRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Omit<Catch, "id">, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photo", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-gb-bg border border-gb-border2 rounded-sm p-4 mb-3">
      <div className="text-gb-orange font-bold uppercase tracking-widest text-[11px] mb-3">🐟 Add Catch</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Species</label>
          <select className={inputCls} value={form.species} onChange={(e) => set("species", e.target.value)}>
            {FISH_SPECIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Lure Used</label>
          <select className={inputCls} value={form.lureUsed} onChange={(e) => set("lureUsed", e.target.value)}>
            <option value="">-- None / Unknown --</option>
            {lures.map((l) => <option key={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Weight</label>
          <input className={inputCls} placeholder="e.g. 3.2 lbs" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Length</label>
          <input className={inputCls} placeholder="e.g. 18 in" value={form.length} onChange={(e) => set("length", e.target.value)} />
        </div>
      </div>
      <div className="mb-3">
        <label className={labelCls}>Notes</label>
        <input className={inputCls} placeholder="Depth, structure, technique tweak…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>Photo (optional)</label>
        <div className="flex gap-2 items-center">
          <button onClick={() => photoRef.current?.click()} className="px-3 py-1.5 border border-gb-border text-gb-faint text-xs rounded-sm hover:border-gb-orange hover:text-gb-orange transition-all">
            📷 {form.photo ? "Change photo" : "Add photo"}
          </button>
          {form.photo && <button onClick={() => set("photo", "")} className="text-gb-dark text-xs hover:text-gb-red transition-colors">Remove</button>}
        </div>
        {form.photo && <img src={form.photo} alt="catch" className="mt-2 h-24 rounded-sm object-cover border border-gb-border" />}
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAdd({ ...form, id: Date.now() })} className="flex-1 py-2.5 rounded-xl bg-gb-orange text-gb-bg font-semibold text-sm hover:opacity-90 transition-colors shadow-sm">
          Add Catch
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 border border-gb-border text-gb-muted text-sm rounded-xl hover:border-gb-border2 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function TripForm({ lures, initial, onSave, onCancel }: { lures: Lure[]; initial: Trip | null; onSave: (t: Omit<Trip, "id">, id?: number) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Trip, "id">>(initial ? { date: initial.date, location: initial.location, waterBody: initial.waterBody, waterClarity: initial.waterClarity, weather: initial.weather, temperature: initial.temperature, duration: initial.duration, catches: initial.catches, notes: initial.notes } : { ...blankTrip });
  const [showCatchForm, setShowCatchForm] = useState(false);

  const set = (k: keyof Omit<Trip, "id" | "catches">, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addCatch = (c: Catch) => { setForm((f) => ({ ...f, catches: [...f.catches, c] })); setShowCatchForm(false); };
  const removeCatch = (id: number) => setForm((f) => ({ ...f, catches: f.catches.filter((c) => c.id !== id) }));

  return (
    <div className="bg-gb-surface border border-gb-border rounded-2xl p-5 mb-4 shadow-sm">
      <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs mb-4">{initial ? "✏️ Edit Trip" : "➕ Log New Trip"}</div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Duration</label>
          <select className={inputCls} value={form.duration} onChange={(e) => set("duration", e.target.value)}>
            {TRIP_DURATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Location / Spot Name</label>
          <input className={inputCls} placeholder="e.g. Canyon Lake, North Shore" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Water Body</label>
          <select className={inputCls} value={form.waterBody} onChange={(e) => set("waterBody", e.target.value)}>
            {WATER_BODY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Water Clarity</label>
          <select className={inputCls} value={form.waterClarity} onChange={(e) => set("waterClarity", e.target.value)}>
            {WATER_CLARITY.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Weather</label>
          <select className={inputCls} value={form.weather} onChange={(e) => set("weather", e.target.value)}>
            {WEATHER.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Air Temp</label>
          <input className={inputCls} placeholder="e.g. 72°F" value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelCls}>Trip Notes</label>
        <input className={inputCls} placeholder="Overall observations, conditions, patterns…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      {/* Catches */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + " mb-0"}>Catches ({form.catches.length})</label>
          {!showCatchForm && (
            <button onClick={() => setShowCatchForm(true)} className="px-2 py-0.5 border border-gb-orange text-gb-orange text-[11px] rounded-sm hover:bg-gb-orange hover:text-gb-bg transition-all">+ Add Catch</button>
          )}
        </div>
        {showCatchForm && <CatchForm lures={lures} onAdd={addCatch} onCancel={() => setShowCatchForm(false)} />}
        {form.catches.map((c) => (
          <div key={c.id} className="flex items-center gap-2 bg-gb-bg border border-gb-border rounded-sm px-3 py-2 mb-1.5">
            {c.photo && <img src={c.photo} alt={c.species} className="w-10 h-10 object-cover rounded-sm border border-gb-border shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-gb-fg text-xs font-bold">{c.species}</div>
              <div className="text-gb-faint text-[11px]">{[c.weight, c.length, c.lureUsed].filter(Boolean).join(" · ")}</div>
            </div>
            <button onClick={() => removeCatch(c.id)} className="text-gb-dark text-[11px] hover:text-gb-red transition-colors shrink-0">rm</button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => onSave(form, initial?.id)} disabled={!form.location.trim()} className="flex-1 py-2.5 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
          {initial ? "Save Changes" : "Log Trip"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 border border-gb-border text-gb-muted text-sm rounded-xl hover:border-gb-border2 hover:text-gb-fg transition-colors">Cancel</button>
      </div>
    </div>
  );
}

export default function TripLog({ trips, lures, onSaveTrip, onDeleteTrip }: Props) {
  const [showForm, setShowForm]     = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [expandedId, setExpandedId]  = useState<number | null>(null);

  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));
  const totalCatches = trips.reduce((s, t) => s + t.catches.length, 0);

  const openEdit = (t: Trip) => { setEditingTrip(t); setShowForm(true); };
  const handleSave = (t: Omit<Trip, "id">, id?: number) => { onSaveTrip(t, id); setShowForm(false); setEditingTrip(null); };

  return (
    <div>
      {/* Stats bar */}
      <div className="flex gap-4 mb-5 px-5 py-4 bg-gb-surface border border-gb-border rounded-2xl shadow-sm">
        {[["Trips", trips.length], ["Catches", totalCatches], ["Avg/Trip", trips.length ? (totalCatches / trips.length).toFixed(1) : "—"]].map(([label, val]) => (
          <div key={label as string} className="text-center">
            <div className="text-gb-yellow font-bold text-lg">{val}</div>
            <div className="text-gb-faint text-[10px] uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-gb-yellow font-bold uppercase tracking-widest text-xs">Trip History</div>
        {!showForm && (
          <button onClick={() => { setEditingTrip(null); setShowForm(true); }} className="px-3.5 py-1.5 rounded-lg bg-gb-green2 text-gb-bg text-xs font-semibold hover:bg-gb-green transition-colors shadow-sm">+ Log Trip</button>
        )}
      </div>

      {/* Form */}
      {showForm && <TripForm lures={lures} initial={editingTrip} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingTrip(null); }} />}

      {/* Trip list */}
      {sorted.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gb-faint">
          <div className="text-4xl mb-3">🗓</div>
          <p className="text-sm">No trips logged yet — record your first one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((trip) => {
            const expanded = expandedId === trip.id;
            return (
              <div key={trip.id} className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
                {/* Trip header */}
                <button className="w-full text-left px-4 py-3 hover:bg-gb-border2 transition-colors" onClick={() => setExpandedId(expanded ? null : trip.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gb-yellow font-bold text-sm">{trip.location || "Unnamed spot"}</span>
                        <span className="text-gb-faint text-[11px]">{trip.waterBody}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gb-faint">
                        <span>📅 {new Date(trip.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span>⏱ {trip.duration}</span>
                        <span>🐟 {trip.catches.length} catch{trip.catches.length !== 1 ? "es" : ""}</span>
                      </div>
                    </div>
                    <span className="text-gb-faint text-xs mt-1">{expanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gb-border px-4 py-3">
                    {/* Conditions */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[trip.weather, trip.waterClarity, trip.temperature].filter(Boolean).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gb-bg border border-gb-border text-gb-faint text-[11px] rounded-sm">{tag}</span>
                      ))}
                    </div>

                    {/* Catches */}
                    {trip.catches.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] text-gb-faint uppercase tracking-widest mb-2">Catches</div>
                        <div className="flex flex-col gap-1.5">
                          {trip.catches.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 bg-gb-bg border border-gb-border rounded-sm px-3 py-2">
                              {c.photo && <img src={c.photo} alt={c.species} className="w-12 h-12 object-cover rounded-sm border border-gb-border shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="text-gb-fg text-xs font-bold">{c.species}</div>
                                <div className="text-gb-faint text-[11px]">{[c.weight, c.length].filter(Boolean).join(" · ")}</div>
                                {c.lureUsed && <div className="text-gb-green text-[11px]">🪝 {c.lureUsed}</div>}
                                {c.notes && <div className="text-gb-dark text-[11px] italic mt-0.5">{c.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {trip.notes && <div className="text-gb-muted text-xs italic mb-3 leading-relaxed">{trip.notes}</div>}

                    <div className="flex gap-2">
                      <button onClick={() => openEdit(trip)} className="px-3 py-1.5 border border-gb-border2 text-gb-blue text-xs font-medium rounded-lg hover:bg-gb-border2 transition-colors">Edit</button>
                      <button onClick={() => { if (confirm("Delete this trip?")) onDeleteTrip(trip.id); }} className="px-3 py-1.5 border border-gb-border text-gb-dark text-xs font-medium rounded-lg hover:border-gb-red2 hover:text-gb-red transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
