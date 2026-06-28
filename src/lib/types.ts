export interface Lure {
  id: number;
  name: string;
  type: string;
  color: string;
  weight: string;
  size: string;
  quantity: number;
  notes: string;
}

export interface Conditions {
  clarity: string;
  weather: string;
  season: string;
  timeOfDay: string;
  species: string;
  notes: string;
}

export interface LurePick {
  lure: string;
  reason: string;
  technique: string;
}

export interface Recommendations {
  topPicks: LurePick[];
  avoid: string[];
  proTip: string;
}

export const LURE_TYPES = ["Crankbait", "Spinnerbait", "Jig", "Soft Plastic", "Topwater", "Spoon", "Swimbait", "Fly", "Chatterbait", "Buzzbait", "Other"];
export const COLORS = ["Natural/Shad", "Chartreuse", "White", "Black", "Red/Crawfish", "Green Pumpkin", "Blue/Purple", "Fire Tiger", "Silver/Chrome", "Gold", "Watermelon", "Other"];
export const SIZES = ["Micro (< 1\")", "Small (1–2\")", "Medium (2–4\")", "Large (4–6\")", "XL (6\"+)"];
export const LURE_WEIGHTS = [
  "1/4 oz", "3/8 oz", "1/2 oz", "5/8 oz", "3/4 oz",
  "1 oz", "1 1/4 oz", "1.5 oz", "1.65 oz",
];

// Lure types that use a fixed weight (hard baits)
// Soft plastics and flies are weightless by themselves — weight comes from the hook/rig
export const WEIGHTED_LURE_TYPES = new Set([
  "Crankbait", "Spinnerbait", "Jig", "Topwater", "Spoon",
  "Swimbait", "Chatterbait", "Buzzbait", "Other",
]);

export const SOFT_LURE_TYPES = new Set([
  "Soft Plastic", "Fly",
]);
export const WATER_CLARITY = ["Clear", "Slightly Stained", "Stained", "Muddy"];
export const WEATHER = ["Sunny & Calm", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain / Storm", "Cold Front (Post)"];
export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
export const TIME_OF_DAY = ["Dawn", "Morning", "Midday", "Afternoon", "Evening", "Dusk"];
export const SPECIES = ["Bass", "Trout", "Walleye", "Pike", "Crappie", "Bluegill", "Catfish", "Salmon", "Other"];

export const DEFAULT_LURES: Lure[] = [
  { id: 1, name: "Rapala Original Floater", type: "Crankbait", color: "Natural/Shad", weight: "1/4 oz", size: "Small (1–2\")", quantity: 3, notes: "Great for bass near structure" },
  { id: 2, name: "Strike King Rage Craw", type: "Soft Plastic", color: "Green Pumpkin", weight: "3/8 oz", size: "Medium (2–4\")", quantity: 6, notes: "Texas rig or jig trailer" },
  { id: 3, name: "Booyah Blade Spinnerbait", type: "Spinnerbait", color: "White", weight: "1/2 oz", size: "Medium (2–4\")", quantity: 2, notes: "Fast retrieve in open water" },
];

export interface Rod {
  id: number;
  name: string;
  brand: string;
  length: string;
  power: string;
  action: string;
  type: string;
  notes: string;
}

export interface Reel {
  id: number;
  name: string;
  brand: string;
  type: string;
  gearRatio: string;
  ballBearings: string;
  notes: string;
}

export const ROD_LENGTHS   = ["4'–5'", "5'–6'", "6'–6'6\"", "6'6\"–7'", "7'–7'6\"", "7'6\"+"];
export const ROD_POWERS    = ["Ultra Light", "Light", "Medium Light", "Medium", "Medium Heavy", "Heavy", "Extra Heavy"];
export const ROD_ACTIONS   = ["Slow", "Moderate", "Moderate Fast", "Fast", "Extra Fast"];
export const ROD_TYPES     = ["Spinning", "Casting", "Fly", "Ice", "Trolling", "Other"];
export const REEL_TYPES    = ["Spinning", "Baitcaster", "Spincast", "Fly", "Trolling", "Other"];
export const GEAR_RATIOS   = ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)", "7:1+ (Extra Fast)"];
export const BALL_BEARINGS = ["1–3", "4–6", "7–9", "10+"];

export interface Catch {
  id: number;
  species: string;
  weight: string;   // e.g. "3.2 lbs"
  length: string;   // e.g. "18 in"
  lureUsed: string; // lure name from inventory
  notes: string;
  photo?: string;   // base64 data URL
}

export interface Trip {
  id: number;
  date: string;          // ISO date string
  location: string;
  waterBody: string;     // lake, river, pond, etc.
  waterClarity: string;
  weather: string;
  temperature: string;   // air temp
  duration: string;      // e.g. "4 hours"
  catches: Catch[];
  notes: string;
}

export const WATER_BODY_TYPES = ["Lake", "River", "Pond", "Reservoir", "Creek", "Bay", "Ocean", "Other"];
export const FISH_SPECIES = ["Bass (Largemouth)", "Bass (Smallmouth)", "Bass (Spotted)", "Trout (Rainbow)", "Trout (Brown)", "Walleye", "Pike", "Muskie", "Crappie", "Bluegill", "Catfish", "Salmon", "Perch", "Carp", "Other"];
export const TRIP_DURATIONS = ["1 hour", "2 hours", "3 hours", "4 hours", "Half day", "Full day", "Multi-day"];

