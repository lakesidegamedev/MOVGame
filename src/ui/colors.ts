// Map a two-party Biden share to a red↔blue lean color. Tossups (near 0.5) read
// as muted purple; safe states saturate toward team colors.
export function shareToColor(demShare: number): string {
  const margin = (demShare - 0.5) * 2; // -1..+1 (Biden positive)
  const m = Math.max(-1, Math.min(1, margin));
  // Strength of saturation grows with |margin|; tossups stay pale.
  const strength = Math.min(1, Math.abs(m) / 0.18); // saturates ~9pt margin
  if (m >= 0) {
    // toward blue
    const t = strength;
    return mix([226, 232, 240], [37, 99, 235], t);
  }
  const t = strength;
  return mix([226, 232, 240], [220, 38, 38], t);
}

function mix(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function leanLabel(demShare: number): string {
  const pts = (demShare - 0.5) * 200;
  const a = Math.abs(pts);
  const who = pts >= 0 ? "D" : "R";
  if (a < 1) return "Tossup";
  if (a < 3) return `Tilt ${who} +${a.toFixed(1)}`;
  if (a < 6) return `Lean ${who} +${a.toFixed(1)}`;
  if (a < 12) return `Likely ${who} +${a.toFixed(0)}`;
  return `Safe ${who} +${a.toFixed(0)}`;
}

// ── Party colors as text ──────────────────────────────────────────────────
// Party colors come from game data and some are near black (CDU/CSU) or deep
// blue, which disappear as text on the dark panels. partyInk() returns the
// same hue lifted toward white until it reaches WCAG AA (4.5:1) against the
// raised surface (--surface-2). Use it for party-colored text; keep the raw
// color for fills, bars and map regions.
const SURFACE_2: [number, number, number] = [22, 34, 46];
const inkCache = new Map<string, string>();

function parseColor(color: string): [number, number, number] | null {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance([r, g, b]: number[]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function partyInk(color: string | undefined): string {
  if (!color) return "var(--text-1)";
  const cached = inkCache.get(color);
  if (cached) return cached;
  const rgb = parseColor(color);
  if (!rgb) return color;
  let out = rgb;
  for (let t = 0; t <= 1 && contrastRatio(out, SURFACE_2) < 4.5; t += 0.06) {
    out = rgb.map((v) => Math.round(v + (255 - v) * t)) as [number, number, number];
  }
  const result = out === rgb ? color : `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
  inkCache.set(color, result);
  return result;
}

/** Dark or light text, whichever reads better on a filled party color. */
export function textOn(color: string | undefined): string {
  const rgb = color ? parseColor(color) : null;
  if (!rgb) return "#fff";
  return contrastRatio(rgb, [10, 15, 20]) >= contrastRatio(rgb, [255, 255, 255]) ? "#0a0f14" : "#fff";
}

// Near-black party colors vanish as map or bar fills on the dark panels.
// partyFill() keeps the hue but lifts it until it separates from the panel
// (2.2:1 against --surface-1). Most party colors pass through unchanged.
const SURFACE_1: [number, number, number] = [17, 27, 38];
const fillCache = new Map<string, string>();
export function partyFill(color: string | undefined): string {
  if (!color) return "var(--gray-500)";
  const cached = fillCache.get(color);
  if (cached) return cached;
  const rgb = parseColor(color);
  if (!rgb) return color;
  let out = rgb;
  for (let t = 0; t <= 1 && contrastRatio(out, SURFACE_1) < 2.2; t += 0.04) {
    out = rgb.map((v) => Math.round(v + (255 - v) * t)) as [number, number, number];
  }
  const result = out === rgb ? color : `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
  fillCache.set(color, result);
  return result;
}
