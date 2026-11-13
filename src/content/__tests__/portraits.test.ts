import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PORTRAITS, portraitFor } from "../portraits";
import { namedLeaders } from "../../ui/Avatar";

const PUBLIC_DIR = resolve(__dirname, "../../../public");
const credits = JSON.parse(readFileSync(resolve(PUBLIC_DIR, "images/portraits/credits.json"), "utf8")) as {
  name: string; file: string; source: string; title: string; author: string; license: string; licenseUrl?: string;
}[];
const sources = JSON.parse(readFileSync(resolve(__dirname, "../../../scripts/portraits/sources.json"), "utf8")) as {
  name: string; country: string; qid?: string; review?: string; skip?: string;
}[];

// Public domain, CC0, CC BY and CC BY-SA only.
const ALLOWED = /^(public domain|pd([- ].*)?|cc0( 1\.0)?|cc[- ]by(-sa)?[- ]\d\.\d( [a-z]{2,})?)$/i;

describe("leader portraits", () => {
  it("every portrait is a small local WebP with a credit", () => {
    const credited = new Map(credits.map((c) => [c.name, c]));
    for (const [name, file] of Object.entries(PORTRAITS)) {
      expect(file).toMatch(/^images\/portraits\/[a-z0-9-]+\.webp$/);
      const path = resolve(PUBLIC_DIR, file);
      expect(existsSync(path), file).toBe(true);
      expect(statSync(path).size, file).toBeLessThanOrEqual(40 * 1024);
      expect(credited.get(name)?.file, name).toBe(file);
    }
    expect(credits.length).toBe(Object.keys(PORTRAITS).length);
  });

  it("every credit names a Commons source, an author and an allowed licence", () => {
    for (const c of credits) {
      expect(c.source, c.name).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(c.author.length, c.name).toBeGreaterThan(0);
      expect(c.license, c.name).toMatch(ALLOWED);
      if (/^cc[- ]by/i.test(c.license)) expect(c.licenseUrl, c.name).toMatch(/^https?:\/\/creativecommons\.org\//);
    }
  });

  it("only checked matches are used", () => {
    const used = new Set(Object.keys(PORTRAITS));
    for (const s of sources) {
      if (s.review || s.skip || !s.qid) expect(used.has(s.name), s.name).toBe(false);
    }
  });

  it("anyone without a photo gets no path, so the avatar shows initials", () => {
    expect(portraitFor("Not A Real Politician")).toBeUndefined();
  });

  it("namedLeaders leaves out placeholder leaders", () => {
    expect(namedLeaders({ lab: { name: "Keir Starmer" }, oth: { name: "OTH leader" }, x: undefined })).toEqual({ lab: "Keir Starmer" });
  });
});
