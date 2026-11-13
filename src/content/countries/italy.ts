// ITALY: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./italy.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const ITALY_MODULE: CountryModule = {
  code: "IT",
  name: "Italy",
  flag: "🇮🇹",
  engine: "country",
  load: () => import("./italy.bundle").then((m) => m.ITALY),
  blurb: "Coalitions, a majority bonus, then a mixed system and a chamber cut to 400: four elections from 2008 to 2022.",
  cover: "images/covers/country-it.jpg",
  art: { a: "#0f3d2e", b: "#c8102e", glow: "rgba(236,240,245,0.2)" },
  freeElections: ["2022"],
  scenarios: [
    { electionId: "2022", year: 2022, label: "2022 · Meloni v. Letta", difficulty: "hard",
      description: "Draghi has fallen, the left is split three ways and Meloni leads a united right into a 400-seat chamber. Gas bills decide everything." },
    { electionId: "2018", year: 2018, label: "2018 · Salvini v. Di Maio v. Renzi", difficulty: "hard",
      description: "The first Rosatellum election. Five Star is the biggest party, the Lega overtakes Forza Italia, and nobody can make a majority." },
    { electionId: "2013", year: 2013, label: "2013 · Bersani v. Berlusconi v. Grillo", difficulty: "hard",
      description: "Monti's austerity, Berlusconi's comeback and Grillo's tsunami. The bonus gives the winner 340 seats, and the Senate is a trap." },
    { electionId: "2008", year: 2008, label: "2008 · Berlusconi v. Veltroni", difficulty: "hard",
      description: "Prodi has fallen. Veltroni goes it alone, Berlusconi merges his party with Fini's, and Naples is buried in rubbish." },
  ],
  systemLabel: "Coalition bonus, then mixed",
  pack: {
    id: "italy",
    name: "Italy",
    description: "Four elections to the Chamber of Deputies from 2008 to 2022: the Berlusconi comeback, the Monti and Grillo years, and the Rosatellum.",
  },
  daily: { pair: ["csx", "cdx"], names: { csx: "the Centre-left", cdx: "the Centre-right" } },
  next: {
    chain: [
      { id: "2008", blurb: "Continue the timeline: Veltroni and the Naples rubbish" },
      { id: "2013", blurb: "Continue the timeline: Monti, Grillo and the bonus" },
      { id: "2018", blurb: "Continue the timeline: the first Rosatellum" },
      { id: "2022", blurb: "Continue the timeline: after Draghi" },
    ],
  },
  guide: {
    title: "Italy",
    body: "Chamber of Deputies only. In 2008 and 2013 the winning coalition got a bonus that lifted it to 340 of 630 seats. In 2018 and 2022 about a third of seats go to single-member districts and the rest to proportional lists, and the chamber shrinks to 400 seats in 2022. Parties are the coalitions voters chose between, so Centre-right means Forza Italia or the People of Freedom, the Lega and Brothers of Italy together. Italians abroad are their own pool. Left and right blocs never govern together here, and a real government also needs the Senate, which is not modelled.",
  },
};
