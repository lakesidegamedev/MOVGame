// GERMANY: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./germany.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const GERMANY_MODULE: CountryModule = {
  code: "DE",
  name: "Germany",
  flag: "🇩🇪",
  engine: "country",
  load: () => import("./germany.bundle").then((m) => m.GERMANY),
  blurb: "Proportional Bundestag politics and the firewall.",
  cover: "images/covers/country-de.jpg",
  art: { a: "#17191d", b: "#8c6618", glow: "rgba(233,194,65,0.22)" },
  freeElections: ["2025"],
  scenarios: [
    { electionId: "2025", year: 2025, label: "2025 · Merz v. Scholz", difficulty: "easy",
      description: "The traffic-light coalition collapses. Five-plus parties, a firewall under strain, and 630 Bundestag seats." },
    { electionId: "2021", year: 2021, label: "2021 · Scholz v. Laschet", difficulty: "easy",
      description: "Merkel departs, a flood reshapes the race, and six parties fight over a 735-seat Bundestag." },
    { electionId: "2017", year: 2017, label: "2017 · Merkel v. Schulz", difficulty: "hard",
      description: "The Schulz train runs out of track and the AfD storms the Bundestag. Merkel's fourth term, a re-entering FDP, and 709 seats." },
    { electionId: "2013", year: 2013, label: "2013 · Merkel v. Steinbrück", difficulty: "hard", addedLater: true,
      description: "A popular chancellor, a threshold-hugging FDP and a brand-new AfD. Four parties are safe, two are not, and 631 seats are in play." },
    { electionId: "2009", year: 2009, label: "2009 · Merkel v. Steinmeier", difficulty: "hard", addedLater: true,
      description: "A grand coalition ends in the shadow of the financial crisis. A buoyant FDP, a surging Left and five parties fight over 622 seats." },
    { electionId: "2005", year: 2005, label: "2005 · Schröder v. Merkel", difficulty: "easy", addedLater: true,
      description: "Schröder calls an early election and starts far behind. A new left party, a flat-tax professor and 614 seats with no obvious majority." },
    { electionId: "2002", year: 2002, label: "2002 · Schröder v. Stoiber", difficulty: "easy", addedLater: true,
      description: "Stoiber leads until the Elbe floods and Schröder rules out Iraq. A near tie, a PDS below the threshold and 603 seats." },
    { electionId: "1998", year: 1998, label: "1998 · Schröder v. Kohl", difficulty: "hard", addedLater: true,
      description: "Sixteen years of Kohl against Schröder's new centre. Unemployment that peaked near five million, and 669 seats." },
    { electionId: "1994", year: 1994, label: "1994 · Kohl v. Scharping", difficulty: "hard", addedLater: true,
      description: "Kohl's superelection year. A recovering economy, the PDS fighting for direct seats and the SPD's three-headed team, for 672 seats." },
    { electionId: "1990", year: 1990, label: "1990 · Kohl v. Lafontaine", difficulty: "hard", addedLater: true,
      description: "The first all-German election, two months after unification. Separate thresholds for East and West and 662 seats." },
  ],
  systemLabel: "Mixed-member proportional",
  pack: {
    id: "germany",
    name: "Germany",
    description: "Ten Bundestag elections from 1990 to 2025. Mixed-member proportional, five-plus parties, and coalition math after the count.",
  },
  daily: { pair: ["cdu", "spd"], names: { cdu: "CDU/CSU", spd: "the SPD" } },
  next: {
    chain: [
      { id: "1990", blurb: "Continue the timeline: the first all-German election" },
      { id: "1994", blurb: "Continue the timeline: Kohl's superelection year" },
      { id: "1998", blurb: "Continue the timeline: the end of the Kohl era" },
      { id: "2002", blurb: "Continue the timeline: the flood and the Iraq war" },
      { id: "2005", blurb: "Continue the timeline: an early election" },
      { id: "2009", blurb: "Continue the timeline: the financial crisis" },
      { id: "2013", blurb: "Continue the timeline: the euro crisis" },
      { id: "2017", blurb: "Continue the timeline: the AfD arrives" },
      { id: "2021", blurb: "Continue the timeline: the traffic-light era" },
      { id: "2025", blurb: "Continue the timeline: the centre holds?" },
    ],
  },
  guide: {
    title: "Germany",
    body: "National proportional allocation determines seats. Regional plurality map colors do not award every seat to that party. The 5% threshold can exclude parties; CSU is exempt. Compatible coalitions can form a government.",
  },
};
