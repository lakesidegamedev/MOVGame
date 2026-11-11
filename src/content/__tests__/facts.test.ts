import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COUNTRY_MODULES } from "@content/countries";
import { SCENARIO_REGISTRY } from "@content/scenarioRegistry";
import {
  COUNTRY_COUNT, ELECTION_COUNT, VOTING_SYSTEM_COUNT, countWord, joinList, votingSystemKey,
} from "@content/facts";

describe("player-facing facts", () => {
  it("counts countries and elections from the registry", () => {
    expect(COUNTRY_COUNT).toBe(COUNTRY_MODULES.length);
    expect(ELECTION_COUNT).toBe(SCENARIO_REGISTRY.length);
  });

  it("counts shared voting systems once", () => {
    expect(votingSystemKey("First past the post, 343 ridings")).toBe(votingSystemKey("First past the post"));
    expect(votingSystemKey("Parallel voting (districts and lists)")).toBe("parallel voting");
    expect(VOTING_SYSTEM_COUNT).toBeLessThan(COUNTRY_COUNT);
    expect(VOTING_SYSTEM_COUNT).toBeGreaterThan(1);
  });

  it("formats lists and small numbers", () => {
    expect(joinList(["a"])).toBe("a");
    expect(joinList(["a", "b"])).toBe("a and b");
    expect(joinList(["a", "b", "c"])).toBe("a, b, and c");
    expect(countWord(2, true)).toBe("Two");
    expect(countWord(76)).toBe("76");
  });

  it("keeps hard-coded counts out of index.html", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/\b\d+ (election )?scenarios\b/);
    expect(html).toContain("__MOV_ELECTION_COUNT__");
    expect(html).not.toMatch(/\b\d+ countries\b/);
  });
});
