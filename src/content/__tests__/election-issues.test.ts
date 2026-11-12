import { describe, expect, it } from "vitest";
import { SCENARIOS, SCENARIO_IDS } from "@content/scenarios";
import { HISTORICAL_EVENTS } from "@content/events";
import { ISSUE_IDS } from "@content/issues";
import { UK_ELECTIONS } from "@content/uk/elections";
import { COUNTRY_MODULES, COUNTRIES } from "@content/countries/all";

// Every election in the game declares the issues it ran on. This guards the
// list against anachronism: a term may not appear in an election held before
// it existed (COVID in 1932, Brexit in 2010, a Ukraine war before 2014).
const FIRST_YEAR: [RegExp, number][] = [
  [/covid|coronavirus|lockdown/i, 2020],
  [/brexit/i, 2016],
  [/\bdobbs\b/i, 2022],
  [/\bisis\b|islamic state/i, 2014],
  [/ukraine/i, 2014],
  [/\bnet zero\b/i, 2015],
  [/social media|twitter|facebook|whatsapp/i, 2006],
  [/smartphone/i, 2007],
  [/obamacare|affordable care act/i, 2010],
  [/\btrump\b/i, 2015],
  [/9\/11|al-qaeda|al qaeda/i, 2001],
  [/\beuro\b|single currency/i, 1989],
  [/european union|\bEU\b/, 1993],
  [/\bnafta\b/i, 1991],
  [/internet|online/i, 1995],
  [/climate change|global warming|greenhouse/i, 1988],
  [/\bAI\b|artificial intelligence/, 2015],
  [/bitcoin|crypto/i, 2013],
  [/\bGST\b/, 1989],
  [/cold war|nuclear|h-bomb|atom/i, 1945],
];

const DASHES = /[–—]/;

interface Row {
  label: string;
  year: number;
  issues: { id: string; name: string; blurb: string }[] | undefined;
  salience?: Record<string, number>;
}

const rows: Row[] = [
  ...SCENARIO_IDS.map((id) => ({ label: `US ${id}`, year: SCENARIOS[id].year, issues: SCENARIOS[id].issues })),
  ...Object.values(UK_ELECTIONS).map((e) => ({ label: `UK ${e.id}`, year: e.year, issues: e.issues, salience: e.salience })),
  ...COUNTRY_MODULES.flatMap((m) =>
    Object.values(COUNTRIES[m.code]?.elections ?? {}).map((e) => ({ label: `${m.code} ${e.id}`, year: e.year, issues: e.issues, salience: e.salience })),
  ),
];

describe("per-election issues", () => {
  it("covers every election in the game", () => {
    expect(rows.length).toBeGreaterThanOrEqual(121);
  });

  for (const row of rows) {
    describe(row.label, () => {
      it("declares its own issues, each with salience", () => {
        expect(row.issues, "no issue list").toBeDefined();
        const issues = row.issues!;
        expect(issues.length).toBeGreaterThanOrEqual(5);
        expect(issues.length).toBeLessThanOrEqual(10);
        expect(new Set(issues.map((i) => i.id)).size, "ids unique").toBe(issues.length);
        for (const i of issues) {
          expect(i.id, "id format").toMatch(/^[a-z][a-z0-9_]*$/);
          if (row.salience) expect(row.salience[i.id], `${i.id} has no salience`).toBeTypeOf("number");
        }
      });

      it("names and blurbs are short, plain and of their time", () => {
        for (const i of row.issues ?? []) {
          expect(i.name.length, `${i.id} name length`).toBeLessThanOrEqual(32);
          expect(i.blurb.length, `${i.id} blurb length`).toBeLessThanOrEqual(130);
          expect(i.blurb.length, `${i.id} blurb`).toBeGreaterThan(10);
          expect(DASHES.test(i.name + i.blurb), `${i.id} dash`).toBe(false);
          for (const [pattern, first] of FIRST_YEAR) {
            const text = `${i.name} ${i.blurb}`;
            if (pattern.test(text)) expect(row.year, `${i.id} "${text.match(pattern)![0]}" before ${first}`).toBeGreaterThanOrEqual(first);
          }
        }
      });
    });
  }

  it("U.S. lists use only the model's issue axes", () => {
    for (const id of SCENARIO_IDS) {
      for (const issue of SCENARIOS[id].issues ?? []) expect(ISSUE_IDS, `${id} ${issue.id}`).toContain(issue.id);
    }
  });

  it("every issue a U.S. year's events move exists in that year", () => {
    for (const id of SCENARIO_IDS) {
      const live = new Set((SCENARIOS[id].issues ?? []).map((i) => i.id));
      for (const event of HISTORICAL_EVENTS[id] ?? []) {
        for (const choice of event.choices) {
          for (const issue of Object.keys(choice.effects.salienceDeltas ?? {})) {
            expect(live.has(issue as never), `${id} ${event.id} moves ${issue}`).toBe(true);
          }
        }
      }
    }
  });

  it("COVID is an issue only from 2020", () => {
    for (const row of rows) {
      const covid = (row.issues ?? []).some((i) => /covid/i.test(i.id + i.name));
      if (row.year < 2020) expect(covid, row.label).toBe(false);
    }
  });
});
