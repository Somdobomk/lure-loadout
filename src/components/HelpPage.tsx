"use client";

import { useState } from "react";

interface FaqItem { q: string; a: React.ReactNode; }
interface Section  { title: string; icon: string; items: FaqItem[]; }

const FAQ_SECTIONS: Section[] = [
  {
    title: "Getting Started",
    icon: "🚀",
    items: [
      { q: "What is LureLoadout?", a: "LureLoadout is an AI-powered fishing gear manager. Track your lures, rods, and reels, log fishing trips and catches, get AI-generated daily recommendations, and build time-blocked Quick Card game plans — all tailored to your conditions and the lures you actually own." },
      { q: "How do I set my target species?", a: "On first launch you'll see an onboarding screen asking you to pick your primary species. This tailors lure types, colors, rod/reel specs, and AI recommendations throughout the app. You can change it any time by tapping the settings icon in the header." },
      { q: "Does LureLoadout work offline?", a: "Your gear inventory and trip log load instantly from a local cache on your device. Cloud sync keeps everything current across devices when you are online. Daily Picks and Quick Card require an internet connection since they call the Gemini AI." },
      { q: "Does LureLoadout sync across my phone, tablet, and computer?", a: "Yes. Your entire inventory, trip log, and Quick Card sync automatically via Supabase whenever you make a change. Open the app on any device and your data is there — no manual export needed." },
      {
        q: "How do I install LureLoadout on my iPhone?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-gb-fg2">
            <li>Open the app URL in <strong className="text-gb-fg">Safari</strong> (not Chrome)</li>
            <li>Tap the <strong className="text-gb-fg">Share</strong> button (box with arrow at the bottom)</li>
            <li>Tap <strong className="text-gb-fg">&quot;Add to Home Screen&quot;</strong></li>
            <li>Tap <strong className="text-gb-fg">Add</strong> — the app icon appears on your home screen</li>
          </ol>
        ),
      },
      {
        q: "How do I install LureLoadout on my Android?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-gb-fg2">
            <li>Open the app URL in <strong className="text-gb-fg">Chrome</strong></li>
            <li>Tap the <strong className="text-gb-fg">three-dot menu</strong> (top right corner)</li>
            <li>Tap <strong className="text-gb-fg">&quot;Add to Home screen&quot;</strong></li>
            <li>Tap <strong className="text-gb-fg">Add</strong> — the app icon appears on your home screen</li>
            <li>On Samsung devices you may see <strong className="text-gb-fg">&quot;Install app&quot;</strong> instead — tap that for a more native experience</li>
          </ol>
        ),
      },
    ],
  },
  {
    title: "Lure Inventory",
    icon: "🪝",
    items: [
      { q: "How do I add a lure?", a: "Go to the Lures tab and tap + Add. Fill in the name, type, color, weight, size, quantity, and any notes. Tap Add to inventory to save. The type and color dropdowns are filtered to your target species but you can pick any option from the list." },
      { q: "What does the quantity counter do?", a: "The +/− buttons on each lure card let you quickly adjust how many you have — handy when you lose one to a snag or buy a new pack on the water. Quantity turns red at zero so you know what needs restocking." },
      { q: "What is the Restock tab?", a: "The Restock tab automatically surfaces any lure with 0 or 1 in stock. It shows an OUT or LOW badge on each card, lets you update quantities directly, and includes a Buy on Amazon link. Tap Copy list to get a plain-text shopping list you can paste into Notes or text to yourself before heading to the tackle shop." },
      { q: "What are the Edit, Buy, and Remove buttons on each card?", a: "Every lure card has a persistent action row at the bottom with three tappable buttons — Edit (opens the edit form), Buy (opens an Amazon search for that lure), and Remove (deletes the lure with confirmation). These are always visible on both phones and desktop." },
      { q: "Does the weight field apply to all lure types?", a: "No — weight only appears for hard baits like crankbaits, swimbaits, jigs, spinnerbaits, and topwaters. It is hidden for Soft Plastic and Fly since those get their weight from the hook or rig, not the bait itself. Select Custom to enter any weight not in the dropdown." },
      { q: "Can I bulk delete lures?", a: "Yes. A mass delete bar sits just below the filter chips in the All lures tab. Clear all removes every lure. If you have a type filter active, a second button appears to delete just that category." },
      { q: "What lure weight should I choose?", a: "Light (1/4–3/8 oz) covers most finesse and search baits. Mid-range (1/2–3/4 oz) works for jigs, spinnerbaits, and bladed jigs. Heavy (1 oz+) is for swimbaits, deep structure, or punching through cover. Use Custom for specific weights like 1.65 oz." },
    ],
  },
  {
    title: "Rods & Reels",
    icon: "🎣",
    items: [
      {
        q: "What do Power and Action mean on a rod?",
        a: (
          <div className="space-y-1 text-gb-fg2">
            <p><strong className="text-gb-fg">Power</strong> is how much force it takes to bend the rod — from Ultra Light to Extra Heavy. Match power to your lure weight and target fish size.</p>
            <p><strong className="text-gb-fg">Action</strong> is where the rod bends — Fast/Extra Fast bends near the tip (better hook sets on single hooks), Moderate/Slow bends further down (better for treble-hook lures like crankbaits).</p>
          </div>
        ),
      },
      { q: "What gear ratio should I pick for my reel?", a: "Slow (4:1–5:1) for deep-diving crankbaits and slow-rolling swimbaits. Medium (5:1–6:1) is a versatile all-arounder. Fast (6:1–7:1) for jigs, Texas rigs, and anything needing quick slack pickup. Extra Fast (7:1+) for burning spinnerbaits and buzzbaits." },
      { q: "Can I pair a rod and reel together?", a: "Use the Notes field on each to record the pairing. A dedicated pairing feature is planned for a future update." },
    ],
  },
  {
    title: "Daily Picks",
    icon: "✨",
    items: [
      { q: "How does the AI pick lures?", a: "Daily Picks sends your entire lure inventory plus today's conditions (water clarity, weather, season, time of day, target species) to Google Gemini AI. It reasons about which lures from your actual inventory best match those conditions, explains why each was chosen, and suggests the specific technique to use." },
      { q: "Can I switch tabs while waiting for Daily Picks?", a: "Yes. Once you tap Get Recommendations the request runs in the background. You can switch to Lures, Trips, or any other tab — your picks will be waiting when you return." },
      { q: "Why is Daily Picks a paid feature?", a: "Each recommendation calls the Gemini AI API which has a cost per request. The subscription covers those API costs and keeps the rest of the app free." },
      { q: "How accurate are the recommendations?", a: "The AI has strong general fishing knowledge but does not know your specific lake or local forage. Use the picks as a smart starting point, then adjust based on what you see on the water. The more specific your Extra Notes (water temp, structure type, forage activity), the better the output." },
      { q: "How do I cancel my subscription?", a: "Tap Manage subscription in the Daily Picks or Quick Card tab. This opens the Stripe billing portal where you can cancel, update payment details, or view invoices." },
    ],
  },
  {
    title: "Quick Card",
    icon: "🃏",
    items: [
      { q: "What is a Quick Card?", a: "A Quick Card is a time-blocked game plan for a single fishing session — like a professional guide card. It includes 2–3 time windows (dawn, morning, midday, etc.), a 4-rod loadout pulled from your actual inventory with role labels (Primary, Follow-Up, Situational, Cleanup), decision rules for when to switch lures, and a one-line strategy." },
      { q: "Can I switch tabs while the Quick Card is generating?", a: "Yes. Quick Cards take up to a minute to generate. Tap Generate Quick Card and then switch to any other tab — the card will be ready when you come back." },
      { q: "Does my Quick Card sync across devices?", a: "Yes. As soon as a card is generated it is saved to Supabase and synced to all your devices automatically. Generate a card on your desktop before heading out and it will be waiting on your phone at the lake." },
      { q: "How long does my Quick Card stay saved?", a: "Quick Cards are cached for 24 hours — a game plan is only useful for the day it was made. After 24 hours the card expires and you can generate a fresh one. Tap Clear at any time to dismiss it early." },
      { q: "How do I save my Quick Card as an image?", a: "Tap Save as image below the generated card. It downloads a high-resolution PNG of the full card that you can share, keep in your Photos app, or reference on the water without needing the app open." },
    ],
  },
  {
    title: "Trip Log",
    icon: "📋",
    items: [
      { q: "How do I log a trip?", a: "Go to the Trips tab and tap + Log Trip. Fill in the date, location, water body type, conditions, and duration. Add individual catches inside the trip — each catch records species, weight, length, the lure used (pulled from your inventory), notes, and an optional photo." },
      { q: "Can I add a photo of my catch?", a: "Yes — tap Add photo inside the catch form. On iPhone and Android this opens your camera or photo library. Photos are stored with your trip log." },
      { q: "What are the stats at the top of the Trip Log?", a: "The three stats show total trips logged, total individual catches, and your average catches per trip. They update automatically as you add or delete entries." },
    ],
  },
  {
    title: "Account & Privacy",
    icon: "🔐",
    items: [
      { q: "Where is my data stored?", a: "Your inventory, trip log, and Quick Card are securely stored in Supabase (a cloud database) linked to your account. A local cache is kept on your device for instant loading. Account credentials are managed by Clerk. The app never shares your fishing data." },
      { q: "What happens if I clear my browser data?", a: "Clearing browser data only removes the local cache — your data reloads from the cloud automatically on next login. Your inventory, trips, and Quick Card are safe in Supabase." },
      { q: "How do I manually back up my data to the cloud?", a: "Go to Help and tap Backup Everything to Cloud at the bottom of the page. This pushes your full inventory and trip logs to Supabase immediately — useful before switching devices." },
      { q: "How do I delete my account?", a: "Tap your profile avatar in the header, go to Manage Account, then Security, then Delete Account. This removes your Clerk account. Your inventory can be cleared using the mass delete tools in the Lures and Rods tabs." },
    ],
  },
]

