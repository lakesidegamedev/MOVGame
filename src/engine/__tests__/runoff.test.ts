import { describe, it, expect } from "vitest";
import { advanceToRunoff, topTwo, regionalRunoff } from "../runoff";
import { FR_FIRST_ROUND, FR_TRANSFERS } from "@content/countries/france.runoff";
import { COUNTRIES } from "@content/countries/all";
import { playablePartiesIn } from "../countryGame";

const FRANCE = COUNTRIES.FR;

describe("two-round runoff", () => {
  it("picks the top two from a crowded first round", () => {
    const [a, b] = topTwo({ ens: 0.28, rn: 0.23, lfi: 0.22, lr: 0.15, other: 0.12 });
    expect(a).toBe("ens");
    expect(b).toBe("rn");
  });

  it("transfers eliminated voters to finalists (front républicain)", () => {
    const first = { ens: 0.24, rn: 0.21, lfi: 0.20, lr: 0.20, other: 0.15 };
    const transfers = {
      lfi: { ens: 0.55, rn: 0.10, _abstain: 0.35 },
      lr: { ens: 0.70, rn: 0.20, _abstain: 0.10 },
      other: { ens: 0.50, rn: 0.25, _abstain: 0.25 },
    };
    const r = advanceToRunoff(first, transfers);
    expect(r.finalists).toEqual(["ens", "rn"]);
    expect(r.secondRound.ens).toBeGreaterThan(0.55);
    expect(r.secondRound.ens + r.secondRound.rn).toBeCloseTo(1, 6);
    expect(r.abstentionRate).toBeGreaterThan(0.05);
  });

  it("a weak front républicain narrows the runoff", () => {
    const first = { ens: 0.28, rn: 0.27, lfi: 0.22, lr: 0.12, other: 0.11 };
    const soft = {
      lfi: { ens: 0.25, rn: 0.35, _abstain: 0.40 },
      lr: { ens: 0.40, rn: 0.45, _abstain: 0.15 },
      other: { ens: 0.35, rn: 0.40, _abstain: 0.25 },
    };
    const hard = {
      lfi: { ens: 0.70, rn: 0.05, _abstain: 0.25 },
      lr: { ens: 0.75, rn: 0.15, _abstain: 0.10 },
      other: { ens: 0.60, rn: 0.20, _abstain: 0.20 },
    };
    const softR = advanceToRunoff(first, soft);
    const hardR = advanceToRunoff(first, hard);
    expect(hardR.secondRound.ens).toBeGreaterThan(softR.secondRound.ens);
  });

  it("regionalRunoff applies the same finalists everywhere", () => {
    const regions = {
      IDF: { ens: 0.35, rn: 0.15, lfi: 0.25, lr: 0.15, other: 0.10 },
      HDF: { ens: 0.18, rn: 0.35, lfi: 0.20, lr: 0.15, other: 0.12 },
    };
    const transfers = {
      lfi: { ens: 0.6, rn: 0.1, _abstain: 0.3 },
      lr: { ens: 0.65, rn: 0.25, _abstain: 0.1 },
      other: { ens: 0.5, rn: 0.3, _abstain: 0.2 },
    };
    const { finalists, regions: round2 } = regionalRunoff(regions, transfers);
    expect(finalists).toEqual(["ens", "rn"]);
    expect(round2.IDF.ens).toBeGreaterThan(round2.HDF.ens);
    expect(Object.keys(round2.IDF).sort()).toEqual(["ens", "rn"]);
  });

  it("France transfer matrices put the centre ahead in every authored runoff", () => {
    const finalists: Record<string, [string, string]> = { "2017": ["em", "fn"], "2022": ["ens", "rn"], "2027": ["ens", "rn"] };
    for (const year of ["2017", "2022", "2027"] as const) {
      const [centre, rival] = finalists[year];
      const r = advanceToRunoff(FR_FIRST_ROUND[year], FR_TRANSFERS[year]);
      expect(r.finalists).toEqual([centre, rival]);
      expect(r.secondRound[centre], `${year} centre share`).toBeGreaterThan(0.5);
      // 2017 was a landslide; 2022/2027 are closer, both still centre-favoured.
      if (year === "2017") expect(r.secondRound[centre]).toBeGreaterThan(0.58);
    }
  });

  it("the older France matrices reproduce the real runoff results", () => {
    // Each row: year, the finalist whose share is checked, the other finalist,
    // that share in the real runoff, tolerance. 2002 is looser: the model cannot
    // add the new voters who turned out between rounds, so it sits a couple of
    // points under the 82.2 percent.
    const real: Array<[string, string, string, number, number]> = [
      ["2012", "ps", "ump", 0.5164, 0.01],
      ["2007", "ps", "ump", 0.4694, 0.01],
      ["2002", "rpr", "fn", 0.8221, 0.025],
      ["1995", "ps", "rpr", 0.4736, 0.01],
      ["1988", "ps", "rpr", 0.5402, 0.01],
      ["1981", "ps", "udf", 0.5176, 0.01],
    ];
    for (const [year, party, other, share, tolerance] of real) {
      const r = advanceToRunoff(FR_FIRST_ROUND[year], FR_TRANSFERS[year]);
      expect([...r.finalists].sort(), `${year} finalists`).toEqual([party, other].sort());
      expect(Math.abs(r.secondRound[party] - share), `${year} runoff share`).toBeLessThan(tolerance);
      expect(r.secondRound[party] > 0.5, `${year} winner`).toBe(share > 0.5);
    }
  });

  it("France's finalists in the runoff tables are the parties each election plays", () => {
    for (const [year, shares] of Object.entries(FR_FIRST_ROUND)) {
      const playable = playablePartiesIn(FRANCE, year);
      expect(playable, year).toHaveLength(2);
      for (const p of playable) expect(shares[p], `${year} first round ${p}`).toBeGreaterThan(0);
      expect(topTwo(shares).sort(), `${year} top two`).toEqual([...playable].sort());
      for (const row of Object.values(FR_TRANSFERS[year])) {
        for (const p of Object.keys(row)) if (p !== "_abstain") expect(playable, `${year} transfer to ${p}`).toContain(p);
      }
    }
  });
});
