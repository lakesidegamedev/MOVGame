// Every person the game shows by name as a leader, candidate or running mate,
// across the United States, the United Kingdom and every country module.
// Used by fetch-portraits.ts to know whose portrait to look for.

import { SCENARIOS } from "../../src/content/scenarios";
import { UK_LEADERS } from "../../src/content/uk/leaders";
import { UK_ELECTIONS } from "../../src/content/uk/elections";
import { loadAllCountries } from "../../src/content/countries/index";

export interface LeaderRef {
  name: string;
  /** "US", "UK" or a country module code. */
  country: string;
  /** Election years this person appears in. */
  years: number[];
  /** Party ids, as the content names them. */
  parties: string[];
  role: "candidate" | "running-mate" | "leader";
}

/** Joint leaderships ("A & B") have no single photo; they keep initials. */
export function isJointName(name: string): boolean {
  return /\s(&|and)\s/.test(name) || name.endsWith(" leader");
}

export async function allLeaders(): Promise<LeaderRef[]> {
  const byKey = new Map<string, LeaderRef>();
  const add = (name: string, country: string, year: number, party: string, role: LeaderRef["role"]) => {
    if (!name || isJointName(name)) return;
    const key = `${country}|${name}`;
    const ref = byKey.get(key) ?? { name, country, years: [], parties: [], role };
    if (!ref.years.includes(year)) ref.years.push(year);
    if (!ref.parties.includes(party)) ref.parties.push(party);
    if (role !== "running-mate") ref.role = role;
    byKey.set(key, ref);
  };
  for (const scenario of Object.values(SCENARIOS)) {
    for (const side of ["dem", "rep"] as const) {
      const ticket = scenario[side];
      add(ticket.name, "US", scenario.year, ticket.party, "candidate");
      for (const mate of ticket.runningMates) add(mate.name, "US", scenario.year, ticket.party, "running-mate");
    }
  }
  for (const [electionId, leaders] of Object.entries(UK_LEADERS)) {
    const year = UK_ELECTIONS[electionId]?.year ?? Number.parseInt(electionId, 10);
    for (const [party, leader] of Object.entries(leaders)) if (leader) add(leader.name, "UK", year, party, "leader");
  }
  for (const bundle of await loadAllCountries()) {
    for (const [electionId, leaders] of Object.entries(bundle.leaders)) {
      const year = bundle.elections[electionId]?.year ?? Number.parseInt(electionId, 10);
      for (const [party, leader] of Object.entries(leaders)) if (leader) add(leader.name, bundle.id, year, party, "leader");
    }
  }
  return [...byKey.values()].map((ref) => ({ ...ref, years: ref.years.sort((a, b) => a - b) }));
}
