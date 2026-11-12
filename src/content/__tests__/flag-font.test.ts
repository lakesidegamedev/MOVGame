import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COUNTRY_MODULES } from "../countries";

// Windows draws no colour flag emoji, so the game ships a flag font that holds only the flags in use.
// The font cannot be read in a unit test, so mov-flags.txt records what it was built from.
// A new country needs its flag added there and the font rebuilt (scripts/subset-flag-font.py).
const built = new Set(readFileSync(new URL("../../ui/fonts/mov-flags.txt", import.meta.url), "utf8").trim().split(/\s+/));

describe("flag font", () => {
  it("every country flag is a regional indicator pair inside the font's unicode-range", () => {
    for (const m of COUNTRY_MODULES) {
      const points = [...m.flag].map((c) => c.codePointAt(0)!);
      expect(points, m.code).toHaveLength(2);
      for (const p of points) expect(p >= 0x1f1e6 && p <= 0x1f1ff, m.code).toBe(true);
    }
  });

  it("the font was built with every country flag", () => {
    const missing = COUNTRY_MODULES.filter((m) => !built.has(m.flag)).map((m) => `${m.code} ${m.flag}`);
    expect(missing).toEqual([]);
  });
});
