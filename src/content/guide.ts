// The guide's "Voting systems" section, derived from the registered country
// modules so a new country lands in the right system and a new system cannot
// ship without an explanation (content test). Shared by the web guide and the
// native export. No vite-only imports.

import { COUNTRY_MODULES } from "./countries/index";
import { votingSystemKey, FREE_ELECTION_COUNT, FREE_COUNTRY_COUNT, COUNTRY_COUNT, joinList } from "./facts";

/** One or two sentences per voting system, keyed by `votingSystemKey(systemLabel)`. */
export const VOTING_SYSTEM_NOTES: Record<string, string> = {
  "electoral college":
    "Each state's electoral votes go to its winner; Maine and Nebraska split theirs by district. A majority wins: 270 of 538 since 1964, 269 of 537 in 1960, and 266 of 531 from 1932 to 1956, before Alaska, Hawaii and DC voted.",
  "first past the post":
    "Each constituency elects the candidate with the most votes. Regions win seats along a curve that rewards the leader, so a majority can come from well under half the vote. Short of a majority, the largest party looks for partners.",
  "mixed-member proportional":
    "Seats follow the party vote, so a vote gained anywhere counts, and a 5% threshold keeps out small parties that win no districts. Governments are coalitions agreed after the count.",
  "two-round presidential runoff":
    "You play the runoff between the top two, with the first round already counted and the losers' voters part of the opening map. Win 51 of 100 presidency points.",
  "single-round presidential plurality":
    "One round and no threshold: the candidate with the most votes is president. Your margin is your lead over the strongest rival.",
  "preferential voting":
    "Voters rank the candidates and preferences flow until one has a majority in each seat. The game folds preferences into each region's seat curve.",
  "proportional by province":
    "Seats are won province by province from closed lists, so small provinces reward a strong local base. A government needs the investiture vote: 176 of 350 on the first ballot.",
  "single transferable vote":
    "Voters rank candidates in constituencies of three to five seats. The game has no transfer count: each region wins seats in line with its first preferences, with transfers folded in.",
  "parallel voting":
    "Single-member districts and regional party lists are counted separately and do not offset each other, so the party that sweeps the districts keeps its lead.",
  "coalition bonus":
    "In 2008 and 2013 the winning coalition got a bonus that lifted it to 340 of 630 seats. From 2018 about a third of seats come from districts and the rest from lists, and in 2022 the chamber shrinks to 400.",
};

export interface VotingSystemEntry {
  key: string;
  /** The system's name as the first country using it labels it. */
  name: string;
  countries: { code: string; name: string; flag: string }[];
  note: string;
}

/** Every voting system in the game, once, in country registration order. */
export function votingSystemsGuide(): VotingSystemEntry[] {
  const out: VotingSystemEntry[] = [];
  for (const m of COUNTRY_MODULES) {
    const key = votingSystemKey(m.systemLabel);
    let entry = out.find((e) => e.key === key);
    if (!entry) {
      entry = { key, name: m.systemLabel.split(/[,(]/)[0]!.trim(), countries: [], note: VOTING_SYSTEM_NOTES[key] ?? "" };
      out.push(entry);
    }
    entry.countries.push({ code: m.code, name: m.name, flag: m.flag });
  }
  return out;
}

/** Playable regional parties by country, by short name ("BQ"), for the guide. */
export function regionalPartiesGuide(): { code: string; name: string; flag: string; parties: string[] }[] {
  return COUNTRY_MODULES.flatMap((m) =>
    m.regionalParties?.length ? [{ code: m.code, name: m.name, flag: m.flag, parties: [...m.regionalParties] }] : []);
}

export const REGIONAL_PARTIES_NOTE =
  "Some parties stand in only part of a country. They cannot win a majority, so the setup shows where they stand, and success is beating their real seat count and holding the balance of power. Generic campaign events leave them alone.";

export const FREE_ELECTIONS_NOTE =
  `${FREE_ELECTION_COUNT} elections${FREE_COUNTRY_COUNT === COUNTRY_COUNT ? ", at least one in every country," : ""} are free to everyone with no account, and so is the daily challenge. The rest of each country is in its pack, and the Complete Collection has them all.`;

/** "Canada: Bloc Québécois. India: Trinamool, ..." as one line per country. */
export function regionalPartiesLine(entry: { name: string; parties: string[] }): string {
  return `${entry.name}: ${joinList(entry.parties)}`;
}
