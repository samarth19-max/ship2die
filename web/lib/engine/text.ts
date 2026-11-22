export function esc(s: string | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** pick black/white text that stays readable on any accent color the user picks.
    WCAG-correct: linearize sRGB channels, compute relative luminance, pick the
    candidate text color with the higher measured contrast ratio. */
export function bestText(hex: string | undefined): string {
  function lin(c: number): number {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function lum(h: string): number {
    h = String(h || "#000").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = lin(parseInt(h.slice(0, 2), 16)), g = lin(parseInt(h.slice(2, 4), 16)), b = lin(parseInt(h.slice(4, 6), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a: string, b: string): number {
    const la = lum(a), lb = lum(b);
    const hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  const dark = "#111318", white = "#ffffff";
  return contrast(hex || "#000", dark) >= contrast(hex || "#000", white) ? dark : white;
}

/** rgba() from a hex + alpha — used by the OG canvas gradient */
export function hexA(hex: string | undefined, a: number): string {
  const h = String(hex || "#000").replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const r = parseInt(full.slice(0, 2), 16) || 0, g = parseInt(full.slice(2, 4), 16) || 0, b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}

export function slugify(name: string | undefined, fallback: string): string {
  return (name || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}