const IMPORT_EXPORT_GUIDE = [
  {
    title: "Exporting Your Lure Inventory",
    icon: "⬇",
    color: "text-gb-blue",
    steps: [
      "Go to the <strong>Lures</strong> tab.",
      "Tap the <strong>⬇ Export</strong> button in the toolbar.",
      "Your browser will download a file called <strong>lure-loadout-lures.json</strong>.",
      "Save this file somewhere safe — your Downloads folder, iCloud Drive, or Google Drive.",
    ],
    note: "Export regularly to back up your inventory. If you ever switch devices or clear your browser data, this file lets you restore everything in seconds.",
    code: null,
  },
  {
    title: "Importing Lures",
    icon: "⬆",
    color: "text-gb-green",
    steps: [
      "Go to the <strong>Lures</strong> tab.",
      "Tap the <strong>⬆ Import</strong> button in the toolbar.",
      "Select your <strong>.json</strong> file (previously exported from LureLoadout, or a JSON file you've prepared).",
      "The app will merge the imported lures with your existing inventory, skipping any lures with duplicate names.",
    ],
    note: "Importing from ChatGPT or another app? Ask it to format your lure list as a JSON array with fields: name, type, color, weight, size, quantity, notes. Then save that as a .json file and import it here.",
    code: null,
  },
  {
    title: "Importing from ChatGPT",
    icon: "🤖",
    color: "text-gb-orange",
    steps: [
      "Open your ChatGPT conversation where your lure inventory is stored.",
      "Ask ChatGPT: <em>\"Export my fishing lure inventory as a JSON array. Each lure should have fields: name, type, color, weight, size, quantity, notes.\"</em>",
      "Copy the JSON it provides and paste it into a text editor (Notes, TextEdit, VS Code, etc.).",
      "Save the file with a <strong>.json</strong> extension, e.g. <strong>my-lures.json</strong>.",
      "In LureLoadout, tap <strong>⬆ Import</strong> and select that file.",
    ],
    note: null,
    code: null,
  },
  {
    title: "Exporting & Importing Rods and Reels",
    icon: "🎏",
    color: "text-gb-purple",
    steps: [
      "Go to the <strong>Rods & Reels</strong> tab.",
      "Switch to either the <strong>Rods</strong> or <strong>Reels</strong> sub-tab.",
      "Use the <strong>⬆ Import</strong> or <strong>⬇ Export</strong> button in that section's header.",
      "Rods export to <strong>lure-loadout-rods.json</strong> and reels to <strong>lure-loadout-reels.json</strong> — they are separate files.",
    ],
    note: "Rods and reels are stored and exported separately from lures. Import a rod file on the Rods tab and a reel file on the Reels tab.",
    code: null,
  },
  {
    title: "JSON Format Reference",
    icon: "📄",
    color: "text-gb-yellow",
    steps: [],
    note: null,
    code: `// Lure
{
  "name": "Rapala Original Floater",
  "type": "Crankbait",
  "color": "Natural/Shad",
  "weight": "1/4 oz",
  "size": "Small (1–2\\")",
  "quantity": 3,
  "notes": "Great for bass near structure"
}

// Rod
{
  "name": "St. Croix Mojo Bass",
  "brand": "St. Croix",
  "type": "Casting",
  "length": "7'–7'6\\"",
  "power": "Medium Heavy",
  "action": "Fast",
  "notes": "Paired with Curado 200"
}

// Reel
{
  "name": "Shimano Curado 200",
  "brand": "Shimano",
  "type": "Baitcaster",
  "gearRatio": "6:1–7:1 (Fast)",
  "ballBearings": "7–9",
  "notes": "12 lb fluoro"
}`,
  },
];

