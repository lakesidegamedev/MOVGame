import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PORTRAITS } from "../portraits";
import { PARTY_LOGOS } from "../partyLogos";

// The apps carry their own copies of the leader photos and party logos
// (npm run native:content, then apps/native/scripts/export-art.py).
const BUNDLES = resolve(__dirname, "../../../apps/native/shared/src/commonMain/resources/bundles");
const ART_DIR = resolve(BUNDLES, "art");
const art = JSON.parse(readFileSync(resolve(BUNDLES, "art.json"), "utf8")) as {
  portraits: Record<string, string>;
  logos: { file: string }[];
};

describe("native art", () => {
  it("every photo and logo the apps can show is in the app bundle, small", () => {
    const named = new Set([...Object.values(art.portraits), ...art.logos.map((r) => r.file)]);
    for (const file of named) {
      const path = resolve(ART_DIR, file);
      expect(existsSync(path), `${file}: run apps/native/scripts/export-art.py`).toBe(true);
      expect(statSync(path).size, file).toBeLessThanOrEqual(15_000);
    }
    // Nothing left over from a removed photo or logo.
    for (const file of readdirSync(ART_DIR)) expect(named.has(file), `stray ${file}`).toBe(true);
  });

  it("covers the same leaders and logos as the web", () => {
    expect(Object.keys(art.portraits).sort()).toEqual(Object.keys(PORTRAITS).sort());
    expect(art.logos.length).toBe(PARTY_LOGOS.length);
  });

  it("keeps the added size per app sensible", () => {
    const total = readdirSync(ART_DIR).reduce((sum, f) => sum + statSync(resolve(ART_DIR, f)).size, 0);
    expect(total).toBeLessThan(2_000_000);
  });
});
