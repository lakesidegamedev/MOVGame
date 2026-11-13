// IRELAND: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./ireland.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const IRELAND_MODULE: CountryModule = {
  code: "IE",
  name: "Ireland",
  flag: "🇮🇪",
  engine: "country",
  load: () => import("./ireland.bundle").then((m) => m.IRELAND),
  blurb: "Single transferable vote: Fianna Fáil, Fine Gael, Sinn Féin and an army of independents.",
  cover: "images/covers/country-ie.jpg",
  art: { a: "#0b3d2e", b: "#c8782a", glow: "rgba(236,240,245,0.2)" },
  freeElections: ["2024"],
  scenarios: [
    { electionId: "2024", year: 2024, label: "2024 · Harris v. Martin v. McDonald", difficulty: "hard",
      description: "A new Taoiseach, a giveaway budget and a housing crisis that will not go away. The old rivals need partners, and Sinn Féin needs the transfers." },
    { electionId: "2020", year: 2020, label: "2020 · Varadkar v. Martin v. McDonald", difficulty: "easy",
      description: "Sinn Féin tops the poll with too few candidates. A three-way split leaves nobody near 81 seats without crossing a line." },
    { electionId: "2016", year: 2016, label: "2016 · Kenny v. Martin", difficulty: "easy",
      description: "The recovery election nobody felt. Fine Gael and Labour lose a combined 56 seats and independents multiply." },
    { electionId: "2011", year: 2011, label: "2011 · Kenny v. Gilmore v. Martin", difficulty: "hard",
      description: "The Troika election. Fianna Fáil falls from 78 seats to 20 and Fine Gael and Labour take 113 between them." },
  ],
  systemLabel: "Single transferable vote",
  pack: {
    id: "ireland",
    name: "Ireland",
    description: "Four Dáil elections from 2011 to 2024 under the single transferable vote: the Troika landslide, the water charge election, Sinn Féin's surge and the coalition that followed.",
  },
  daily: { pair: ["ff", "fg"], names: { ff: "Fianna Fáil", fg: "Fine Gael" } },
  next: {
    chain: [
      { id: "2011", blurb: "Continue the timeline: the Troika election" },
      { id: "2016", blurb: "Continue the timeline: the recovery election" },
      { id: "2020", blurb: "Continue the timeline: the three-way split" },
      { id: "2024", blurb: "Continue the timeline: the giveaway budget" },
    ],
  },
  guide: {
    title: "Ireland",
    body: "Single transferable vote in constituencies of three to five seats. The game has no STV count, so each of the ten regions wins seats in line with its first-preference vote, with transfers already folded into the regional seat table, the same shortcut Australia uses for preferences. Independents win a large block of seats and cannot be led. Fianna Fáil and Fine Gael can govern together, but neither will take Sinn Féin, and the Social Democrats, PBP-Solidarity and Aontú will not join either of them.",
  },
};
