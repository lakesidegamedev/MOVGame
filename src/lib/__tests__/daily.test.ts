import { describe, it, expect } from "vitest";
import {
  CLASSIC_DAILY_POOL_SIZE,
  CLASSIC_DAILY_POOL_IDS,
  DAILY_ROLE_PAIRS,
  dailyAssignment,
  isAddedDailyDay,
  fnv1a,
  isDailyDate,
  roleShortName,
  utcDateString,
} from "../daily";
import { SCENARIOS_BY_ID, SCENARIO_REGISTRY } from "../../content/scenarioRegistry";
import { COUNTRIES } from "../../content/countries";
import { playablePartiesIn as countryPlayable } from "../../engine/countryGame";
import { playablePartiesIn as ukPlayable } from "../../engine/ukGame";

// 30 consecutive UTC dates starting at a fixed anchor.
function dates(n: number, from = "2026-07-08"): string[] {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

describe("dailyAssignment", () => {
  it("is deterministic — same date, same assignment, every call", () => {
    for (const d of dates(30)) {
      const a = dailyAssignment(d);
      const b = dailyAssignment(d);
      expect(b).toEqual(a);
      expect(a.date).toBe(d);
      expect(a.seed).toBe(`daily-${d}`);
    }
  });

  it("hash is the stable FNV-1a, not Math.random", () => {
    // Known-answer test: FNV-1a 32-bit of "" is the offset basis; "a" is fixed.
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("daily:2026-07-08")).toBe(fnv1a("daily:2026-07-08"));
  });

  it("always picks a registered scenario and a major-party role for it", () => {
    for (const d of dates(60)) {
      const a = dailyAssignment(d);
      const meta = SCENARIOS_BY_ID[a.scenarioId];
      expect(meta).toBeDefined();
      const pair = DAILY_ROLE_PAIRS[meta!.country];
      expect(pair).toContain(a.role);
    }
  });

  it("assigned roles are actually playable in their engine + election", () => {
    for (const d of dates(60)) {
      const a = dailyAssignment(d);
      const meta = SCENARIOS_BY_ID[a.scenarioId]!;
      if (meta.engine === "us") {
        expect(["dem", "rep"]).toContain(a.role);
      } else if (meta.engine === "uk") {
        expect(ukPlayable(meta.nativeId)).toContain(a.role);
      } else {
        const country = COUNTRIES[meta.country];
        expect(country).toBeDefined();
        expect(countryPlayable(country, meta.nativeId)).toContain(a.role);
      }
    }
  });

  it("rotation over 30 consecutive dates spreads across scenarios and countries", () => {
    const picks = dates(30).map((d) => dailyAssignment(d));
    const scenarios = new Set(picks.map((p) => p.scenarioId));
    const countries = new Set(picks.map((p) => SCENARIOS_BY_ID[p.scenarioId]!.country));
    // A stable hash over a 34-scenario pool should not collapse to a rut.
    expect(scenarios.size).toBeGreaterThanOrEqual(10);
    expect(countries.size).toBeGreaterThanOrEqual(3);
  });

  it("both sides of each pair come up over a long horizon", () => {
    const roles = new Set(dates(120).map((d) => dailyAssignment(d).role));
    expect(roles.size).toBeGreaterThanOrEqual(4);
  });

  it("every registry scenario belongs to a country with a role pair", () => {
    for (const s of SCENARIO_REGISTRY) {
      expect(DAILY_ROLE_PAIRS[s.country], `missing role pair for ${s.country}`).toBeDefined();
    }
  });
});

describe("date helpers", () => {
  it("utcDateString formats as YYYY-MM-DD in UTC", () => {
    expect(utcDateString(new Date("2026-07-08T23:59:59Z"))).toBe("2026-07-08");
    expect(utcDateString(new Date("2026-07-09T00:00:01Z"))).toBe("2026-07-09");
    expect(isDailyDate(utcDateString())).toBe(true);
  });

  it("isDailyDate accepts the shape and rejects junk", () => {
    expect(isDailyDate("2026-07-08")).toBe(true);
    expect(isDailyDate("2026-7-8")).toBe(false);
    expect(isDailyDate("today")).toBe(false);
    expect(isDailyDate("2026-07-08'; DROP TABLE daily_scores;--")).toBe(false);
  });
});

describe("roleShortName", () => {
  it("names every daily role, and falls back to uppercase", () => {
    for (const [a, b] of Object.values(DAILY_ROLE_PAIRS)) {
      expect(roleShortName(a)).not.toBe(a.toUpperCase());
      expect(roleShortName(b)).not.toBe(b.toUpperCase());
    }
    expect(roleShortName("xyz")).toBe("XYZ");
  });
});

describe("daily rotation as countries are added", () => {
  const legacy = (date: string) => CLASSIC_DAILY_POOL_IDS[fnv1a(`daily:${date}`) % CLASSIC_DAILY_POOL_SIZE];

  it("the classic pool is the frozen original 49, all still registered", () => {
    expect(CLASSIC_DAILY_POOL_IDS.length).toBe(CLASSIC_DAILY_POOL_SIZE);
    expect(CLASSIC_DAILY_POOL_IDS[CLASSIC_DAILY_POOL_SIZE - 1]).toBe("au-2019");
    for (const id of CLASSIC_DAILY_POOL_IDS) expect(SCENARIO_REGISTRY.some((s) => s.scenarioId === id), id).toBe(true);
  });

  it("every classic day keeps the scenario the pre-expansion rotation gave it", () => {
    const total = SCENARIO_REGISTRY.length;
    const added = total - CLASSIC_DAILY_POOL_SIZE;
    let classicDays = 0;
    for (const d of dates(730, "2025-07-01")) {
      if (isAddedDailyDay(d, total, added)) {
        expect(CLASSIC_DAILY_POOL_IDS.includes(dailyAssignment(d).scenarioId)).toBe(false);
        continue;
      }
      classicDays++;
      expect(dailyAssignment(d).scenarioId, d).toBe(legacy(d));
    }
    // Added scenarios take roughly their share of days, no more.
    const share = 1 - classicDays / 730;
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan((added / total) * 2 + 0.02);
  });

  it("registering more scenarios only converts classic days, never the reverse", () => {
    for (const d of dates(365, "2026-01-01")) {
      for (let added = 1; added < 60; added++) {
        if (isAddedDailyDay(d, CLASSIC_DAILY_POOL_SIZE + added, added)) {
          expect(isAddedDailyDay(d, CLASSIC_DAILY_POOL_SIZE + added + 1, added + 1), `${d} +${added}`).toBe(true);
        }
      }
    }
  });
});
