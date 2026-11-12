import { describe, expect, it } from "vitest";
import { COUNTRY_MODULES, COUNTRIES } from "@content/countries/all";

// A country module's blurb, pack description and system label describe every
// election in the module. When an election is added, any count, year range or
// chamber size they state has to move with it; this test catches the ones
// that did not.

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
function numberWord(word: string): number | undefined {
  const w = word.toLowerCase();
  const i = NUMBER_WORDS.indexOf(w);
  if (i >= 0) return i;
  const m = /^twenty-(\w+)$/.exec(w);
  if (m) {
    const j = NUMBER_WORDS.indexOf(m[1]!);
    if (j > 0 && j < 10) return 20 + j;
  }
  if (/^\d+$/.test(w)) return Number(w);
  return undefined;
}

describe.each(COUNTRY_MODULES.map((m) => [m.code, m] as const))("%s module copy", (_code, m) => {
  const years = m.scenarios.map((r) => r.year);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const texts = { blurb: m.blurb, "pack description": m.pack.description, systemLabel: m.systemLabel };

  it("states the real number of elections", () => {
    for (const [where, text] of Object.entries(texts)) {
      for (const match of text.matchAll(/\b([\w-]+)((?:\s+[\w'-]+){0,3}?)\s+(elections|races|runoffs)\b/gi)) {
        const n = numberWord(match[1]!);
        if (n === undefined) continue;
        expect(n, `${where}: "${match[0]}"`).toBe(m.scenarios.length);
      }
    }
  });

  it("states the real range of years", () => {
    for (const [where, text] of Object.entries(texts)) {
      for (const match of text.matchAll(/\bfrom (\d{4}) to (\d{4})\b/g)) {
        expect([Number(match[1]), Number(match[2])], `${where}: "${match[0]}"`).toEqual([first, last]);
      }
    }
  });

  it("states the real chamber sizes", () => {
    const bundle = COUNTRIES[m.code];
    if (!bundle) return;
    const totals = Object.values(bundle.elections).map((e) => (e.majority ?? bundle.system.majority).total);
    const lo = Math.min(...totals);
    const hi = Math.max(...totals);
    for (const [where, text] of Object.entries(texts)) {
      for (const match of text.matchAll(/\b(\d{2,4})(?: to (\d{2,4}))? (seats|ridings|constituencies)\b/g)) {
        const stated = match[2] ? [Number(match[1]), Number(match[2])] : [Number(match[1]), Number(match[1])];
        expect(stated, `${where}: "${match[0]}"`).toEqual([lo, hi]);
      }
    }
  });
});
