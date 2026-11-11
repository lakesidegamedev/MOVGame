// UNITED STATES: presidential elections on the US engine (content/scenarios.ts).
// This module carries only the registry, pack, daily and "play next" metadata;
// the campaign content stays on its own engine path.

import type { CountryModule } from "./types";

export const US_MODULE: CountryModule = {
  code: "US",
  name: "United States",
  flag: "🇺🇸",
  engine: "us",
  blurb: "Winner-take-all duels for 270 electoral votes.",
  cover: "images/covers/country-us.jpg",
  art: { a: "#102f66", b: "#a32d3e", glow: "rgba(129,174,255,0.22)" },
  scenarios: [
    { electionId: "2024", year: 2024, label: "2024 · Harris v. Trump", description: "A late switch at the top of the ticket, the Sun Belt and the Blue Wall both in play.", difficulty: "hard", free: true },
    { electionId: "2020", year: 2020, label: "2020 · Biden v. Trump", description: "A pandemic on the ballot and a blue wall to rebuild. The original campaign.", difficulty: "easy", free: true },
    { electionId: "2016", year: 2016, label: "2016 · Clinton v. Trump", description: "The map looks settled and the blue wall looks safe. Don't be the one who let it crack.", difficulty: "easy" },
    { electionId: "2012", year: 2012, label: "2012 · Obama v. Romney", description: "A slow recovery, a re-election fight, and a turnout war in the swing states.", difficulty: "easy" },
    { electionId: "2008", year: 2008, label: "2008 · Obama v. McCain", description: "An open seat, two wars, and a financial system in free fall.", difficulty: "hard" },
    { electionId: "2004", year: 2004, label: "2004 · Bush v. Kerry", description: "A wartime incumbent, a decorated challenger. It runs through Ohio.", difficulty: "hard" },
    { electionId: "2000", year: 2000, label: "2000 · Gore v. Bush", description: "A knife's-edge electorate, and a recount waiting to happen.", difficulty: "easy" },
    { electionId: "1996", year: 1996, label: "1996 · Clinton v. Dole", description: "A booming economy, a triangulating incumbent, and the last campaign of a war generation.", difficulty: "hard" },
    { electionId: "1992", year: 1992, label: "1992 · Clinton v. Bush", description: "It's the economy, stupid. A broken tax pledge, a billionaire wildcard, and the Man from Hope.", difficulty: "hard" },
    { electionId: "1988", year: 1988, label: "1988 · Dukakis v. Bush", description: "A 17-point summer lead, a tank ride, and the meanest ad war of its era.", difficulty: "hard" },
    { electionId: "1984", year: 1984, label: "1984 · Mondale v. Reagan", description: "Morning in America. Fight the tide, or ride the biggest landslide of the age.", difficulty: "hard" },
    { electionId: "1980", year: 1980, label: "1980 · Carter v. Reagan", description: "Hostages in Tehran, stagflation at home, and one debate to decide it all.", difficulty: "hard" },
    { electionId: "1976", year: 1976, label: "1976 · Carter v. Ford", description: "A pardon in the air, a peanut farmer against Washington, and a fragile Solid South.", difficulty: "hard" },
    { electionId: "1972", year: 1972, label: "1972 · McGovern v. Nixon", description: "A prairie liberal against a 520-EV landslide, and a break-in nobody is talking about yet.", difficulty: "hard" },
    { electionId: "1968", year: 1968, label: "1968 · Humphrey v. Nixon", description: "A party split three ways, a burning summer, and Wallace holding the Deep South.", difficulty: "hard" },
    { electionId: "1964", year: 1964, label: "1964 · Johnson v. Goldwater", description: "A martyred president's heir, a nuclear ad, and the birth of the Sun Belt right.", difficulty: "hard" },
    { electionId: "1960", year: 1960, label: "1960 · Kennedy v. Nixon", description: "Television changes everything, and a hundred thousand votes decide the century's closest race.", difficulty: "easy" },
    { electionId: "1956", year: 1956, label: "1956 · Stevenson v. Eisenhower", description: "Peace, prosperity and a President's heart. Stevenson's rematch against a popular general, with Suez and Hungary at the finish.", difficulty: "hard", addedLater: true },
    { electionId: "1952", year: 1952, label: "1952 · Stevenson v. Eisenhower", description: "Korea, communism and corruption, a secret fund, and a general who promises to go to Korea.", difficulty: "hard", addedLater: true },
    { electionId: "1948", year: 1948, label: "1948 · Truman v. Dewey", description: "Every poll says Dewey. A whistle-stop train, a Democratic Party split three ways, and the upset of the century.", difficulty: "easy", addedLater: true },
  ],
  systemLabel: "Electoral College",
  pack: {
    id: "us-historical",
    name: "United States",
    description: "Eighteen presidential races from 1948 to 2016: the Truman upset, Eisenhower's crusade, the Kennedy debates, the Daisy ad, Watergate, the Reagan Revolution, the Florida recount, the Rust Belt upset.",
    price: 99,
  },
  daily: { pair: ["dem", "rep"], names: { dem: "the Democrats", rep: "the Republicans" } },
  next: {
    map: {
      "2000": { id: "2004", blurb: "Continue the timeline: the wartime election" },
      "2004": { id: "2008", blurb: "Continue the timeline: the crash of 2008" },
      "2008": { id: "2012", blurb: "Continue the timeline: defend the coalition" },
      "2012": { id: "2016", blurb: "Continue the timeline: hold the blue wall" },
      "2016": { id: "2020", blurb: "Continue the timeline: the pandemic election" },
      "2020": { id: "2024", blurb: "Continue the timeline: the 2024 rematch" },
      "2024": { id: "2000", blurb: "Try a different era: the Florida recount awaits" },
      "1948": { id: "1952", blurb: "Continue the timeline: Eisenhower's crusade" },
      "1952": { id: "1956", blurb: "Continue the timeline: the 1956 rematch" },
      "1956": { id: "1960", blurb: "Continue the timeline: the Kennedy debates" },
    },
  },
};
