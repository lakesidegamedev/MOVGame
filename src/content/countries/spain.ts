// SPAIN: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./spain.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const SPAIN_MODULE: CountryModule = {
  code: "ES",
  name: "Spain",
  flag: "🇪🇸",
  engine: "country",
  load: () => import("./spain.bundle").then((m) => m.SPAIN),
  blurb: "Proportional by province: five national parties, Catalan and Basque kingmakers and an investiture vote to win.",
  cover: "images/covers/country-es.jpg",
  art: { a: "#5a0f1c", b: "#c8860a", glow: "rgba(255,226,140,0.22)" },
  freeElections: ["2023"],
  scenarios: [
    { electionId: "2023", year: 2023, label: "2023 · Feijóo v. Sánchez", difficulty: "medium",
      description: "Sánchez calls a July vote after losing the May local elections. Feijóo needs Vox to reach 176, and Junts and the Basque parties hold the keys to any investiture." },
    { electionId: "2019", year: 2019, label: "2019 · Sánchez v. Casado", difficulty: "hard",
      description: "The Catalan parties sink Sánchez's budget and he calls an April vote. The right splits three ways between the PP, Citizens and a rising Vox." },
    { electionId: "2015", year: 2015, label: "2015 · Rajoy v. Sánchez", difficulty: "easy",
      description: "Four parties in one race for the first time. Rajoy defends a recovery and a corruption record against Sánchez, Podemos and Citizens." },
    { electionId: "2011", year: 2011, label: "2011 · Rajoy v. Rubalcaba", difficulty: "hard",
      description: "The crash election. Zapatero steps aside, unemployment is above 21%, and Rajoy needs only to avoid mistakes. The question is how large his majority will be." },
  ],
  systemLabel: "Proportional by province",
  regionalParties: ["ERC", "CiU/Junts", "PNV", "Bildu"],
  pack: {
    id: "spain",
    name: "Spain",
    description: "Four Congress of Deputies elections from 2011 to 2023: the crash, the end of two-party politics, the Vox breakthrough and the 2023 deadlock.",
  },
  daily: { pair: ["pp", "psoe"], names: { pp: "the PP", psoe: "the PSOE" } },
  next: {
    chain: [
      { id: "2011", blurb: "Continue the timeline: the crash election" },
      { id: "2015", blurb: "Continue the timeline: the end of two-party Spain" },
      { id: "2019", blurb: "Continue the timeline: Vox arrives" },
      { id: "2023", blurb: "Continue the timeline: the summer deadlock" },
    ],
  },
  guide: {
    title: "Spain",
    body: "350 seats are won province by province with closed party lists, grouped here into 14 regions. Small provinces mean a party needs a strong local base: the regional parties win seats on a few percent of the national vote, while small national parties win few. A government needs 176 votes in the first investiture ballot, or more yes than no in the second. The game scores the largest party and at most one partner, so real Spanish deals built from several parties and abstentions are reduced to that arithmetic. PP and PSOE never govern together, nobody but the PP deals with Vox, and the Catalan and Basque parties can be played as regional parties: they stand in one or two regions, cannot win a majority, and win by beating their real seat count and becoming the votes a government needs. The Galician and Canarian parties shape close results from the sidelines.",
  },
};
