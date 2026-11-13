// FRANCE: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./france.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const FRANCE_MODULE: CountryModule = {
  code: "FR",
  name: "France",
  flag: "🇫🇷",
  engine: "country",
  load: () => import("./france.bundle").then((m) => m.FRANCE),
  blurb: "The two-round runoff for the Élysée.",
  cover: "images/covers/country-fr.jpg",
  art: { a: "#142a59", b: "#a82b42", glow: "rgba(245,245,245,0.18)" },
  freeElections: ["2022"],
  scenarios: [
    { electionId: "2027", year: 2027, label: "2027 · The Republic's runoff", difficulty: "easy",
      description: "Macron is term-limited. The centre defends the Élysée against the RN in a two-round fight for France." },
    { electionId: "2022", year: 2022, label: "2022 · Macron v. Le Pen", difficulty: "hard",
      description: "The rematch. Pouvoir d'achat against the front républicain, and a far narrower runoff than last time." },
    { electionId: "2017", year: 2017, label: "2017 · Macron v. Le Pen", difficulty: "hard", dailyPair: ["em", "fn"],
      description: "A 39-year-old insurgent, a movement a year old, and the debate meltdown that sealed a landslide." },
    { electionId: "2012", year: 2012, label: "2012 · Hollande v. Sarkozy", difficulty: "hard", dailyPair: ["ps", "ump"],
      description: "A crisis president nobody warmed to against the man who promised to be normal. A left-right runoff decided by a whisker." },
    { electionId: "2007", year: 2007, label: "2007 · Sarkozy v. Royal", difficulty: "hard", addedLater: true, dailyPair: ["ps", "ump"],
      description: "A break with twelve years of Chirac against the first woman in a presidential runoff. Bayrou's voters and Le Pen's voters decide a left-right fight." },
    { electionId: "2002", year: 2002, label: "2002 · Chirac v. Le Pen", difficulty: "hard", addedLater: true, dailyPair: ["rpr", "fn"],
      description: "Jospin is eliminated and Le Pen reaches the runoff for the first time. Chirac has to win by a margin that counts, with the whole country watching." },
    { electionId: "1995", year: 1995, label: "1995 · Chirac v. Jospin", difficulty: "medium", addedLater: true, dailyPair: ["ps", "rpr"],
      description: "Chirac on his third try against a Socialist who topped round one. The social fracture, the Mitterrand inheritance and a narrow left-right runoff." },
    { electionId: "1988", year: 1988, label: "1988 · Mitterrand v. Chirac", difficulty: "hard", addedLater: true, dailyPair: ["ps", "rpr"],
      description: "A Socialist president against his own prime minister, two years into cohabitation. Le Pen's voters are the swing bloc, and the last week brings the hostages and Ouvéa." },
    { electionId: "1981", year: 1981, label: "1981 · Mitterrand v. Giscard", difficulty: "hard", addedLater: true, dailyPair: ["ps", "udf"],
      description: "The first left victory of the Fifth Republic is on the table. Mitterrand against an incumbent, with Chirac's cold endorsement and the Communist vote deciding it." },
  ],
  systemLabel: "Two-round presidential runoff",
  setupNote: "Campaign clock: six planning weeks compress the historical two-week runoff.",
  pack: {
    id: "france",
    name: "France",
    description: "Nine presidential elections from 1981 to 2027. Two rounds, a crowded first ballot, and a runoff decided by who the losers back.",
  },
  // Elections before 2022 pair their own finalists (row dailyPair), in the
  // same order as the two slots they had before each got its real party.
  daily: {
    pair: ["ens", "rn"],
    names: { ens: "Ensemble", rn: "the RN", em: "En Marche", fn: "the FN", ps: "the PS", rpr: "the RPR", udf: "the UDF", ump: "the UMP" },
  },
  // Before each election got its real finalists, 1981 to 2017 used the
  // ens and rn slots too. Custom races saved then load with the new ids.
  renamedParties: {
    "2017": { ens: "em", rn: "fn" },
    "2012": { ens: "ps", rn: "ump" },
    "2007": { ens: "ps", rn: "ump" },
    "2002": { ens: "rpr", rn: "fn" },
    "1995": { ens: "ps", rn: "rpr" },
    "1988": { ens: "ps", rn: "rpr" },
    "1981": { ens: "ps", rn: "udf" },
  },
  next: {
    chain: [
      { id: "1981", blurb: "Continue the timeline: the left takes the Élysée" },
      { id: "1988", blurb: "Continue the timeline: cohabitation" },
      { id: "1995", blurb: "Continue the timeline: the end of the Mitterrand era" },
      { id: "2002", blurb: "Continue the timeline: the shock of April 21" },
      { id: "2007", blurb: "Continue the timeline: the break with the past" },
      { id: "2012", blurb: "Continue the timeline: the crisis president" },
      { id: "2017", blurb: "Continue the timeline: En Marche!" },
      { id: "2022", blurb: "Continue the timeline: the rematch with Le Pen" },
      { id: "2027", blurb: "Continue the timeline: the Republic's runoff" },
    ],
  },
  guide: {
    title: "France",
    body: "Win a majority of presidency points. Six planning weeks compress the two-week runoff. First-round transfers are included in opening support. National broadcasts and platform preparation reach the whole electorate.",
  },
};
