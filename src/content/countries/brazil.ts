// BRAZIL: the registry metadata (landing card, scenario rows, store pack,
// daily pairing, "play next"). It loads with the landing page, so it stays
// small. The campaign content (map, parties, elections, events) is in
// ./brazil.bundle.ts and loads only when one of its campaigns opens.

import type { CountryModule } from "./types";

export const BRAZIL_MODULE: CountryModule = {
  code: "BR",
  name: "Brazil",
  flag: "🇧🇷",
  engine: "country",
  load: () => import("./brazil.bundle").then((m) => m.BRAZIL),
  blurb: "The presidential runoff from Lula's first win to Bolsonaro's last: six elections, twelve regions, one national vote.",
  cover: "images/covers/country-br.jpg",
  art: { a: "#0b4a3a", b: "#c9a400", glow: "rgba(255,244,200,0.22)" },
  freeElections: ["2022"],
  scenarios: [
    { electionId: "2022", year: 2022, label: "2022 · Lula v. Bolsonaro", difficulty: "easy",
      description: "A former president against the incumbent who doubted the voting machines. The closest runoff in the democratic era, decided by Minas Gerais and the Northeast." },
    { electionId: "2018", year: 2018, label: "2018 · Haddad v. Bolsonaro", difficulty: "hard",
      description: "Lula is in prison, his stand-in has had seven weeks, and the front-runner was stabbed in a crowd. Ciro Gomes has flown to Europe." },
    { electionId: "2014", year: 2014, label: "2014 · Rousseff v. Neves", difficulty: "easy",
      description: "Marina Silva rose and fell. The PT's fourth term meets the Petrobras scandal in a runoff that splits the country by region." },
    { electionId: "2010", year: 2010, label: "2010 · Rousseff v. Serra", difficulty: "hard",
      description: "Lula's chosen successor has never won an election. Marina Silva's 20 million votes force a runoff, and the fight turns on religion." },
    { electionId: "2006", year: 2006, label: "2006 · Lula v. Alckmin", difficulty: "hard",
      description: "The mensalão, a cash dossier and a missed first-round win. Corruption against privatisation, with São Paulo against the Northeast." },
    { electionId: "2002", year: 2002, label: "2002 · Lula v. Serra", difficulty: "hard",
      description: "After three failed runs Lula leads by 23 points, but the real is sliding and the creditors are watching." },
  ],
  systemLabel: "Two-round presidential runoff",
  pack: {
    id: "brazil",
    name: "Brazil",
    description: "Six presidential runoffs from 2002 to 2022: Lula, Rousseff and Bolsonaro across twelve regions, and the voters of the candidates who lost the first round.",
  },
  daily: { pair: ["pt", "dir"], names: { pt: "the PT", dir: "the Right" } },
  next: {
    chain: [
      { id: "2002", blurb: "Continue the timeline: Lula's first win" },
      { id: "2006", blurb: "Continue the timeline: the mensalão runoff" },
      { id: "2010", blurb: "Continue the timeline: Rousseff and the religion fight" },
      { id: "2014", blurb: "Continue the timeline: Marina Silva and the petrolão" },
      { id: "2018", blurb: "Continue the timeline: the stabbing and the empty chair" },
      { id: "2022", blurb: "Continue the timeline: Lula against Bolsonaro" },
    ],
  },
  guide: {
    title: "Brazil",
    body: "Brazil elects its president in two rounds. You play the runoff, with the first round already counted: the voters of the candidates who lost it (Marina Silva, Ciro Gomes, Simone Tebet and others) are part of the opening map, and events show them moving. Win 51 of 100 points. Each of twelve regions holds points in proportion to the votes cast there, and a region's points go to whoever leads it. The PT is one finalist every time. The Right is the PSDB in 2002, 2006, 2010 and 2014, then Bolsonaro for the PSL (2018) and the PL (2022). The game cannot model the first round itself, so the eliminated candidates' voters cannot be moved through a transfer table. National broadcasts reach everyone, and regional pushes win a region.",
  },
};
