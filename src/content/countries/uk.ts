// UNITED KINGDOM: general elections on the UK engine (content/uk/). This
// module carries only the registry, pack, daily and "play next" metadata; the
// campaign content stays on its own engine path.

import type { CountryModule } from "./types";

export const UK_MODULE: CountryModule = {
  code: "UK",
  name: "United Kingdom",
  flag: "🇬🇧",
  engine: "uk",
  blurb: "Multiparty FPTP: coalitions, landslides, hung parliaments.",
  cover: "images/covers/country-uk.jpg",
  art: { a: "#17224d", b: "#8f2135", glow: "rgba(234,191,87,0.2)" },
  scenarios: [
    { electionId: "2024", year: 2024, label: "2024 · Starmer's landslide", description: "Fourteen years of Conservative rule end. Or do they? Reform surges on the right.", difficulty: "hard" },
    { electionId: "2019", year: 2019, label: "2019 · Get Brexit Done", description: "Johnson's gamble: smash the Red Wall or lose the majority.", difficulty: "hard" },
    { electionId: "2017", year: 2017, label: "2017 · May's gamble", description: "A snap election, a collapsing lead, and a hung parliament in waiting.", difficulty: "easy" },
    { electionId: "2015", year: 2015, label: "2015 · Cameron v. Miliband", description: "Coalition's end, the SNP tide in Scotland, and a polling shock.", difficulty: "hard" },
    { electionId: "2010", year: 2010, label: "2010 · The TV-debate election", description: "Expenses, Cleggmania, and the first hung parliament in a generation.", difficulty: "easy" },
    { electionId: "2005", year: 2005, label: "2005 · Blair's third act", description: "Iraq shadows a tired landslide. How much of the majority survives?", difficulty: "hard" },
    { electionId: "2001", year: 2001, label: "2001 · The quiet landslide", description: "New Labour ascendant; the Tories search for a pulse.", difficulty: "hard" },
    { electionId: "1997", year: 1997, label: "1997 · Things Can Only Get Better", description: "Blair's New Labour against a Major government running on fumes.", difficulty: "hard" },
    { electionId: "1992", year: 1992, label: "1992 · Major's surprise", description: "The polls say Kinnock; the ballot boxes disagree. Defy the polls.", difficulty: "hard" },
    { electionId: "1987", year: 1987, label: "1987 · Thatcher's third", description: "The Iron Lady seeks a third term against a divided opposition.", difficulty: "hard" },
    { electionId: "1983", year: 1983, label: "1983 · The Falklands election", description: "Thatcher rampant, Labour's longest suicide note, the Alliance splitting the left.", difficulty: "hard" },
    { electionId: "1979", year: 1979, label: "1979 · Winter of Discontent", description: "Callaghan limps to the polls; Thatcher offers a revolution.", difficulty: "hard" },
    {
      electionId: "1974feb", year: 1974, label: "1974 (Feb) · Who governs Britain?", difficulty: "easy",
      description: "The miners' strike and the three-day week. Heath asks who governs, and the answer is a hung parliament.",
    },
    {
      electionId: "1974oct", year: 1974, label: "1974 (Oct) · Wilson's slim majority", difficulty: "medium",
      description: "Eight months of minority rule, then back to the country for a working majority of three.",
    },
    { electionId: "1970", year: 1970, label: "1970 · Heath's upset", description: "Wilson is cruising, the polls are wrong, and Heath wins the election nobody expected.", difficulty: "medium" },
    { electionId: "1966", year: 1966, label: "1966 · Wilson's landslide", description: "A majority of four becomes a mandate of ninety-eight. The white heat year.", difficulty: "hard" },
    { electionId: "1964", year: 1964, label: "1964 · Wilson v. Douglas-Home", description: "Thirteen years of Tory rule against the Profumo hangover. The narrowest of wins.", difficulty: "easy" },
    { electionId: "1951", year: 1951, label: "1951 · Churchill's comeback", description: "Attlee's exhausted majority against Churchill's last campaign.", difficulty: "hard" },
  ],
  pack: {
    id: "uk-elections",
    name: "United Kingdom",
    description: "Eighteen general elections, from Churchill's 1951 comeback to Starmer's 2024 landslide. Multiparty first past the post, hung parliaments and all.",
    price: 99,
  },
  daily: { pair: ["lab", "con"], names: { lab: "Labour", con: "the Conservatives" } },
  // Chronological, wrapping at the end.
  next: {
    chain: [
      { id: "1951", blurb: "Continue the timeline: Churchill's last roar" },
      { id: "1964", blurb: "Continue the timeline: thirteen wasted years" },
      { id: "1966", blurb: "Continue the timeline: the white heat mandate" },
      { id: "1970", blurb: "Continue the timeline: the poll that lied" },
      { id: "1974feb", blurb: "Continue the timeline: who governs Britain?" },
      { id: "1974oct", blurb: "Continue the timeline: back for a majority" },
      { id: "1979", blurb: "Continue the timeline: the Winter of Discontent" },
      { id: "1983", blurb: "Continue the timeline: the Falklands landslide" },
      { id: "1987", blurb: "Continue the timeline: boom South, bust North" },
      { id: "1992", blurb: "Continue the timeline: the election Labour was sure to win" },
      { id: "1997", blurb: "Continue the timeline: things can only get better" },
      { id: "2001", blurb: "Continue the timeline: the quiet landslide" },
      { id: "2005", blurb: "Continue the timeline: Iraq's shadow" },
      { id: "2010", blurb: "Continue the timeline: I agree with Nick" },
      { id: "2015", blurb: "Continue the timeline: the polls were wrong" },
      { id: "2017", blurb: "Continue the timeline: the snap that backfired" },
      { id: "2019", blurb: "Continue the timeline: Get Brexit Done" },
      { id: "2024", blurb: "Continue the timeline: fourteen years later" },
    ],
  },
};
