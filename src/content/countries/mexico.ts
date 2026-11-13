// MEXICO: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./mexico.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const MEXICO_MODULE: CountryModule = {
  code: "MX",
  name: "Mexico",
  flag: "🇲🇽",
  engine: "country",
  load: () => import("./mexico.bundle").then((m) => m.MEXICO),
  blurb: "The presidency from the fall of the PRI to Sheinbaum: five elections, eleven regions, one round, most votes wins.",
  cover: "images/covers/country-mx.jpg",
  art: { a: "#0b3d2e", b: "#8b1d3b", glow: "rgba(255,236,214,0.22)" },
  freeElections: ["2024"],
  scenarios: [
    { electionId: "2024", year: 2024, label: "2024 · Sheinbaum v. Gálvez", difficulty: "hard",
      description: "López Obrador's successor against an opposition alliance of the PAN, the PRI and the PRD, with Movimiento Ciudadano chasing young voters." },
    { electionId: "2018", year: 2018, label: "2018 · López Obrador v. Anaya", difficulty: "hard",
      description: "López Obrador's third run, now with Morena, against a divided opposition and a government sunk by scandal." },
    { electionId: "2012", year: 2012, label: "2012 · Peña Nieto v. López Obrador", difficulty: "medium",
      description: "The PRI comes back with Peña Nieto. #YoSoy132, the Televisa questions and López Obrador's second run decide how wide the gap is." },
    { electionId: "2006", year: 2006, label: "2006 · Calderón v. López Obrador", difficulty: "easy",
      description: "Calderón against López Obrador, decided by 0.58 points. Every region counts, and a single point is the whole race." },
    { electionId: "2000", year: 2000, label: "2000 · Fox v. Labastida", difficulty: "hard",
      description: "Vicente Fox against the PRI's 71 years in power, with Cárdenas holding the left. The useful vote decides it." },
  ],
  systemLabel: "Single-round presidential plurality",
  pack: {
    id: "mexico",
    name: "Mexico",
    description: "Five presidential elections from 2000 to 2024: Fox, Calderón, Peña Nieto, López Obrador and Sheinbaum across eleven regions, where the most votes win in one round.",
  },
  daily: { pair: ["pan", "izq"], names: { pan: "the PAN", izq: "the PRD/Morena left" } },
  next: {
    chain: [
      { id: "2000", blurb: "Continue the timeline: the end of 71 years of PRI rule" },
      { id: "2006", blurb: "Continue the timeline: the 0.58 point election" },
      { id: "2012", blurb: "Continue the timeline: the PRI returns" },
      { id: "2018", blurb: "Continue the timeline: López Obrador's landslide" },
      { id: "2024", blurb: "Continue the timeline: Sheinbaum against Gálvez" },
    ],
  },
  guide: {
    title: "Mexico",
    body: "Mexico elects its president in one round by plurality: the candidate with the most votes wins, with no second round and no share to reach. Fox won in 2000 with 43 percent of the vote and Calderón in 2006 with 37, a lead of 0.58 points. The 100 points are split by valid votes across eleven regions, and whoever finishes with the most points wins the presidency. A tie on points goes to the candidate with more national votes. Your margin is your lead over the strongest rival. The PAN is a finalist every time; the left is the PRD to 2012 and Morena from 2018; the PRI runs until 2018 and backs the PAN's candidate in 2024; Movimiento Ciudadano runs alone in 2024. National broadcasts reach the whole country, and regional pushes win the points a region holds.",
  },
};
