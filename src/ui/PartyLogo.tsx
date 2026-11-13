import { useState, type ReactNode } from "react";
import { PARTY_LOGOS } from "@content/partyLogos";
import { partyFill } from "@ui/colors";

/**
 * The logo a party used at this election, or null. `country` is the country
 * id ("US", "UK", "CA", ...). A party slot that stood for a different party in
 * some years (France's centre slot before 2017) has no row for those years.
 */
export function partyLogoFor(country: string, party: string, year: number | null | undefined): string | null {
  if (year == null || !Number.isFinite(year)) return null;
  const c = country.toLowerCase();
  return PARTY_LOGOS.find((r) => r.country === c && r.party === party && r.from <= year && year <= r.to)?.file ?? null;
}

/** "1974feb" and "2024" are both election ids; the year is the leading number. */
export function electionYear(id: string | null | undefined): number | null {
  const m = /^\d{4}/.exec(id ?? "");
  return m ? Number(m[0]) : null;
}

/** Party id to logo, for the parties that have one at this election. */
export function partyLogosFor(country: string, parties: string[], year: number | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of parties) {
    const src = partyLogoFor(country, p, year);
    if (src) out[p] = src;
  }
  return out;
}

// A logo image on a small white tile so dark marks stay readable on the dark
// UI. It sits next to the party's name to identify the party; the name stays
// the label, so the image is decorative for screen readers. Logos load lazily
// and are credited on the Credits page. If the file fails, shows `fallback`.
export function LogoTile({ src, size = 16, className, fallback = null }: { src: string; size?: number; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <span className={`party-logo${className ? ` ${className}` : ""}`} style={{ "--logo-h": `${size}px` } as React.CSSProperties}>
      <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </span>
  );
}

// The party's logo at this election. With `color`, a party without a logo
// shows its colour swatch instead; without it, nothing.
export function PartyLogo({
  country,
  party,
  year,
  color,
  size = 16,
  className,
}: {
  country: string;
  party: string;
  year: number | null | undefined;
  color?: string;
  size?: number;
  className?: string;
}) {
  const src = partyLogoFor(country, party, year);
  const swatch = color ? <span className="swatch" style={{ "--party": partyFill(color) } as React.CSSProperties} /> : null;
  return src ? <LogoTile key={src} src={src} size={size} className={className} fallback={swatch} /> : swatch;
}
