export interface Offer {
  name: string;
  tag: string;
  desc: string;
  feats: string[];
  logo: string; // data:image/... or ""
  shot: string; // data:image/... or ""
  old: number;
  new: number;
  end: string;      // naive datetime-local value
  endIso: string;   // ISO string WITH offset (source of truth)
  tz: string;       // UTC offset like "-05:00"
  url: string;      // checkout link (buy button destination)
  pageUrl: string;  // public page URL (share-post destination; DRAFT when empty)
  cta: string;
  ribbon: string;
  t1: string;
  t2: string;
  analytics: string; // buyer-pasted analytics snippet (export only, guarded)
  pageUrlNote?: string;
  currency: string;
  lang: string;
  guar: boolean;
  pfTicks: boolean[];
  theme: string;
  accent: string;
  noCountdown?: boolean; // evergreen variant: no countdown at all
}

export type PreflightState = "pass" | "fail" | "warn";

export interface PreflightCheck {
  state: PreflightState;
  label: string;
  focus: string;
  detail: string;
}

export interface RenderOpts {
  watermark?: boolean;   // free tier: small badge + og-tags omitted
  preview?: boolean;     // preview mode: never execute buyer analytics snippets
}

export interface ZipEntry {
  name: string;
  data: Uint8Array | string;
}

export const DEFAULTS: Offer = {
  name: "Your Product",
  tag: "The tool your workflow was missing.",
  desc: "Tell visitors what your product does and who it is for. Two sentences max — deal pages convert on clarity, not essays.",
  feats: ["Feature one — what it does", "Feature two — why it matters", "Feature three — the time it saves"],
  logo: "", old: 49, new: 19, end: "", endIso: "", tz: "", url: "", cta: "Grab the deal",
  ribbon: "BLACK FRIDAY — LIMITED TIME", t1: "", t2: "", shot: "", analytics: "", pageUrl: "",
  currency: "$", lang: "en", pfTicks: [false, false, false, false, false],
  theme: "midnight", accent: "#ff3b30", guar: false,
};

export const RIBBONS = [
  "BLACK FRIDAY — LIMITED TIME",
  "CYBER MONDAY — ENDS TONIGHT",
  "NEW YEAR SALE — ENDS SOON",
  "WINTER SALE — LIMITED TIME",
  "LAUNCH WEEK — SPECIAL PRICE",
];

export interface Theme {
  label: string; bg: string; panel: string; text: string;
  sub: string; btn: string; btnText: string; head: string;
}

export const THEMES: Record<string, Theme> = {
  midnight: { label: "Midnight", bg: "#0a0a0f", panel: "#141420", text: "#f2f3f7", sub: "#a0a6b8", btn: "#ffffff", btnText: "#0a0a0f", head: "system-ui" },
  ember:    { label: "Ember",    bg: "#120c08", panel: "#1e140c", text: "#f7ede2", sub: "#c0a48e", btn: "#ff9500", btnText: "#1a0e02", head: "Georgia, serif" },
  snow:     { label: "Snow",     bg: "#f6f7f9", panel: "#ffffff", text: "#111318", sub: "#5b6270", btn: "#111318", btnText: "#ffffff", head: "system-ui" },
  neon:     { label: "Neon",     bg: "#070510", panel: "#0e0b1e", text: "#eef2ff", sub: "#9a9ec9", btn: "#22ff88", btnText: "#04120a", head: "system-ui" },
};

export const PRO_THEMES = ["ember", "snow", "neon"];
