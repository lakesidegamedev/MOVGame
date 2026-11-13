import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTY_LOGOS } from "../partyLogos";
import { electionYear, partyLogoFor, partyLogosFor } from "../../ui/PartyLogo";

const ROOT = resolve(__dirname, "../../..");
const PUBLIC_DIR = resolve(ROOT, "public");
const BUNDLES = resolve(ROOT, "apps/native/shared/src/commonMain/resources/bundles");
const credits = JSON.parse(readFileSync(resolve(PUBLIC_DIR, "images/logos/credits.json"), "utf8")) as {
  party: string; file: string; source: string; title: string; author: string; license: string;
}[];

/** Party ids per country, from the exported bundles the native apps use. */
function partyIds(): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = { us: new Set(["dem", "rep"]) };
  const read = (path: string) => JSON.parse(readFileSync(path, "utf8")) as { system: { parties: { id: string }[] } };
  out.uk = new Set(read(resolve(BUNDLES, "uk.json")).system.parties.map((p) => p.id));
  for (const f of readdirSync(resolve(BUNDLES, "countries"))) {
    out[f.replace(/\.json$/, "")] = new Set(read(resolve(BUNDLES, "countries", f)).system.parties.map((p) => p.id));
  }
  return out;
}

describe("party logos", () => {
  it("every logo is a small local WebP with a credit naming its Commons source", () => {
    const credited = new Map(credits.map((c) => [c.file, c]));
    for (const row of PARTY_LOGOS) {
      expect(row.file).toMatch(/^images\/logos\/[a-z0-9-]+\.webp$/);
      const path = resolve(PUBLIC_DIR, row.file);
      expect(existsSync(path), row.file).toBe(true);
      expect(statSync(path).size, row.file).toBeLessThanOrEqual(15_000);
      const credit = credited.get(row.file);
      expect(credit, row.file).toBeDefined();
      expect(credit!.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(credit!.author.length).toBeGreaterThan(0);
      expect(credit!.license.length).toBeGreaterThan(0);
    }
  });

  it("rows name real party slots and never overlap", () => {
    const ids = partyIds();
    const seen = new Map<string, [number, number][]>();
    for (const row of PARTY_LOGOS) {
      expect(ids[row.country]?.has(row.party), `${row.country}:${row.party}`).toBe(true);
      expect(row.from).toBeLessThanOrEqual(row.to);
      const key = `${row.country}:${row.party}`;
      for (const [a, b] of seen.get(key) ?? []) {
        expect(row.to < a || row.from > b, `${key} ${row.from}-${row.to} overlaps ${a}-${b}`).toBe(true);
      }
      seen.set(key, [...(seen.get(key) ?? []), [row.from, row.to]]);
    }
  });

  it("picks the logo of the party that held the slot at that election", () => {
    // France's centre slot is Mitterrand's Socialists in 1981: no Ensemble logo then.
    expect(partyLogoFor("FR", "ens", 1981)).toBeNull();
    expect(partyLogoFor("FR", "ens", 2017)).toMatch(/en-marche/);
    expect(partyLogoFor("FR", "ens", 2022)).toMatch(/lrem/);
    expect(partyLogoFor("DE", "lnk", 1994)).toMatch(/pds/);
    expect(partyLogoFor("DE", "lnk", 2013)).toMatch(/linke/);
    expect(partyLogoFor("UK", "ld", 1983)).toMatch(/alliance/);
    expect(partyLogoFor("UK", "con", electionYear("1974feb"))).toMatch(/1980s/);
    expect(partyLogoFor("US", "dem", 2024)).not.toBeNull();
    expect(partyLogoFor("US", "dem", 2028)).toBeNull();
    expect(partyLogoFor("US", "dem", null)).toBeNull();
    expect(Object.keys(partyLogosFor("CA", ["lpc", "cpc", "oth"], 2015))).toEqual(["lpc", "cpc"]);
  });

  it("reads the year from election ids", () => {
    expect(electionYear("1974oct")).toBe(1974);
    expect(electionYear("2024")).toBe(2024);
    expect(electionYear("custom")).toBeNull();
  });
});