export type TargetSpecies =
  | "Bass"
  | "Trout"
  | "Walleye"
  | "Pike / Muskie"
  | "Panfish"
  | "Catfish"
  | "Salmon / Steelhead"
  | "All Species";

export interface SpeciesProfile {
  label: TargetSpecies;
  emoji: string;
  description: string;
  lureTypes: string[];
  colors: string[];
  rodTypes: string[];
  rodPowers: string[];
  rodActions: string[];
  reelTypes: string[];
  gearRatios: string[];
  aiContext: string; // injected into the recommendation prompt
}

export const SPECIES_PROFILES: Record<TargetSpecies, SpeciesProfile> = {
  "Bass": {
    label: "Bass", emoji: "🐟", description: "Largemouth, Smallmouth & Spotted Bass",
    lureTypes: ["Crankbait", "Spinnerbait", "Jig", "Soft Plastic", "Topwater", "Swimbait", "Chatterbait", "Buzzbait", "Spoon", "Other"],
    colors: ["Green Pumpkin", "Watermelon", "Chartreuse", "White", "Natural/Shad", "Black", "Red/Crawfish", "Blue/Purple", "Fire Tiger", "Other"],
    rodTypes: ["Casting", "Spinning", "Other"],
    rodPowers: ["Medium Light", "Medium", "Medium Heavy", "Heavy", "Extra Heavy"],
    rodActions: ["Fast", "Extra Fast", "Moderate Fast", "Moderate"],
    reelTypes: ["Baitcaster", "Spinning", "Other"],
    gearRatios: ["6:1–7:1 (Fast)", "7:1+ (Extra Fast)", "5:1–6:1 (Medium)", "4:1–5:1 (Slow)"],
    aiContext: "You are advising a bass angler targeting largemouth, smallmouth, and spotted bass. Focus on structure fishing, cover, seasonal bass patterns, and techniques like flipping, pitching, frogging, drop shot, and crankbait retrieves.",
  },
  "Trout": {
    label: "Trout", emoji: "🎣", description: "Rainbow, Brown & Brook Trout",
    lureTypes: ["Fly", "Spoon", "Spinner", "Soft Plastic", "Crankbait", "Other"],
    colors: ["Natural/Shad", "Gold", "Silver/Chrome", "Pink/Salmon", "Olive/Brown", "Chartreuse", "Other"],
    rodTypes: ["Spinning", "Fly", "Other"],
    rodPowers: ["Ultra Light", "Light", "Medium Light", "Medium"],
    rodActions: ["Slow", "Moderate", "Moderate Fast", "Fast"],
    reelTypes: ["Spinning", "Fly", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)"],
    aiContext: "You are advising a trout angler. Focus on reading currents, matching the hatch for fly fishing, drift presentations, water temperature effects on trout activity, and techniques like nymphing, dry fly, streamer fishing, and light spinning.",
  },
  "Walleye": {
    label: "Walleye", emoji: "🐠", description: "Walleye & Sauger",
    lureTypes: ["Jig", "Crankbait", "Soft Plastic", "Spoon", "Spinner", "Swimbait", "Other"],
    colors: ["Natural/Shad", "Chartreuse", "Orange/Gold", "White", "Pink/Salmon", "Fire Tiger", "Silver/Chrome", "Other"],
    rodTypes: ["Spinning", "Casting", "Trolling", "Other"],
    rodPowers: ["Light", "Medium Light", "Medium", "Medium Heavy"],
    rodActions: ["Moderate", "Moderate Fast", "Fast"],
    reelTypes: ["Spinning", "Baitcaster", "Trolling", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)"],
    aiContext: "You are advising a walleye angler. Focus on low-light feeding windows (dawn, dusk, night), bottom presentations, trolling techniques, jigging along structure and drop-offs, and how walleye relate to temperature and light levels.",
  },
  "Pike / Muskie": {
    label: "Pike / Muskie", emoji: "🦈", description: "Northern Pike & Muskellunge",
    lureTypes: ["Swimbait", "Spoon", "Topwater", "Jerkbait", "Crankbait", "Soft Plastic", "Fly", "Other"],
    colors: ["Silver/Chrome", "Gold", "Fire Tiger", "Natural/Shad", "White", "Black", "Red/Orange", "Other"],
    rodTypes: ["Casting", "Spinning", "Other"],
    rodPowers: ["Heavy", "Extra Heavy", "Medium Heavy"],
    rodActions: ["Fast", "Extra Fast", "Moderate Fast"],
    reelTypes: ["Baitcaster", "Spinning", "Other"],
    gearRatios: ["5:1–6:1 (Medium)", "6:1–7:1 (Fast)", "4:1–5:1 (Slow)"],
    aiContext: "You are advising a pike and muskie angler — the fish of 10,000 casts. Focus on large profile baits, figure-8 boatside techniques, figure eights, weed edges, cold water patterns, and the importance of wire leaders. Muskie are notoriously difficult to trigger.",
  },
  "Panfish": {
    label: "Panfish", emoji: "🐡", description: "Crappie, Bluegill & Perch",
    lureTypes: ["Soft Plastic", "Jig", "Fly", "Spinner", "Spoon", "Other"],
    colors: ["Chartreuse", "White", "Pink/Salmon", "Natural/Shad", "Yellow", "Orange/Gold", "Other"],
    rodTypes: ["Spinning", "Fly", "Ice", "Other"],
    rodPowers: ["Ultra Light", "Light", "Medium Light"],
    rodActions: ["Slow", "Moderate", "Moderate Fast"],
    reelTypes: ["Spinning", "Spincast", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)"],
    aiContext: "You are advising a panfish angler targeting crappie, bluegill, and perch. Focus on light tackle finesse presentations, small jig heads, micro plastics, finding brush piles and structure, dock fishing, and the schooling behavior of crappie.",
  },
  "Catfish": {
    label: "Catfish", emoji: "🐈", description: "Channel, Blue & Flathead Catfish",
    lureTypes: ["Bottom Rig", "Jig", "Soft Plastic", "Spoon", "Other"],
    colors: ["Natural/Shad", "Chartreuse", "Orange/Gold", "White", "Other"],
    rodTypes: ["Casting", "Spinning", "Trolling", "Other"],
    rodPowers: ["Medium Heavy", "Heavy", "Extra Heavy", "Medium"],
    rodActions: ["Moderate", "Moderate Fast", "Fast"],
    reelTypes: ["Baitcaster", "Spinning", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)"],
    aiContext: "You are advising a catfish angler. Focus on bait selection (cut bait, stink bait, live bait), bottom presentations, finding deep holes and current breaks, night fishing patterns, and the differences between channel, blue, and flathead catfish behavior.",
  },
  "Salmon / Steelhead": {
    label: "Salmon / Steelhead", emoji: "🐟", description: "Salmon & Steelhead / Sea-Run Trout",
    lureTypes: ["Spoon", "Spinner", "Fly", "Soft Plastic", "Crankbait", "Swimbait", "Other"],
    colors: ["Pink/Salmon", "Silver/Chrome", "Gold", "Orange/Gold", "Chartreuse", "Natural/Shad", "Other"],
    rodTypes: ["Spinning", "Fly", "Casting", "Trolling", "Other"],
    rodPowers: ["Medium", "Medium Heavy", "Heavy", "Light"],
    rodActions: ["Moderate", "Moderate Fast", "Fast"],
    reelTypes: ["Spinning", "Fly", "Trolling", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)"],
    aiContext: "You are advising a salmon and steelhead angler. Focus on run timing, river flow conditions, presenting lures at the right depth and speed in current, drift fishing, back-trolling, and how water temperature and clarity affect fish aggression.",
  },
  "All Species": {
    label: "All Species", emoji: "🎯", description: "General freshwater & saltwater fishing",
    lureTypes: ["Crankbait", "Spinnerbait", "Jig", "Soft Plastic", "Topwater", "Spoon", "Swimbait", "Fly", "Spinner", "Chatterbait", "Buzzbait", "Other"],
    colors: ["Natural/Shad", "Chartreuse", "White", "Black", "Red/Crawfish", "Green Pumpkin", "Blue/Purple", "Fire Tiger", "Silver/Chrome", "Gold", "Watermelon", "Other"],
    rodTypes: ["Spinning", "Casting", "Fly", "Ice", "Trolling", "Other"],
    rodPowers: ["Ultra Light", "Light", "Medium Light", "Medium", "Medium Heavy", "Heavy", "Extra Heavy"],
    rodActions: ["Slow", "Moderate", "Moderate Fast", "Fast", "Extra Fast"],
    reelTypes: ["Spinning", "Baitcaster", "Spincast", "Fly", "Trolling", "Other"],
    gearRatios: ["4:1–5:1 (Slow)", "5:1–6:1 (Medium)", "6:1–7:1 (Fast)", "7:1+ (Extra Fast)"],
    aiContext: "You are advising a multi-species angler. Consider the target species listed in the conditions and tailor your recommendations accordingly, accounting for the specific behavior, habitat, and feeding patterns of that fish.",
  },
};

export interface QuickCardRod {
  number: number;
  lure: string;
  color: string;
  role: "PRIMARY" | "FOLLOW-UP" | "SITUATIONAL" | "CLEANUP";
  tips: string[];
}

export interface QuickCardTimeBlock {
  time: string;
  label: string;
  mood: "dawn" | "morning" | "midday" | "afternoon" | "evening";
  focus: string;
  rods: QuickCardRod[];
}

export interface QuickCardDecisionRule {
  lureType: string;
  meaning: string;
  ifItWorks: string;
  color: "green" | "yellow" | "orange" | "blue";
}

export interface QuickCard {
  headline: string;
  bestWindow: string;
  timeBlocks: QuickCardTimeBlock[];
  decisionRules: QuickCardDecisionRule[];
  oneLineStrategy: string;
  proTip: string;
}
