// NEW ZEALAND: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./newZealand.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const NEW_ZEALAND_MODULE: CountryModule = {
  code: "NZ",
  name: "New Zealand",
  flag: "🇳🇿",
  engine: "country",
  load: () => import("./newZealand.bundle").then((m) => m.NEW_ZEALAND),
  blurb: "Mixed-member proportional: six parties, coalition deals and the Māori electorates.",
  cover: "images/covers/country-nz.jpg",
  art: { a: "#0b1f3a", b: "#1d6b5c", glow: "rgba(236,240,245,0.2)" },
  freeElections: ["2023"],
  scenarios: [
    { electionId: "2023", year: 2023, label: "2023 · Luxon v. Hipkins", difficulty: "hard",
      description: "Ardern has gone, the cost of living has not. Six parties in the House, an overhang, and Winston Peters back as kingmaker." },
    { electionId: "2020", year: 2020, label: "2020 · Ardern v. Collins", difficulty: "hard",
      description: "The COVID election. An outbreak delays the vote, National churns through leaders, and Labour wins the first majority under MMP." },
    { electionId: "2017", year: 2017, label: "2017 · Ardern v. English", difficulty: "hard",
      description: "Jacindamania meets nine years of National. A seven-week sprint, a fiscal hole row, and NZ First picking the winner." },
    { electionId: "2014", year: 2014, label: "2014 · Key v. Cunliffe", difficulty: "hard", addedLater: true,
      description: "John Key seeks a third term after a book of leaked emails, a minister's resignation and Kim Dotcom's Internet Mana. Labour's Cunliffe wants a capital gains tax and free doctor visits." },
    { electionId: "2011", year: 2011, label: "2011 · Key v. Goff", difficulty: "hard", addedLater: true,
      description: "After the Christchurch earthquakes and a World Cup at home, Key is popular and National wants to sell state power assets. Goff and the Greens want to stop it, and the voting system is on the ballot too." },
    { electionId: "2008", year: 2008, label: "2008 · Key v. Clark", difficulty: "hard", addedLater: true,
      description: "Helen Clark seeks a fourth term as recession hits and the banks wobble. John Key promises change and tax cuts, and Winston Peters fights a donations scandal to stay in Parliament." },
  ],
  systemLabel: "Mixed-member proportional",
  pack: {
    id: "new-zealand",
    name: "New Zealand",
    description: "Six MMP elections from 2008 to 2023: the end of the Clark years, John Key's three wins, Jacindamania, the COVID landslide, and the six-party Parliament that followed.",
  },
  daily: { pair: ["lab", "nat"], names: { lab: "Labour", nat: "National" } },
  next: {
    chain: [
      { id: "2008", blurb: "Continue the timeline: the end of the Clark years" },
      { id: "2011", blurb: "Continue the timeline: the earthquake election" },
      { id: "2014", blurb: "Continue the timeline: Dirty Politics and a third term" },
      { id: "2017", blurb: "Continue the timeline: Jacindamania" },
      { id: "2020", blurb: "Continue the timeline: the COVID election" },
      { id: "2023", blurb: "Continue the timeline: after Ardern" },
    ],
  },
  guide: {
    title: "New Zealand",
    body: "Mixed-member proportional. Seats follow each region's party vote, so a vote gained anywhere counts. The seven Māori electorates form their own pool. Labour and National never govern together; ACT and the Greens pick sides, and NZ First can go either way.",
  },
};
