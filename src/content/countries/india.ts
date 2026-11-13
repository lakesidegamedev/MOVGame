// INDIA: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./india.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const INDIA_MODULE: CountryModule = {
  code: "IN",
  name: "India",
  flag: "🇮🇳",
  engine: "country",
  load: () => import("./india.bundle").then((m) => m.INDIA),
  blurb: "First past the post across 543 seats: two alliances, a dozen regional powers and the largest electorate on earth.",
  cover: "images/covers/country-in.jpg",
  art: { a: "#7a2e0b", b: "#0f5b46", glow: "rgba(255,200,120,0.22)" },
  freeElections: ["2024"],
  scenarios: [
    { electionId: "2024", year: 2024, label: "2024 · Modi v. Rahul Gandhi", difficulty: "hard",
      description: "Ab ki baar 400 paar meets an opposition bloc that finally agrees on something. Seven phases, a Hindi belt that pushed back, and the BJP needing its allies." },
    { electionId: "2019", year: 2019, label: "2019 · Modi v. Rahul Gandhi", difficulty: "hard",
      description: "Pulwama and Balakot turn a farm distress election into a security election. Congress offers NYAY, and Uttar Pradesh bets on a feud that ended." },
    { electionId: "2014", year: 2014, label: "2014 · Modi v. Rahul Gandhi", difficulty: "hard",
      description: "The Modi wave against a decade of UPA scandal and price rises. The BJP aims for the first single-party majority in thirty years." },
    { electionId: "2009", year: 2009, label: "2009 · Singh v. Advani", difficulty: "easy",
      description: "The UPA seeks a second term after the nuclear deal and the farm loan waiver. Advani's last run, a fourth front, and the Left withdrawn from the government's support." },
    { electionId: "2004", year: 2004, label: "2004 · Vajpayee v. Sonia Gandhi", difficulty: "hard", addedLater: true,
      description: "The NDA calls an early election on 'India Shining' and expects to win. Sonia Gandhi's Congress builds state alliances, the Samajwadi Party and the BSP stay out, and the Left decides who can reach 272." },
    { electionId: "1999", year: 1999, label: "1999 · Vajpayee v. Sonia Gandhi", difficulty: "hard", addedLater: true,
      description: "A government that lost a confidence vote by one vote asks for a mandate after Kargil. Sonia Gandhi fights her first Lok Sabha election, Sharad Pawar has walked out over her Italian birth, and the NDA fields over twenty parties." },
  ],
  systemLabel: "First past the post, 543 seats",
  regionalParties: ["Trinamool", "Samajwadi", "BJD", "YSRCP", "AIADMK"],
  pack: {
    id: "india",
    name: "India",
    description: "Six Lok Sabha elections from 1999 to 2024: Vajpayee's fall and return, the Congress comeback of 2004, the UPA's second term, the Modi wave, the Balakot election and the 2024 result that left the BJP needing its allies.",
  },
  daily: { pair: ["nda", "upa"], names: { nda: "the NDA", upa: "the UPA / INDIA bloc" } },
  next: {
    chain: [
      { id: "1999", blurb: "Continue the timeline: Vajpayee's return after Kargil" },
      { id: "2004", blurb: "Continue the timeline: the Congress comeback" },
      { id: "2009", blurb: "Continue the timeline: the UPA's second term" },
      { id: "2014", blurb: "Continue the timeline: the Modi wave" },
      { id: "2019", blurb: "Continue the timeline: the Balakot election" },
      { id: "2024", blurb: "Continue the timeline: the INDIA bloc" },
    ],
  },
  guide: {
    title: "India",
    body: "First past the post in 543 single-member constituencies, grouped here into fifteen regions. Seats follow each region's vote, so winning a state matters more than winning the country. Parties are the alliances voters faced: the BJP-led NDA and the Congress-led UPA (the INDIA bloc in 2024; in 1999 and 2004, Congress and the allies it had before polling), with regional parties such as Trinamool, the BJD and the YSRCP shown on their own only where they stood apart from both. Where a regional party was a pre-poll ally, its votes and seats sit with that alliance, so the same party can be inside the NDA in one election and alone in the next. The Lok Sabha needs 272 seats. Congress and the BJP never govern together, and the Samajwadi Party and the Left never join the NDA.",
  },
};