/* ─── AccordionItem ──────────────────────────────────────────────────────── */
function AccordionItem({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-gb-border last:border-0 transition-colors ${open ? "bg-gb-bg/40" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-start justify-between gap-4 px-5 py-4 hover:bg-gb-bg/30 transition-colors"
      >
        <span className="text-gb-fg font-medium text-sm leading-relaxed">{q}</span>
        <span className={`text-gb-faint text-lg shrink-0 transition-transform duration-200 mt-0.5 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-gb-fg2 text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── GuideCard ──────────────────────────────────────────────────────────── */
function GuideCard({ title, icon, color, steps, note, code }: typeof IMPORT_EXPORT_GUIDE[0]) {
  return (
    <div className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gb-border flex items-center gap-3">
        <span className={`text-xl ${color}`}>{icon}</span>
        <span className="font-semibold text-gb-fg text-sm">{title}</span>
      </div>
      <div className="px-5 py-4">
        {steps.length > 0 && (
          <ol className="space-y-2.5 mb-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start text-sm text-gb-fg2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-gb-border flex items-center justify-center text-[11px] font-bold text-gb-muted mt-0.5">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: step }} />
              </li>
            ))}
          </ol>
        )}
        {note && (
          <div className="flex gap-2.5 px-3.5 py-3 bg-gb-yellow2/10 border border-gb-yellow2/30 rounded-xl text-xs text-gb-fg2 leading-relaxed">
            <span className="text-gb-yellow shrink-0">💡</span>
            <span>{note}</span>
          </div>
        )}
        {code && (
          <pre className="mt-3 p-4 bg-gb-bg border border-gb-border rounded-xl text-xs text-gb-fg2 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
        )}
      </div>
    </div>
  );
}

/* ─── HelpPage ───────────────────────────────────────────────────────────── */
interface HelpPageProps {
  onBackupToCloud?: () => void;
  syncing?: boolean;
  lastSynced?: string | null;
  syncError?: string | null;
}

type Tab = "faq" | "importexport";

export default function HelpPage({ onBackupToCloud, syncing, lastSynced, syncError }: HelpPageProps) {
  const [tab, setTab] = useState<Tab>("faq");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gb-surface border border-gb-border rounded-2xl mb-6">
        {([["faq", "❓ FAQ"], ["importexport", "📤 Import & Export"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={["flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-150",
              tab === key ? "bg-gb-bg text-gb-yellow shadow-sm" : "text-gb-faint hover:text-gb-muted",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FAQ ── */}
      {tab === "faq" && (
        <div className="space-y-4">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} className="bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gb-border bg-gb-bg/30">
                <span className="text-lg">{section.icon}</span>
                <span className="font-semibold text-gb-fg text-sm">{section.title}</span>
              </div>
              {section.items.map((item) => (
                <AccordionItem key={item.q} {...item} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Import & Export ── */}
      {tab === "importexport" && (
        <div className="space-y-4">
          <p className="text-gb-muted text-sm leading-relaxed px-1">
            LureLoadout stores your inventory locally on your device. Use the export feature to back up your data and the import feature to restore it or migrate from another app.
          </p>
          {IMPORT_EXPORT_GUIDE.map((card) => (
            <GuideCard key={card.title} {...card} />
          ))}
        </div>
      )}

      {/* ── Cloud Backup Panel ── */}
      <div className="mt-6 bg-gb-surface border border-gb-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gb-border bg-gb-bg/30">
          <span className="text-lg">☁️</span>
          <span className="font-semibold text-gb-fg text-sm">Cloud Backup</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Sync status */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gb-bg border border-gb-border rounded-xl">
            {syncing ? (
              <>
                <div className="w-2 h-2 rounded-full bg-gb-yellow2 animate-pulse shrink-0" />
                <span className="text-gb-fg2 text-sm">Syncing to cloud…</span>
              </>
            ) : syncError ? (
              <>
                <div className="w-2 h-2 rounded-full bg-gb-orange shrink-0" />
                <div>
                  <div className="text-gb-orange text-sm font-medium">Offline</div>
                  <div className="text-gb-faint text-xs">{syncError}</div>
                </div>
              </>
            ) : lastSynced ? (
              <>
                <div className="w-2 h-2 rounded-full bg-gb-green2 shrink-0" />
                <div>
                  <div className="text-gb-green text-sm font-medium">Synced to cloud ✓</div>
                  <div className="text-gb-faint text-xs">Last backup: {new Date(lastSynced).toLocaleString()}</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gb-faint shrink-0" />
                <span className="text-gb-faint text-sm">Not yet synced this session</span>
              </>
            )}
          </div>

          <p className="text-gb-fg2 text-sm leading-relaxed">
            Your data syncs automatically when you make changes. Use the button below to force an immediate full backup — useful before clearing your browser or switching devices.
          </p>

          {onBackupToCloud && (
            <button
              onClick={onBackupToCloud}
              disabled={syncing}
              className="w-full py-3 rounded-xl bg-gb-green2 text-gb-bg font-semibold text-sm hover:bg-gb-green transition-colors disabled:opacity-50 shadow-sm"
            >
              {syncing ? "Backing up…" : "☁️ Backup Everything to Cloud"}
            </button>
          )}

          <div className="flex gap-2.5 px-3.5 py-3 bg-gb-yellow2/10 border border-gb-yellow2/30 rounded-xl text-xs text-gb-fg2 leading-relaxed">
            <span className="text-gb-yellow shrink-0">💡</span>
            <span>
              Logged-in users with cloud sync enabled can safely clear their browser storage — data reloads from the cloud on next login. Use the Export buttons on each tab for an extra offline backup.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
