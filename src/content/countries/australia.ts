// AUSTRALIA: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./australia.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const AUSTRALIA_MODULE: CountryModule = {
  code: "AU",
  name: "Australia",
  flag: "🇦🇺",
  engine: "country",
  load: () => import("./australia.bundle").then((m) => m.AUSTRALIA),
  blurb: "Preferential voting across 148 to 151 seats.",
  cover: "images/covers/country-au.jpg",
  art: { a: "#082a52", b: "#126d66", glow: "rgba(247,205,79,0.22)" },
  freeElections: ["2025"],
  scenarios: [
    { electionId: "2025", year: 2025, label: "2025 · Albanese v. Dutton", difficulty: "hard",
      description: "Preferential voting, a cyclone-delayed budget, and a Trump-shaped shadow over 150 seats." },
    { electionId: "2022", year: 2022, label: "2022 · Albanese v. Morrison", difficulty: "hard",
      description: "Nine years of Coalition rule, a teal wave on the harbourside, and a PM who doesn't hold a hose." },
    { electionId: "2019", year: 2019, label: "2019 · Morrison v. Shorten", difficulty: "hard",
      description: "The unlosable election. A big-target Labor agenda, a wall of yellow ads, and a daggy-dad miracle. 151 seats under preferences." },
    { electionId: "2016", year: 2016, label: "2016 · Turnbull v. Shorten", addedLater: true, difficulty: "easy",
      description: "A double dissolution, a Mediscare text campaign and an eight-week marathon. 150 seats, and a government that survives by one." },
    { electionId: "2013", year: 2013, label: "2013 · Abbott v. Rudd", addedLater: true, difficulty: "hard",
      description: "Rudd returns, the carbon tax is on trial, and the boats are the issue. 150 seats and a Coalition landslide to resist or enjoy." },
    { electionId: "2010", year: 2010, label: "2010 · Gillard v. Abbott", addedLater: true, difficulty: "easy",
      description: "A leadership coup, leaked cabinet secrets and a Greens first. 150 seats, and the first hung parliament in seventy years." },
    { electionId: "2007", year: 2007, label: "2007 · Rudd v. Howard", addedLater: true, difficulty: "hard",
      description: "Eleven years of Howard, WorkChoices on trial, and the prime minister fighting for his own seat. 150 seats and a Labor landslide." },
    { electionId: "2004", year: 2004, label: "2004 · Howard v. Latham", addedLater: true, difficulty: "hard",
      description: "'Who do you trust?' on interest rates, a handshake that went wrong, and a fourth term for Howard. 150 seats." },
    { electionId: "2001", year: 2001, label: "2001 · Howard v. Beazley", addedLater: true, difficulty: "hard",
      description: "The Tampa, September 11 and 'we will decide who comes to this country'. 150 seats and a government that wins on security." },
    { electionId: "1998", year: 1998, label: "1998 · Howard v. Beazley", addedLater: true, difficulty: "easy",
      description: "The GST election. Labor wins more votes but not enough seats, and One Nation splits the right. 148 seats." },
    { electionId: "1996", year: 1996, label: "1996 · Howard v. Keating", addedLater: true, difficulty: "hard",
      description: "Thirteen years of Labor end. A weary electorate meets 'never, ever' a GST, and the Coalition wins big. 148 seats." },
  ],
  systemLabel: "Preferential voting",
  pack: {
    id: "australia",
    name: "Australia",
    description: "Eleven federal elections from 1996 to 2025. Preferential voting from the end of Keating to the teal wave: the GST, Tampa, WorkChoices, hung parliaments and the unlosable election.",
    price: 99,
  },
  daily: { pair: ["alp", "lnp"], names: { alp: "Labor", lnp: "the Coalition" } },
  next: {
    chain: [
      { id: "1996", blurb: "Continue the timeline: the end of thirteen years of Labor" },
      { id: "1998", blurb: "Continue the timeline: the GST election" },
      { id: "2001", blurb: "Continue the timeline: the Tampa election" },
      { id: "2004", blurb: "Continue the timeline: the interest rate election" },
      { id: "2007", blurb: "Continue the timeline: Kevin07" },
      { id: "2010", blurb: "Continue the timeline: the hung parliament" },
      { id: "2013", blurb: "Continue the timeline: stop the boats" },
      { id: "2016", blurb: "Continue the timeline: the double dissolution" },
      { id: "2019", blurb: "Continue the timeline: the unlosable election" },
      { id: "2022", blurb: "Continue the timeline: the teal wave" },
      { id: "2025", blurb: "Continue the timeline: hold the middle" },
    ],
  },
  guide: {
    title: "Australia",
    body: "Preferential voting in single-member seats, 148 in 1996 and 1998, 150 or 151 since. The game has no preference count: each state's seats follow its vote with preferences folded into the seat curve, so the Greens and One Nation matter mostly through where their votes flow. The Liberal and National parties play as one Coalition. A majority of the House governs alone; a hung parliament needs the crossbench.",
  },
};
