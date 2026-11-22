import { Offer } from "./types";

export const TZ_OFFSETS = [-720,-660,-600,-570,-540,-480,-420,-360,-300,-240,-210,-180,-120,-60,0,60,120,180,210,240,270,300,330,345,360,390,420,450,480,510,525,540,570,600,630,660,720,765,780,840];

export function minutesToOffsetStr(m: number): string {
  m = Math.round(Number(m) || 0);
  const sign = m < 0 ? "-" : "+";
  const a = Math.abs(m);
  return sign + ("0" + Math.floor(a / 60)).slice(-2) + ":" + ("0" + (a % 60)).slice(-2);
}

export function offsetStrToMinutes(s: string | undefined): number | null {
  const m = /^([+-])(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const v = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  return m[1] === "-" ? -v : v;
}

export function buildTzOffsets(): number[] {
  return TZ_OFFSETS;
}

export function browserOffsetStr(): string {
  return minutesToOffsetStr(-new Date().getTimezoneOffset());
}

/** naive datetime-local value + chosen offset → ISO string WITH offset */
export function endToIso(naive: string, tz: string | undefined): string {
  let s = String(naive || "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return "";
  if (s.length === 16) s += ":00";
  let off = offsetStrToMinutes(tz);
  if (off === null) off = offsetStrToMinutes(browserOffsetStr());
  if (off === null) off = 0;
  return s + minutesToOffsetStr(off);
}

/** the absolute instant the countdown targets (null when nothing usable is set) */
export function endInstant(o: Offer): Date | null {
  if (o.endIso) { const d = new Date(o.endIso); if (!isNaN(d.getTime())) return d; }
  if (o.end) { const d2 = new Date(o.end); if (!isNaN(d2.getTime())) return d2; }
  return null;
}

const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function fmtDateAtTz(ms: number, offMin: number, withTime: boolean): string {
  const d = new Date(ms + (offMin || 0) * 60000);
  let out = MO[d.getUTCMonth()] + " " + d.getUTCDate();
  if (withTime) {
    const h = d.getUTCHours(), ap = h < 12 ? "AM" : "PM", h12 = h % 12 || 12;
    out += ", " + h12 + ":" + ("0" + d.getUTCMinutes()).slice(-2) + " " + ap;
  }
  return out;
}

export function offsetLabel(offMin: number): string {
  const a = Math.abs(offMin || 0);
  return "UTC" + ((offMin || 0) < 0 ? "-" : "+") + Math.floor(a / 60) + (a % 60 ? ":" + ("0" + (a % 60)).slice(-2) : "");
}

/** "Dec 31, 11:59 PM (UTC+2)" — the campaign's own timezone, never the viewer's */
export function fmtEndInTz(o: Offer): string {
  const d = endInstant(o); if (!d) return "";
  let off = offsetStrToMinutes(o.tz); if (off === null) off = 0;
  return fmtDateAtTz(d.getTime(), off, true) + " (" + offsetLabel(off) + ")";
}

/** fallback deadline: next Cyber Monday (Nov 30) — computed, never hardcoded */
export function fallbackNaiveEnd(): string {
  const fb = new Date(); fb.setMonth(10, 30); fb.setHours(23, 59, 0, 0);
  if (fb <= new Date()) fb.setFullYear(fb.getFullYear() + 1);
  return new Date(fb.getTime() - fb.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** single source of truth for the exported countdown: an absolute instant */
export function effectiveEndIso(o: Offer): string {
  if (o.endIso) { const d = new Date(o.endIso); if (!isNaN(d.getTime())) return o.endIso; }
  if (o.end && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(o.end))) return endToIso(o.end, o.tz);
  return endToIso(fallbackNaiveEnd(), o.tz);
}

export function fmtEndDisplay(o: Offer): string {
  const iso = effectiveEndIso(o), d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  let off = offsetStrToMinutes(o.tz);
  if (off === null) off = -new Date().getTimezoneOffset();
  return fmtDateAtTz(d.getTime(), off, true) + " (" + offsetLabel(off) + ")";
}

/** older saved projects had a naive deadline and no timezone — give them this device's offset */
export function migrateCfg(c: Partial<Offer>): Offer {
  const out = { ...c } as Offer;
  if (!out.tz || offsetStrToMinutes(out.tz) === null) out.tz = browserOffsetStr();
  if (out.end && (!out.endIso || isNaN(new Date(out.endIso).getTime()))) out.endIso = endToIso(out.end, out.tz);
  return out;
}
