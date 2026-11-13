// JAPAN: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./japan.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const JAPAN_MODULE: CountryModule = {
  code: "JP",
  name: "Japan",
  flag: "🇯🇵",
  engine: "country",
  load: () => import("./japan.bundle").then((m) => m.JAPAN),
  blurb: "Parallel voting: districts plus regional lists, from the 2009 change of government to Takaichi's 2026 landslide.",
  cover: "images/covers/country-jp.jpg",
  art: { a: "#14213d", b: "#b3202a", glow: "rgba(255,240,235,0.22)" },
  freeElections: ["2024"],
  scenarios: [
    { electionId: "2026", year: 2026, label: "2026 · Takaichi v. Noda", difficulty: "hard", dailyPair: ["ldp", "cra"],
      description: "Takaichi dissolves the House three months into the job, with Ishin as her partner. The Constitutional Democrats and Komeito have merged into the Centrist Reform Alliance, and Team Mirai and Sanseito chase the young vote." },
    { electionId: "2024", year: 2024, label: "2024 · Ishiba v. Noda", difficulty: "easy",
      description: "Ishiba calls a quick election with the government weakened by the slush fund scandal. The opposition is split several ways, and the coalition's majority is in play." },
    { electionId: "2021", year: 2021, label: "2021 · Kishida v. Edano", difficulty: "hard",
      description: "Kishida replaces Suga and dissolves within ten days. The opposition parties stand aside for each other in district after district, and Osaka's Ishin looks for a breakout." },
    { electionId: "2017", year: 2017, label: "2017 · Abe v. Koike", difficulty: "hard",
      description: "Abe goes early and Koike's new Party of Hope splits the Democrats overnight. Edano's new party picks up the pieces, and the big prize is a two-thirds majority." },
    { electionId: "2014", year: 2014, label: "2014 · Abe v. Kaieda", difficulty: "hard",
      description: "The Abenomics election. A recession, a postponed tax rise and a weak opposition, and the Communists more than double their seats." },
    { electionId: "2012", year: 2012, label: "2012 · Abe v. Noda", difficulty: "hard",
      description: "The Democrats' three years end. Abe returns, Hashimoto and Ishihara build a third pole, and a split vote hands the LDP a landslide." },
    { electionId: "2009", year: 2009, label: "2009 · Hatoyama v. Aso", difficulty: "hard",
      description: "The change of government. The Democrats take on 54 years of LDP rule with Hatoyama's child allowance and Aso's collapsing caucus." },
    { electionId: "2005", year: 2005, label: "2005 · Koizumi v. Okada", difficulty: "hard", addedLater: true,
      description: "Koizumi dissolves the House after the Councillors kill his postal bills, and makes the election a referendum. Thirty-seven LDP rebels are shut out and the Democrats say they would reform better." },
  ],
  systemLabel: "Parallel voting (districts and lists)",
  pack: {
    id: "japan",
    name: "Japan",
    description: "Eight House of Representatives elections from 2005 to 2026: the Koizumi postal landslide, the Democratic landslide, Abe's return, the Hope split, the slush fund election that cost the coalition its majority, and Takaichi's two-thirds landslide.",
  },
  // 2026 pairs the LDP with the CRA, which replaced the CDP (row dailyPair).
  daily: { pair: ["ldp", "dpj"], names: { ldp: "the LDP", dpj: "the DPJ/CDP", cra: "the CRA" } },
  next: {
    chain: [
      { id: "2005", blurb: "Continue the timeline: the postal privatisation election" },
      { id: "2009", blurb: "Continue the timeline: the change of government" },
      { id: "2012", blurb: "Continue the timeline: Abe returns" },
      { id: "2014", blurb: "Continue the timeline: the Abenomics election" },
      { id: "2017", blurb: "Continue the timeline: the Hope split" },
      { id: "2021", blurb: "Continue the timeline: Kishida's first test" },
      { id: "2024", blurb: "Continue the timeline: the slush fund election" },
      { id: "2026", blurb: "Continue the timeline: Takaichi's snap election" },
    ],
  },
  guide: {
    title: "Japan",
    body: "Parallel voting. About 290 seats come from single-member districts and 176 from party lists in eleven regional blocks, and the two tiers do not offset each other. Each block is one region here, and its seats combine its districts and its list seats, so the party that wins a block takes most of them and a swing moves more seats than a pure list system would. The LDP and Komeito govern together by habit until 2025; in 2026 the LDP governs with Ishin, and Komeito stands inside the Centrist Reform Alliance with the Constitutional Democrats. The LDP never partners the Democrats or the CRA, and the Communists only ever work with the left of the opposition. Chamber size changes: 480 seats in 2009 and 2012, 475 in 2014, 465 since.",
  },
};
