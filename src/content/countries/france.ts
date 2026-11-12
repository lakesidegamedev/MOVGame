// FRANCE — the presidential runoff. The playable campaign is the
// entre-deux-tours (two finalists over a 100-point electoral pool; 51 wins
// the Élysée). Round-1 → round-2 advancement lives in engine/runoff.ts:
// first-round shares + a transfer matrix (front républicain / abstention)
// produce the second-round map. The authored per-région `v` below are the
// real second-round shares (calibration anchors); `FIRST_ROUND` +
// `TRANSFERS` document how those maps arise and are checked in runoff tests.
// Four runoffs ship: speculative 2027 (Philippe–Bardella), real 2022
// (Macron 58.55 / Le Pen 41.45), real 2017 (Macron 66.1 / 33.9), and real
// 2012 (Hollande 51.64 / Sarkozy 48.36). The bundle only carries two party
// slots (ens / rn), so 2012 maps the left finalist Hollande (PS) onto `ens`
// and the incumbent right finalist Sarkozy (UMP) onto `rn`: a left-vs-right
// runoff, not a centre-vs-far-right one. The leaders and labels carry the real
// identities; the far right (Le Pen) is a first-round casualty that turn.
//
// Five older runoffs were added later: 2007 (Sarkozy 53.06 / Royal 46.94),
// 2002 (Chirac 82.21 / Le Pen 17.79), 1995 (Chirac 52.64 / Jospin 47.36),
// 1988 (Mitterrand 54.02 / Chirac 45.98) and 1981 (Mitterrand 51.76 / Giscard
// 48.24). Slots follow the 2012 convention for left-right runoffs: `ens` is
// the left finalist (Royal, Jospin, Mitterrand) and `rn` the right finalist
// (Sarkozy, Chirac, Giscard). 2002 is the exception that matches 2017 and
// 2022: `ens` is the outgoing president Chirac and `rn` is Jean-Marie Le Pen
// of the Front National, the party that later became the Rassemblement
// National. In 2002 Jospin finished third, so the first-round shock is an
// event and the runoff is Chirac against Le Pen.
//
// Regional runoff shares: all five maps are the official second-round results
// by constituency (Interior Ministry files as archived by Sciences Po CDSP and
// published on data.gouv.fr), summed by department and grouped from the old
// regions into the thirteen regions used here, weighted by votes cast. The
// Corse and overseas group is Corsica plus the overseas departments and
// territories, without the vote of French citizens abroad (2007, 2002, 1995
// from the ministry files). In 1988 and 1981 the ministry file covers
// mainland France and Corsica only, so the overseas part comes from the
// Conseil constitutionnel returns for Guadeloupe, Martinique, Guyane,
// Reunion, New Caledonia, Saint-Pierre-et-Miquelon and Wallis-et-Futuna, as
// reproduced on the French Wikipedia pages for each territory. French
// Polynesia's turnout is an estimate (about 55,000 votes cast in 1988, about
// 50,000 in 1981; its vote share is the reported one) and Mayotte is omitted,
// so the Corse and overseas shares for 1988 and 1981 are official to within
// a few tenths of a point. Points (`s`) split each region's pool by its
// runoff share, rounded so the national total matches the real runoff.


import type { CountryBundle } from "@engine/countryGame";
import { attachElectionIssues, countryModule } from "./types";
import { FR_MAP } from "./paths/fr";
import { FR_ELECTION_ISSUES } from "./issues/fr";
import type { TransferMatrix, RoundShares } from "@engine/runoff";

/** National first-round shares (real 2017/2022; polling-informed 2027). */
export const FR_FIRST_ROUND: Record<string, RoundShares> = {
  // 2017 first round (approx.): Macron 24.0, Le Pen 21.3, Fillon 20.0, Mélenchon 19.6, Hamon 6.4, …
  "2017": { ens: 0.240, rn: 0.213, lfi: 0.196, lr: 0.200, other: 0.151 },
  // 2022 first round: Macron 27.9, Le Pen 23.2, Mélenchon 22.0, Zemmour 7.1, Pécresse 4.8, …
  "2022": { ens: 0.279, rn: 0.232, lfi: 0.220, lr: 0.048, other: 0.221 },
  // 2027 speculative: centre and RN clear, left fragmented, right collapsed.
  "2027": { ens: 0.26, rn: 0.25, lfi: 0.18, lr: 0.10, other: 0.21 },
  // 2012 first round: Hollande 28.6, Sarkozy 27.2, Le Pen 17.9, Mélenchon 11.1,
  // Bayrou 9.1. `ens` = Hollande (PS), `rn` = Sarkozy (UMP); here `lr` carries
  // the eliminated Le Pen (FN) vote that breaks to the right finalist.
  "2012": { ens: 0.286, rn: 0.272, lfi: 0.111, lr: 0.179, other: 0.152 },
  // 2007 first round: Sarkozy 31.2, Royal 25.9, Bayrou 18.6, Le Pen 10.4,
  // Besancenot 4.1, de Villiers 2.2, Buffet 1.9, Voynet 1.6, Laguiller 1.3,
  // Bové 1.3, Nihous 1.2, Schivardi 0.3. `ens` = Royal, `rn` = Sarkozy;
  // `lfi` = the left candidates, `lr` = Le Pen and de Villiers, `other` =
  // Bayrou and Nihous.
  "2007": { ens: 0.2587, rn: 0.3118, lfi: 0.1057, lr: 0.1267, other: 0.1972 },
  // 2002 first round: Chirac 19.9, Le Pen 16.9, Jospin 16.2, Bayrou 6.8,
  // Laguiller 5.7, Chevenement 5.3, Mamere 5.3, Besancenot 4.3, Saint-Josse
  // 4.2, Madelin 3.9, Hue 3.4, Megret 2.3, Taubira 2.3, Lepage 1.9, Boutin
  // 1.2, Gluckstein 0.5. `ps` = Jospin, `gauche_rad` = Laguiller, Besancenot,
  // Hue and Gluckstein, `gauche_plur` = Chevenement, Mamere and Taubira,
  // `centre_droit` = Bayrou and Madelin, `other` = Saint-Josse, Lepage, Boutin
  // and Megret.
  "2002": { ens: 0.1988, rn: 0.1686, ps: 0.1618, gauche_rad: 0.1381, gauche_plur: 0.1290, centre_droit: 0.1075, other: 0.0964 },
  // 1995 first round: Jospin 23.3, Chirac 20.8, Balladur 18.6, Le Pen 15.0,
  // Hue 8.6, Laguiller 5.3, de Villiers 4.7, Voynet 3.3, Cheminade 0.3.
  // `ens` = Jospin, `rn` = Chirac; `lr` = Balladur, `fn` = Le Pen and de
  // Villiers, `lfi` = Hue, Laguiller, Voynet and Cheminade.
  "1995": { ens: 0.2330, rn: 0.2084, lr: 0.1858, fn: 0.1974, lfi: 0.1754 },
  // 1988 first round: Mitterrand 34.1, Chirac 19.9, Barre 16.5, Le Pen 14.4,
  // Lajoinie 6.8, Waechter 3.8, Juquin 2.1, Laguiller 2.0, Boussel 0.4.
  // `ens` = Mitterrand, `rn` = Chirac; `lr` = Barre, `fn` = Le Pen, `lfi` =
  // the four left and green candidates.
  "1988": { ens: 0.3411, rn: 0.1994, lr: 0.1654, fn: 0.1439, lfi: 0.1501 },
  // 1981 first round: Giscard 28.3, Mitterrand 25.9, Chirac 18.0, Marchais
  // 15.4, Lalonde 3.9, Laguiller 2.3, Crepeau 2.2, Debre 1.7, Garaud 1.3,
  // Bouchardeau 1.1. `ens` = Mitterrand, `rn` = Giscard; `lr` = Chirac, Debre
  // and Garaud, `lfi` = Marchais, Laguiller and Bouchardeau, `other` = Lalonde
  // and Crepeau.
  "1981": { ens: 0.2585, rn: 0.2832, lr: 0.2100, lfi: 0.1875, other: 0.0609 },
};

/** Bloc-transfer matrices from eliminated first-round candidates into the runoff. */
export const FR_TRANSFERS: Record<string, TransferMatrix> = {
  // 2017: a firm front républicain — Fillon/Hamon voters break hard for Macron.
  "2017": {
    lfi: { ens: 0.52, rn: 0.12, _abstain: 0.36 },
    lr: { ens: 0.72, rn: 0.18, _abstain: 0.10 },
    other: { ens: 0.58, rn: 0.22, _abstain: 0.20 },
  },
  // 2022: softer transfers — Mélenchon's "troisième tour" frame, a drilled RN.
  "2022": {
    lfi: { ens: 0.42, rn: 0.18, _abstain: 0.40 },
    lr: { ens: 0.55, rn: 0.30, _abstain: 0.15 },
    other: { ens: 0.48, rn: 0.28, _abstain: 0.24 },
  },
  // 2027: front républicain fatigue — transfers still favour the centre, barely.
  "2027": {
    lfi: { ens: 0.35, rn: 0.25, _abstain: 0.40 },
    lr: { ens: 0.45, rn: 0.40, _abstain: 0.15 },
    other: { ens: 0.40, rn: 0.35, _abstain: 0.25 },
  },
  // 2012: the left (Mélenchon) breaks hard for Hollande (`ens`); the FN vote
  // (`lr` slot) breaks to Sarkozy (`rn`); Bayrou's centre (`other`) splits with
  // a slight edge to Hollande. The net leaves Hollande narrowly ahead.
  "2012": {
    lfi: { ens: 0.80, rn: 0.06, _abstain: 0.14 },
    lr: { ens: 0.20, rn: 0.60, _abstain: 0.20 },
    other: { ens: 0.42, rn: 0.38, _abstain: 0.20 },
  },
  // 2007: the left breaks for Royal, Le Pen's voters mostly for Sarkozy, and
  // Bayrou's voters split almost evenly.
  "2007": {
    lfi: { ens: 0.80, rn: 0.05, _abstain: 0.15 },
    lr: { ens: 0.07, rn: 0.72, _abstain: 0.21 },
    other: { ens: 0.38, rn: 0.37, _abstain: 0.25 },
  },
  // 2002: rows are net of the surge in turnout between rounds (abstention fell
  // from 28 to 20 percent), so they run higher than raw switching. Even so the
  // model understates the 82 percent landslide, which the authored regional
  // shares carry exactly.
  "2002": {
    ps: { ens: 0.98, rn: 0.00, _abstain: 0.02 },
    gauche_rad: { ens: 0.93, rn: 0.02, _abstain: 0.05 },
    gauche_plur: { ens: 0.96, rn: 0.01, _abstain: 0.03 },
    centre_droit: { ens: 0.96, rn: 0.02, _abstain: 0.02 },
    other: { ens: 0.74, rn: 0.18, _abstain: 0.08 },
  },
  // 1995: Balladur's voters mostly follow him to Chirac, Le Pen's voters
  // split between Chirac and the couch, the left breaks for Jospin.
  "1995": {
    lfi: { ens: 0.86, rn: 0.03, _abstain: 0.11 },
    lr: { ens: 0.10, rn: 0.76, _abstain: 0.14 },
    fn: { ens: 0.13, rn: 0.60, _abstain: 0.27 },
  },
  // 1988: Barre's centrists and Le Pen's voters go to Chirac in large numbers,
  // the Communists and Greens to Mitterrand, but the right falls just short.
  "1988": {
    lfi: { ens: 0.90, rn: 0.03, _abstain: 0.07 },
    lr: { ens: 0.17, rn: 0.71, _abstain: 0.12 },
    fn: { ens: 0.05, rn: 0.80, _abstain: 0.15 },
  },
  // 1981: Chirac's Gaullists mostly follow him to Giscard, the Communists and
  // ecologists to Mitterrand, which is just enough.
  "1981": {
    lfi: { ens: 0.86, rn: 0.04, _abstain: 0.10 },
    lr: { ens: 0.16, rn: 0.74, _abstain: 0.10 },
    other: { ens: 0.60, rn: 0.12, _abstain: 0.28 },
  },
};

export const FRANCE: CountryBundle = {
  id: "FR",
  label: "France",
  flag: "🇫🇷",
  currency: "€",
  unitName: "point",
  unitNamePlural: "points",
  goalText: "51 of 100 electoral points",
  defaultSeatElasticity: 1.0,
  eventChance: 0.75,
  map: FR_MAP,

  system: {
    id: "FR",
    label: "France",
    parties: [
      { id: "ens", name: "The Centre (Ensemble & allies)", shortName: "Centre", color: "#f2b41c" },
      { id: "rn", name: "Rassemblement National", shortName: "RN", color: "#0f3b8c" },
    ],
    allocation: { id: "regional_seats_curve", label: "Two-round runoff (entre-deux-tours points)", unit: "point" },
    majority: { total: 100, threshold: 51 },
  },
  playable: ["ens", "rn"],
  abstaining: [],
  // A runoff has no coalitions: one candidate wins the presidency outright.
  coalitions: { none: true },
  governmentText: {
    majority: "{party} wins the presidency with {seats} points.",
    minority: "{party} scrapes the narrowest of wins: {seats} points.",
    hung: "Dead heat. France recounts through the night; the Republic holds its breath.",
  },
  runoff: true,
  goalHint: "Win {majority} of {total} presidency points. Six planning weeks compress the historical two-week runoff. First-round transfers are included in the opening support. National broadcasts and platform preparation reach the whole electorate.",

  issues: [
    { id: "cost_of_living", name: "Pouvoir d'achat", blurb: "Purchasing power: the issue that decides French elections." },
    { id: "immigration_identity", name: "Immigration & identity", blurb: "The far right's home turf: borders, laïcité, national identity." },
    { id: "security", name: "Security", blurb: "Crime, policing, and the sense of order." },
    { id: "pensions", name: "Pensions", blurb: "The retirement age, and who pays for pensions." },
    { id: "europe", name: "Europe", blurb: "France's place in Europe, the single currency and who pays for it." },
    { id: "public_services", name: "Public services", blurb: "Hospitals, schools, and the deserted countryside." },
  ],

  blocs: [
    { id: "urban_graduate", name: "Urban graduates", share: 0.26, turnoutPropensity: 0.78,
      tilt: { ens: 0.45, rn: -0.45 } },
    { id: "periurban_worker", name: "Periurban workers", share: 0.28, turnoutPropensity: 0.66,
      tilt: { rn: 0.5, ens: -0.5 } },
    { id: "rural", name: "Rural France", share: 0.20, turnoutPropensity: 0.7,
      tilt: { rn: 0.3, ens: -0.3 } },
    { id: "young", name: "Young voters (18-29)", share: 0.16, turnoutPropensity: 0.52,
      tilt: { rn: 0.15, ens: -0.15 } },
    { id: "senior", name: "Seniors (65+)", share: 0.24, turnoutPropensity: 0.85,
      tilt: { ens: 0.45, rn: -0.45 } },
  ],

  regions: [
    { id: "HDF", name: "Hauts-de-France", abbr: "HdF", seats: 9, electorate: 2900, tile: { row: 0, col: 2 },
      profile: { periurban_worker: 1.3, urban_graduate: 0.8 } },
    { id: "NOR", name: "Normandie", abbr: "Nor", seats: 5, electorate: 1700, tile: { row: 0, col: 1 },
      profile: { rural: 1.15, periurban_worker: 1.1 } },
    { id: "GE", name: "Grand Est", abbr: "GE", seats: 8, electorate: 2700, tile: { row: 0, col: 3 },
      profile: { periurban_worker: 1.2 } },
    { id: "BRE", name: "Bretagne", abbr: "Bre", seats: 5, electorate: 1800, tile: { row: 1, col: 0 },
      profile: { urban_graduate: 1.1, senior: 1.1 } },
    { id: "PDL", name: "Pays de la Loire", abbr: "PdL", seats: 6, electorate: 2000, tile: { row: 1, col: 1 },
      profile: { senior: 1.1, rural: 1.1 } },
    { id: "IDF", name: "Île-de-France", abbr: "IdF", seats: 18, electorate: 5600, tile: { row: 1, col: 2 },
      profile: { urban_graduate: 1.5, young: 1.2, rural: 0.3, senior: 0.8 } },
    { id: "BFC", name: "Bourgogne-Franche-Comté", abbr: "BFC", seats: 4, electorate: 1400, tile: { row: 1, col: 3 },
      profile: { rural: 1.3, periurban_worker: 1.1 } },
    { id: "CVL", name: "Centre-Val de Loire", abbr: "CVL", seats: 4, electorate: 1300, tile: { row: 2, col: 2 },
      profile: { rural: 1.25 } },
    { id: "NAQ", name: "Nouvelle-Aquitaine", abbr: "NAq", seats: 9, electorate: 3100, tile: { row: 2, col: 1 },
      profile: { senior: 1.15, rural: 1.15 } },
    { id: "ARA", name: "Auvergne-Rhône-Alpes", abbr: "ARA", seats: 12, electorate: 4000, tile: { row: 2, col: 3 },
      profile: { urban_graduate: 1.05 } },
    { id: "OCC", name: "Occitanie", abbr: "Occ", seats: 9, electorate: 3000, tile: { row: 3, col: 2 },
      profile: { rural: 1.1, young: 1.05 } },
    { id: "PACA", name: "Provence-Alpes-Côte d'Azur", abbr: "PACA", seats: 8, electorate: 2600, tile: { row: 3, col: 3 },
      profile: { senior: 1.2, periurban_worker: 1.1 } },
    { id: "COM", name: "Corse & Outre-mer", abbr: "DOM", seats: 3, electorate: 1200, tile: { row: 3, col: 0 },
      profile: { young: 1.15, periurban_worker: 1.1 } },
  ],

  elections: {
    "2027": {
      id: "2027",
      year: 2027,
      label: "2027 · The Republic's Runoff",
      tagline: "April 2027. Macron is term-limited, the first round is done, and for the first time the RN enters a runoff at parity. Two weeks. Every point counts.",
      salience: { cost_of_living: 0.9, immigration_identity: 0.8, security: 0.65, pensions: 0.6, public_services: 0.55, europe: 0.5, debt: 0.7 },
      regions: {
        HDF:  { v: { ens: 0.42, rn: 0.58 }, s: { ens: 4, rn: 5 } },
        NOR:  { v: { ens: 0.48, rn: 0.52 }, s: { ens: 2, rn: 3 } },
        GE:   { v: { ens: 0.45, rn: 0.55 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.60, rn: 0.40 }, s: { ens: 3, rn: 2 } },
        PDL:  { v: { ens: 0.58, rn: 0.42 }, s: { ens: 4, rn: 2 } },
        IDF:  { v: { ens: 0.62, rn: 0.38 }, s: { ens: 11, rn: 7 } },
        BFC:  { v: { ens: 0.47, rn: 0.53 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.50, rn: 0.50 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.54, rn: 0.46 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.53, rn: 0.47 }, s: { ens: 6, rn: 6 } },
        OCC:  { v: { ens: 0.52, rn: 0.48 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.43, rn: 0.57 }, s: { ens: 3, rn: 5 } },
        COM:  { v: { ens: 0.52, rn: 0.48 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "succession_2027", headline: "The post-Macron succession scramble spills into the open as the centre squabbles over its own crown", role: "any", party: "ens", weight: 3, appeal: -0.02, momentum: -5, turn: 0 },
        { id: "normalisation_2027", headline: "Normalization pays: prime-time profiles cast the RN as a party of government, suits and spreadsheets", role: "any", party: "rn", weight: 3, appeal: 0.03, momentum: 7, turn: 1 },
        { id: "degradation_dette_2027", headline: "A ratings agency downgrades French debt, and the bill for the Macron years lands on the centre's doorstep", role: "any", party: "ens", weight: 3, appeal: -0.03, momentum: -7, turn: 2 },
        { id: "peur_cohabitation_2027", headline: "Cohabitation dread: markets and Brussels game out an RN Élysée, and hesitant voters flinch", role: "any", party: "rn", weight: 3, appeal: -0.03, momentum: -7, turn: 3 },
        { id: "front_republicain_2027", headline: "One more time with feeling: the front républicain question. Eliminated candidates' voters break, reluctantly, for the centre", role: "any", party: "ens", weight: 3, appeal: 0.035, momentum: 8, turn: 4 },
        { id: "banlieue_2027", headline: "A banlieue security flashpoint drags the final days onto the RN's ground", role: "any", party: "rn", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "2022": {
      id: "2022",
      year: 2022,
      label: "2022 · Macron v. Le Pen",
      tagline: "April 24, 2022. The rematch nobody wanted twice: pouvoir d'achat against l'État McKinsey, war on the continent, and a much better-drilled Le Pen. Two weeks to hold the Republic's line.",
      salience: { cost_of_living: 0.95, immigration_identity: 0.7, security: 0.55, pensions: 0.7, public_services: 0.5, europe: 0.6, integrity: 0.45, climate: 0.4 },
      // The historical runoff still opens at 59-41. A disciplined RN operation
      // can convert its late cost-of-living message into a narrow upset, while
      // idle play keeps the historical favourite ahead.
      campaignPower: { rn: 1.35 },
      regions: {
        HDF:  { v: { ens: 0.473, rn: 0.527 }, s: { ens: 4, rn: 5 } },
        NOR:  { v: { ens: 0.558, rn: 0.442 }, s: { ens: 3, rn: 2 } },
        GE:   { v: { ens: 0.517, rn: 0.483 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.685, rn: 0.315 }, s: { ens: 4, rn: 1 } },
        PDL:  { v: { ens: 0.667, rn: 0.333 }, s: { ens: 4, rn: 2 } },
        IDF:  { v: { ens: 0.738, rn: 0.262 }, s: { ens: 13, rn: 5 } },
        BFC:  { v: { ens: 0.536, rn: 0.464 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.556, rn: 0.444 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.597, rn: 0.403 }, s: { ens: 6, rn: 3 } },
        ARA:  { v: { ens: 0.587, rn: 0.413 }, s: { ens: 7, rn: 5 } },
        OCC:  { v: { ens: 0.558, rn: 0.442 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.494, rn: 0.506 }, s: { ens: 4, rn: 4 } },
        COM:  { v: { ens: 0.410, rn: 0.590 }, s: { ens: 1, rn: 2 } },
      },
      events: [
        { id: "mckinsey_2022", headline: "The McKinsey affair, from the Senate's March report: millions in consulting fees, no corporate tax paid. 'L'État McKinsey' still sticks to the incumbent", role: "any", party: "ens", weight: 3, appeal: -0.03, momentum: -7, turn: 0 },
        { id: "retraite_65_2022", headline: "Retraite à 65 ans: the pension pledge from Macron's March programme detonates on the left and becomes the attack ad", role: "any", party: "ens", weight: 3, appeal: -0.03, momentum: -6, turn: 1 },
        { id: "pouvoir_achat_2022", headline: "One theme, hammered daily: Le Pen's pouvoir d'achat campaign owns the caddie and the fuel pump", role: "any", party: "rn", weight: 3, appeal: 0.035, momentum: 8, turn: 2 },
        { id: "prets_russes_2022", headline: "The Putin handshake photo and the Russian bank loan: in the debate Macron tells Le Pen 'Vous dépendez du pouvoir russe'", role: "any", party: "rn", weight: 3, appeal: -0.035, momentum: -8, turn: 4 },
        { id: "debat_2022", headline: "A calmer entre-deux-tours: Le Pen survives the rematch, but loses it on points", role: "any", party: "ens", weight: 4, appeal: 0.04, momentum: 9, turn: 4 },
        { id: "melenchon_3e_tour_2022", headline: "'Élisez-moi Premier ministre': Mélenchon reframes the runoff as round one of a troisième tour, deflating {party}", role: "any", weight: 3, appeal: -0.02, momentum: -5 },
        { id: "essence_2022", headline: "Pump prices spike again. Every full tank is a Le Pen leaflet, and the incumbent owns the price board", role: "any", party: "ens", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "caddie_2022", headline: "Split-screen politics: McKinsey invoices against the supermarket caddie. The cost-of-living contrast lands for the RN", role: "any", party: "rn", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "stature_ukraine_2022", headline: "War on the continent: Kyiv calls the Élysée and the commander-in-chief effect kicks in for the centre", role: "any", party: "ens", weight: 2, appeal: 0.03, momentum: 7 },
      ],
    },

    "2017": {
      id: "2017",
      year: 2017,
      label: "2017 · The Front Républicain",
      tagline: "May 7, 2017. A 39-year-old insurgent with a startup for a party against the FN's first runoff since 2002. The dam holds everywhere. The only question is by how much.",
      salience: { cost_of_living: 0.6, immigration_identity: 0.7, security: 0.6, pensions: 0.35, public_services: 0.5, europe: 0.85, unemployment: 0.6, industry: 0.55 },
      regions: {
        HDF:  { v: { ens: 0.529, rn: 0.471 }, s: { ens: 5, rn: 4 } },
        NOR:  { v: { ens: 0.630, rn: 0.370 }, s: { ens: 3, rn: 2 } },
        GE:   { v: { ens: 0.594, rn: 0.406 }, s: { ens: 5, rn: 3 } },
        BRE:  { v: { ens: 0.754, rn: 0.246 }, s: { ens: 4, rn: 1 } },
        PDL:  { v: { ens: 0.740, rn: 0.260 }, s: { ens: 4, rn: 2 } },
        IDF:  { v: { ens: 0.788, rn: 0.212 }, s: { ens: 14, rn: 4 } },
        BFC:  { v: { ens: 0.618, rn: 0.382 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.643, rn: 0.357 }, s: { ens: 3, rn: 1 } },
        NAQ:  { v: { ens: 0.683, rn: 0.317 }, s: { ens: 6, rn: 3 } },
        ARA:  { v: { ens: 0.659, rn: 0.341 }, s: { ens: 8, rn: 4 } },
        OCC:  { v: { ens: 0.636, rn: 0.364 }, s: { ens: 6, rn: 3 } },
        PACA: { v: { ens: 0.554, rn: 0.446 }, s: { ens: 4, rn: 4 } },
        COM:  { v: { ens: 0.620, rn: 0.380 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "whirlpool_2017", headline: "The Whirlpool car park: Le Pen's selfies against Macron's own turn in the crowd. Both camps claim Amiens", role: "any", weight: 3, appeal: 0.03, momentum: 8, turn: 1 },
        { id: "front_republicain_2017", headline: "The front républicain holds its nose and rallies: 'contre l'extrême droite', and so, for Macron", role: "any", party: "ens", weight: 3, appeal: 0.03, momentum: 7, turn: 2 },
        { id: "obama_2017", headline: "'En Marche!' Obama's endorsement video hands the insurgent a global-stage glow", role: "any", party: "ens", weight: 2, appeal: 0.02, momentum: 6, turn: 3 },
        { id: "debat_2017", headline: "Debate meltdown: an aggressive, fact-free entre-deux-tours. Le Pen loses the presidency on live TV", role: "any", party: "rn", weight: 4, appeal: -0.045, momentum: -12, turn: 4 },
        { id: "macronleaks_2017", headline: "#MacronLeaks dumps 36 hours before the vote. The campaign blackout blunts it, the doubt lingers", role: "any", party: "ens", weight: 3, appeal: -0.02, momentum: -6, turn: 5 },
        { id: "ni_ni_2017", headline: "'Ni-ni': Mélenchon won't say the name, and the abstention question gnaws at the centre's margin", role: "any", party: "ens", weight: 3, appeal: -0.025, momentum: -6 },
        { id: "marine_seule_2017", headline: "Le Pen steps 'above the party' for the runoff, and the de-demonized Marine plays presidential for a news cycle", role: "any", party: "rn", weight: 3, appeal: 0.025, momentum: 6 },
        { id: "colere_ouvriere_2017", headline: "Deindustrialized France seethes: shuttered factories put pouvoir d'achat on the RN's side of the ledger", role: "any", party: "rn", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "2012": {
      id: "2012",
      year: 2012,
      label: "2012 · Hollande v. Sarkozy",
      // ens = Hollande (Parti socialiste); rn = Sarkozy (UMP). A left-vs-right
      // runoff mapped onto the bundle's two slots.
      tagline: "May 6, 2012. A one-term incumbent nobody warmed to against a Socialist who promised to be normal. 'Le changement, c'est maintenant' against a crisis president. Two weeks, and a narrow win either way.",
      salience: { cost_of_living: 0.85, public_services: 0.6, europe: 0.6, security: 0.55, immigration_identity: 0.5, pensions: 0.55, unemployment: 0.8, tax: 0.6 },
      regions: {
        HDF:  { v: { ens: 0.535, rn: 0.465 }, s: { ens: 5, rn: 4 } },
        NOR:  { v: { ens: 0.515, rn: 0.485 }, s: { ens: 3, rn: 2 } },
        GE:   { v: { ens: 0.455, rn: 0.545 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.565, rn: 0.435 }, s: { ens: 3, rn: 2 } },
        PDL:  { v: { ens: 0.515, rn: 0.485 }, s: { ens: 3, rn: 3 } },
        IDF:  { v: { ens: 0.555, rn: 0.445 }, s: { ens: 10, rn: 8 } },
        BFC:  { v: { ens: 0.515, rn: 0.485 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.505, rn: 0.495 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.565, rn: 0.435 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.490, rn: 0.510 }, s: { ens: 6, rn: 6 } },
        OCC:  { v: { ens: 0.560, rn: 0.440 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.430, rn: 0.570 }, s: { ens: 3, rn: 5 } },
        COM:  { v: { ens: 0.580, rn: 0.420 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "crise_2012", headline: "The euro crisis is the backdrop to everything: austerity, unemployment past three million, and {party} owns five years of it", role: "any", party: "rn", weight: 3, appeal: -0.03, momentum: -7, turn: 0 },
        { id: "president_normal_2012", headline: "'Moi, président de la République': the 'normal president' anaphora lands the debate for {party}", role: "any", party: "ens", weight: 4, appeal: 0.035, momentum: 9, turn: 4 },
        { id: "front_national_2012", headline: "'Ni Sarkozy': after a record far-right first round, Le Pen's voters won't be told where to go, and the right finalist's {party} can't bank them all", role: "any", party: "rn", weight: 3, appeal: -0.025, momentum: -6, turn: 3 },
        { id: "changement_maintenant_2012", headline: "'Le changement, c'est maintenant': ten years of rejection of the sitting president crystallize behind {party}", role: "any", party: "ens", weight: 3, appeal: 0.03, momentum: 7, turn: 4 },
        { id: "bayrou_ralliement_2012", headline: "Bayrou announces he will vote Hollande, and the centre's blessing nudges wavering moderates toward {party}", role: "any", party: "ens", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "meeting_droite_2012", headline: "A May Day rally at the Trocadéro and a hard pivot to the right rally the incumbent's {party} base in the final days", role: "any", party: "rn", weight: 2, appeal: 0.03, momentum: 7, turn: 3 },
      ],
    },

    "2007": {
      id: "2007",
      year: 2007,
      label: "2007 · Sarkozy v. Royal",
      // ens = Royal (Parti socialiste); rn = Sarkozy (UMP). A left-vs-right runoff mapped onto the bundle's two slots, as in 2012.
      tagline: "May 6, 2007. A former interior minister who promises a break with twelve years of Chirac against the first woman to reach a presidential runoff. Bayrou's eighteen percent has no home, Le Pen's voters are being courted openly, and one debate is the only head-to-head of the campaign.",
      salience: { cost_of_living: 0.85, security: 0.7, immigration_identity: 0.65, public_services: 0.55, europe: 0.45, pensions: 0.45, unemployment: 0.7, debt: 0.45 },
      regions: {
        HDF:  { v: { ens: 0.484, rn: 0.516 }, s: { ens: 4, rn: 5 } },
        NOR:  { v: { ens: 0.467, rn: 0.533 }, s: { ens: 2, rn: 3 } },
        GE:   { v: { ens: 0.409, rn: 0.591 }, s: { ens: 3, rn: 5 } },
        BRE:  { v: { ens: 0.526, rn: 0.474 }, s: { ens: 3, rn: 2 } },
        PDL:  { v: { ens: 0.483, rn: 0.517 }, s: { ens: 3, rn: 3 } },
        IDF:  { v: { ens: 0.475, rn: 0.525 }, s: { ens: 9, rn: 9 } },
        BFC:  { v: { ens: 0.452, rn: 0.548 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.45, rn: 0.55 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.519, rn: 0.481 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.451, rn: 0.549 }, s: { ens: 5, rn: 7 } },
        OCC:  { v: { ens: 0.498, rn: 0.502 }, s: { ens: 4, rn: 5 } },
        PACA: { v: { ens: 0.382, rn: 0.618 }, s: { ens: 3, rn: 5 } },
        COM:  { v: { ens: 0.536, rn: 0.464 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "tour_un_2007", headline: "Sarkozy tops round one by five points, and {party} needs nearly every Bayrou and left-wing voter to catch him", role: "any", party: "ens", weight: 3, appeal: -0.015, momentum: -4, turn: 0 },
        { id: "identite_nationale_2007", headline: "Sarkozy's March pledge of a Ministry of Immigration and National Identity keeps Le Pen voters in his column, and {party} collects them", role: "any", party: "rn", weight: 3, appeal: 0.03, momentum: 7, turn: 1 },
        { id: "bayrou_royal_2007", headline: "Bayrou says he will not vote for Sarkozy and talks with Royal in public. He endorses no one, but part of his vote moves to {party}", role: "any", party: "ens", weight: 3, appeal: 0.025, momentum: 7, turn: 2 },
        { id: "travailler_plus_2007", headline: "'Work more to earn more': the tax-free overtime pledge fills halls in factory towns for {party}", role: "any", party: "rn", weight: 3, appeal: 0.025, momentum: 6, turn: 3 },
        { id: "debat_colere_2007", headline: "In the entre-deux-tours debate Royal's flash of anger over disabled children's schooling lets Sarkozy play the calm one, and {party} pays", role: "any", party: "ens", weight: 4, appeal: -0.03, momentum: -8, turn: 4 },
        { id: "royal_derniere_semaine_2007", headline: "Royal warns on the final Friday that a Sarkozy win risks violence and brutality, and {party} brings out the left's last reserves", role: "any", party: "ens", weight: 3, appeal: 0.02, momentum: 5, turn: 5 },
        { id: "gare_du_nord_2007", headline: "The memory of March's Gare du Nord riot after a ticket check keeps security on the front pages, and the ground favours {party}", role: "any", party: "rn", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "royal_gaffes_2007", headline: "Royal's off-script remarks on trips abroad earlier in the campaign and the Socialist party's quarrels dent {party}'s image of competence", role: "any", party: "ens", weight: 2, appeal: -0.025, momentum: -6 },
      ],
    },

    "2002": {
      id: "2002",
      year: 2002,
      label: "2002 · Chirac v. Le Pen",
      // ens = Chirac (the outgoing president); rn = Jean-Marie Le Pen (Front National, the party that later became the Rassemblement National). The first-round shock is the opening event.
      tagline: "May 5, 2002. On April 21 Prime Minister Jospin finished third and was out, and for the first time a candidate of the Front National stands in a presidential runoff. Jean-Marie Le Pen's party wants sharply lower immigration and priority for French citizens in jobs and housing. Two weeks of street protest, a president who has to win big, and a vote that will not feel like a normal election.",
      salience: { security: 0.95, immigration_identity: 0.7, cost_of_living: 0.45, public_services: 0.4, europe: 0.35, pensions: 0.3, republic: 0.85, unemployment: 0.45, tax: 0.45 },
      regions: {
        HDF:  { v: { ens: 0.775, rn: 0.225 }, s: { ens: 7, rn: 2 } },
        NOR:  { v: { ens: 0.824, rn: 0.176 }, s: { ens: 4, rn: 1 } },
        GE:   { v: { ens: 0.787, rn: 0.213 }, s: { ens: 6, rn: 2 } },
        BRE:  { v: { ens: 0.886, rn: 0.114 }, s: { ens: 5, rn: 0 } },
        PDL:  { v: { ens: 0.877, rn: 0.123 }, s: { ens: 5, rn: 1 } },
        IDF:  { v: { ens: 0.856, rn: 0.144 }, s: { ens: 15, rn: 3 } },
        BFC:  { v: { ens: 0.805, rn: 0.195 }, s: { ens: 3, rn: 1 } },
        CVL:  { v: { ens: 0.821, rn: 0.179 }, s: { ens: 3, rn: 1 } },
        NAQ:  { v: { ens: 0.858, rn: 0.142 }, s: { ens: 8, rn: 1 } },
        ARA:  { v: { ens: 0.819, rn: 0.181 }, s: { ens: 10, rn: 2 } },
        OCC:  { v: { ens: 0.803, rn: 0.197 }, s: { ens: 7, rn: 2 } },
        PACA: { v: { ens: 0.723, rn: 0.277 }, s: { ens: 6, rn: 2 } },
        COM:  { v: { ens: 0.892, rn: 0.108 }, s: { ens: 3, rn: 0 } },
      },
      events: [
        { id: "choc_21_avril_2002", headline: "Le Pen takes second place in round one, about 200,000 votes ahead of the prime minister, and the country wakes up to a runoff nobody planned for", role: "any", party: "rn", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "manifestations_2002", headline: "Protests against Le Pen fill the streets of every large city, school students lead them, and {party} is the beneficiary of the front républicain", role: "any", party: "ens", weight: 3, appeal: 0.03, momentum: 9, turn: 1 },
        { id: "jospin_retrait_2002", headline: "Jospin retires from politics on election night. The Socialists, Greens and Communists tell their voters to back Chirac, and {party} gains the left's votes", role: "any", party: "ens", weight: 3, appeal: 0.035, momentum: 9, turn: 0 },
        { id: "refus_debat_2002", headline: "Chirac refuses a televised debate with Le Pen, and the challenger's campaign is left without its big stage. A hit to {party}", role: "any", party: "rn", weight: 3, appeal: -0.025, momentum: -6, turn: 3 },
        { id: "premier_mai_2002", headline: "May Day brings well over a million people into the streets against Le Pen, and the Front National answers with its Joan of Arc parade, a test of {party}'s turnout", role: "any", party: "rn", weight: 3, appeal: 0.01, momentum: 3, turn: 4 },
        { id: "derniere_ligne_droite_2002", headline: "Polls give Chirac a huge lead and his team fears complacency. A last push to turn out, and {party} has to keep a landslide from becoming an abstention story", role: "any", party: "ens", weight: 3, appeal: 0.015, momentum: 4, turn: 5 },
        { id: "voter_escroc_2002", headline: "Banners read 'vote for the crook, not the fascist' as left-wing voters hold their noses. The win comes with less warmth for {party}", role: "any", party: "ens", weight: 2, appeal: -0.02, momentum: -6 },
        { id: "insecurite_2002", headline: "Crime reports have led the news for weeks, and the debate stays on the ground where {party} is strongest", role: "any", party: "rn", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "1995": {
      id: "1995",
      year: 1995,
      label: "1995 · Chirac v. Jospin",
      // ens = Jospin (Parti socialiste); rn = Chirac (RPR). A left-vs-right runoff mapped onto the bundle's two slots, as in 2012.
      tagline: "May 7, 1995. Mitterrand is leaving after fourteen years. The right split between Chirac and his own prime minister Balladur, and the Socialist Jospin topped round one with a party that expected to lose. Chirac, on his third try, promises to heal the 'social fracture'. Jospin promises to keep what worked under Mitterrand and drop the rest.",
      salience: { public_services: 0.7, cost_of_living: 0.8, security: 0.5, immigration_identity: 0.45, europe: 0.45, pensions: 0.4, unemployment: 0.85, social_fracture: 0.8, integrity: 0.45 },
      regions: {
        HDF:  { v: { ens: 0.541, rn: 0.459 }, s: { ens: 5, rn: 4 } },
        NOR:  { v: { ens: 0.483, rn: 0.517 }, s: { ens: 2, rn: 3 } },
        GE:   { v: { ens: 0.466, rn: 0.534 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.496, rn: 0.504 }, s: { ens: 2, rn: 3 } },
        PDL:  { v: { ens: 0.457, rn: 0.543 }, s: { ens: 3, rn: 3 } },
        IDF:  { v: { ens: 0.439, rn: 0.561 }, s: { ens: 8, rn: 10 } },
        BFC:  { v: { ens: 0.485, rn: 0.515 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.474, rn: 0.526 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.491, rn: 0.509 }, s: { ens: 4, rn: 5 } },
        ARA:  { v: { ens: 0.45, rn: 0.55 }, s: { ens: 5, rn: 7 } },
        OCC:  { v: { ens: 0.508, rn: 0.492 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.414, rn: 0.586 }, s: { ens: 3, rn: 5 } },
        COM:  { v: { ens: 0.528, rn: 0.472 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "tour_un_1995", headline: "Jospin tops round one at 23.3 percent. The Socialists' surprise opens a real contest, and {party} has momentum it did not expect", role: "any", party: "ens", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "balladur_ralliement_1995", headline: "Balladur, eliminated in round one, backs Chirac, and the right closes ranks behind {party}", role: "any", party: "rn", weight: 3, appeal: 0.03, momentum: 8, turn: 1 },
        { id: "fracture_sociale_1995", headline: "Chirac's 'social fracture' theme wins workers and young voters the right had not reached, and {party} gains", role: "any", party: "rn", weight: 3, appeal: 0.025, momentum: 6, turn: 2 },
        { id: "inventaire_1995", headline: "Jospin's 'right of inventory' on the Mitterrand years, declared before round one, still annoys the party's loyalists and reassures independents. {party} gains in the centre", role: "any", party: "ens", weight: 3, appeal: 0.02, momentum: 5, turn: 3 },
        { id: "debat_1995", headline: "A courteous debate with little tension. The line that lingers is Jospin's 'better five years with Jospin than seven with Chirac', and {party} still needs a swing", role: "any", party: "ens", weight: 4, appeal: 0.01, momentum: 2, turn: 4 },
        { id: "le_pen_pas_de_consigne_1995", headline: "Le Pen, fourth with 15 percent, refuses to endorse either finalist, and much of his vote drifts to {party} or stays home", role: "any", party: "rn", weight: 3, appeal: 0.015, momentum: 4, turn: 5 },
        { id: "troisieme_essai_1995", headline: "A third run for the presidency: Chirac has lost before, and a campaign built on 'now or never' energises {party}", role: "any", party: "rn", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "chomage_1995", headline: "Unemployment above three million and fatigue after fourteen years of Mitterrand weigh on {party}", role: "any", party: "ens", weight: 2, appeal: -0.025, momentum: -6 },
        { id: "balladur_rancune_1995", headline: "The bitter first-round fight with Balladur leaves some of the right cool on Chirac, and some of its vote may stay home. A drag on {party}", role: "any", party: "rn", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "1988": {
      id: "1988",
      year: 1988,
      label: "1988 · Mitterrand v. Chirac",
      // ens = Mitterrand (the incumbent Socialist president); rn = Chirac (RPR, the sitting prime minister under cohabitation). A left-vs-right runoff mapped onto the bundle's two slots, as in 2012.
      tagline: "May 8, 1988. Two years of cohabitation have left a Socialist president facing his own prime minister. Mitterrand runs above the parties with a letter to all the French; Chirac has a government record to defend and a rival on his own right. Le Pen's best score yet makes his voters the swing bloc.",
      salience: { cost_of_living: 0.8, public_services: 0.55, security: 0.6, immigration_identity: 0.55, pensions: 0.4, europe: 0.35, unemployment: 0.8, ownership: 0.55, tax: 0.5 },
      regions: {
        HDF:  { v: { ens: 0.614, rn: 0.386 }, s: { ens: 6, rn: 3 } },
        NOR:  { v: { ens: 0.56, rn: 0.44 }, s: { ens: 3, rn: 2 } },
        GE:   { v: { ens: 0.537, rn: 0.463 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.551, rn: 0.449 }, s: { ens: 3, rn: 2 } },
        PDL:  { v: { ens: 0.518, rn: 0.482 }, s: { ens: 3, rn: 3 } },
        IDF:  { v: { ens: 0.517, rn: 0.483 }, s: { ens: 9, rn: 9 } },
        BFC:  { v: { ens: 0.55, rn: 0.45 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.548, rn: 0.452 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.557, rn: 0.443 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.512, rn: 0.488 }, s: { ens: 6, rn: 6 } },
        OCC:  { v: { ens: 0.56, rn: 0.44 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.469, rn: 0.531 }, s: { ens: 4, rn: 4 } },
        COM:  { v: { ens: 0.559, rn: 0.441 }, s: { ens: 2, rn: 1 } },
      },
      events: [
        { id: "lettre_france_unie_1988", headline: "Mitterrand's 'Letter to all the French' and a campaign above the parties promise a 'united France', and {party} looks presidential", role: "any", party: "ens", weight: 3, appeal: 0.025, momentum: 6, turn: 0 },
        { id: "le_pen_record_1988", headline: "Le Pen takes 14.4 percent in round one, a record for the Front National, and {party} courts his voters without striking a deal", role: "any", party: "rn", weight: 3, appeal: 0.02, momentum: 5, turn: 1 },
        { id: "barre_ralliement_1988", headline: "Barre, eliminated, backs Chirac without warmth, and the centre's voters stay unsure about {party}", role: "any", party: "rn", weight: 3, appeal: 0.01, momentum: 2, turn: 2 },
        { id: "debat_premier_ministre_1988", headline: "In the debate Chirac says they are equal candidates, and Mitterrand answers 'you are quite right, Prime Minister'. The line sticks to {party}", role: "any", party: "rn", weight: 4, appeal: -0.03, momentum: -8, turn: 3 },
        { id: "otages_liban_1988", headline: "The last French hostages in Lebanon come home days before the vote, and {party}'s government takes the credit", role: "any", party: "rn", weight: 3, appeal: 0.025, momentum: 6, turn: 4 },
        { id: "ouvea_1988", headline: "The assault on the Ouvéa cave in New Caledonia ends in 21 deaths three days before the vote, and the questions land on {party}", role: "any", party: "rn", weight: 3, appeal: -0.025, momentum: -6, turn: 5 },
        { id: "cohabitation_usure_1988", headline: "Two years of cohabitation leave voters tired of the quarrel, and they reward the president who stayed above it, {party}", role: "any", party: "ens", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "pcf_effondrement_1988", headline: "The Communist vote falls to 6.8 percent in round one, its worst score ever, and its voters line up behind {party} for the runoff", role: "any", party: "ens", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "privatisations_1988", headline: "The privatisation programme and the 1987 stock market crash leave small savers angry, and {party} carries the bill", role: "any", party: "rn", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "1981": {
      id: "1981",
      year: 1981,
      label: "1981 · Mitterrand v. Giscard",
      // ens = Mitterrand (the Socialist challenger); rn = Giscard d'Estaing (the incumbent president). A left-vs-right runoff mapped onto the bundle's two slots, as in 2012.
      tagline: "May 10, 1981. Twenty-three years of the right, a second oil shock and more than a million and a half people out of work. Giscard, elected at 48, asks for a second term against the Socialist he beat by 1.6 points in 1974. Chirac's voters hold the key, and the Communists have not yet said what theirs will do.",
      salience: { cost_of_living: 0.85, public_services: 0.5, security: 0.5, pensions: 0.4, immigration_identity: 0.4, europe: 0.3, unemployment: 0.85, ownership: 0.6, integrity: 0.45 },
      regions: {
        HDF:  { v: { ens: 0.561, rn: 0.439 }, s: { ens: 5, rn: 4 } },
        NOR:  { v: { ens: 0.504, rn: 0.496 }, s: { ens: 3, rn: 2 } },
        GE:   { v: { ens: 0.47, rn: 0.53 }, s: { ens: 4, rn: 4 } },
        BRE:  { v: { ens: 0.489, rn: 0.511 }, s: { ens: 2, rn: 3 } },
        PDL:  { v: { ens: 0.457, rn: 0.543 }, s: { ens: 3, rn: 3 } },
        IDF:  { v: { ens: 0.532, rn: 0.468 }, s: { ens: 10, rn: 8 } },
        BFC:  { v: { ens: 0.536, rn: 0.464 }, s: { ens: 2, rn: 2 } },
        CVL:  { v: { ens: 0.508, rn: 0.492 }, s: { ens: 2, rn: 2 } },
        NAQ:  { v: { ens: 0.555, rn: 0.445 }, s: { ens: 5, rn: 4 } },
        ARA:  { v: { ens: 0.51, rn: 0.49 }, s: { ens: 6, rn: 6 } },
        OCC:  { v: { ens: 0.575, rn: 0.425 }, s: { ens: 5, rn: 4 } },
        PACA: { v: { ens: 0.517, rn: 0.483 }, s: { ens: 4, rn: 4 } },
        COM:  { v: { ens: 0.33, rn: 0.67 }, s: { ens: 1, rn: 2 } },
      },
      events: [
        { id: "cent_dix_propositions_1981", headline: "Mitterrand's 110 proposals, adopted in January, promise retirement at 60, the 39-hour week and nationalisations, and {party} has a programme to run on", role: "any", party: "ens", weight: 3, appeal: 0.025, momentum: 6, turn: 0 },
        { id: "diamants_1981", headline: "The Bokassa diamonds story follows the president through the campaign, and a Socialist poster of him with diamonds in his eyes keeps it alive. {party} pays", role: "any", party: "rn", weight: 3, appeal: -0.03, momentum: -7, turn: 1 },
        { id: "chirac_titre_personnel_1981", headline: "Chirac says he will vote for Giscard 'in a personal capacity' and tells no one else what to do, and part of the Gaullist vote stays home on {party}'s account", role: "any", party: "rn", weight: 3, appeal: -0.02, momentum: -5, turn: 2 },
        { id: "pcf_battre_giscard_1981", headline: "The Communist Party, at 15 percent in round one, tells its voters to beat Giscard, and the left's vote consolidates behind {party}", role: "any", party: "ens", weight: 3, appeal: 0.03, momentum: 8, turn: 1 },
        { id: "debat_passif_1981", headline: "In the debate Mitterrand answers Giscard's old 'man of the past' refrain with 'you have become the man of the liabilities'. {party} lands the blow", role: "any", party: "ens", weight: 4, appeal: 0.03, momentum: 9, turn: 4 },
        { id: "peur_communistes_1981", headline: "Warnings of Communist ministers in a Mitterrand cabinet rally the right's base in the last week for {party}", role: "any", party: "rn", weight: 3, appeal: 0.02, momentum: 5, turn: 5 },
        { id: "bilan_septennat_1981", headline: "Unemployment near a million and three quarters and inflation above 13 percent weigh on {party}", role: "any", party: "rn", weight: 2, appeal: -0.03, momentum: -7 },
        { id: "force_tranquille_1981", headline: "'La force tranquille' and a poster of a village church reassure rural voters, and {party} reaches the countryside", role: "any", party: "ens", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "querelle_droite_1981", headline: "The feud between Giscard and Chirac, open since Chirac quit as prime minister in 1976, shows in every right-wing rally, and {party} pays for it", role: "any", party: "rn", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },
  },

  leaders: {
    "2027": {
      ens: { partyId: "ens", name: "Édouard Philippe", charisma: 58, energy: 62, competence: 76, machine: 70 },
      rn:  { partyId: "rn", name: "Jordan Bardella", charisma: 72, energy: 74, competence: 52, machine: 66 },
    },
    // 2022: the incumbent technocrat vs the softened, better-drilled challenger.
    "2022": {
      ens: { partyId: "ens", name: "Emmanuel Macron", charisma: 64, energy: 62, competence: 78, machine: 76 },
      rn:  { partyId: "rn", name: "Marine Le Pen", charisma: 62, energy: 66, competence: 60, machine: 62 },
    },
    // 2017: the insurgent with a startup machine vs the meltdown-debate Le Pen.
    "2017": {
      ens: { partyId: "ens", name: "Emmanuel Macron", charisma: 74, energy: 80, competence: 70, machine: 52 },
      rn:  { partyId: "rn", name: "Marine Le Pen", charisma: 60, energy: 64, competence: 36, machine: 58 },
    },
    // 2012: ens = the Socialist challenger, rn = the incumbent of the right.
    "2012": {
      ens: { partyId: "ens", name: "François Hollande", charisma: 54, energy: 60, competence: 64, machine: 68 },
      rn:  { partyId: "rn", name: "Nicolas Sarkozy", charisma: 66, energy: 74, competence: 66, machine: 74 },
    },
    "2007": {
      ens: { partyId: "ens", name: "Ségolène Royal", charisma: 70, energy: 74, competence: 52, machine: 56 },
      rn: { partyId: "rn", name: "Nicolas Sarkozy", charisma: 72, energy: 88, competence: 68, machine: 84 },
    },
    "2002": {
      ens: { partyId: "ens", name: "Jacques Chirac", charisma: 62, energy: 58, competence: 66, machine: 80 },
      rn: { partyId: "rn", name: "Jean-Marie Le Pen", charisma: 72, energy: 70, competence: 34, machine: 56 },
    },
    "1995": {
      ens: { partyId: "ens", name: "Lionel Jospin", charisma: 46, energy: 58, competence: 78, machine: 66 },
      rn: { partyId: "rn", name: "Jacques Chirac", charisma: 66, energy: 80, competence: 62, machine: 76 },
    },
    "1988": {
      ens: { partyId: "ens", name: "François Mitterrand", charisma: 82, energy: 56, competence: 86, machine: 86 },
      rn: { partyId: "rn", name: "Jacques Chirac", charisma: 62, energy: 78, competence: 64, machine: 80 },
    },
    "1981": {
      ens: { partyId: "ens", name: "François Mitterrand", charisma: 74, energy: 62, competence: 78, machine: 78 },
      rn: { partyId: "rn", name: "Valéry Giscard d'Estaing", charisma: 56, energy: 52, competence: 76, machine: 70 },
    },
  },

  events: [
    { id: "debat_entre_deux", headline: "{party}'s candidate wins the entre-deux-tours debate", role: "any", weight: 4, appeal: 0.035, momentum: 12 },
    { id: "front_republicain", headline: "The front républicain stirs, and eliminated candidates' voters break for {party}", role: "any", weight: 3, appeal: 0.03, momentum: 8 },
    { id: "derapage", headline: "A dérapage: an ugly remark from a {party} surrogate dominates the cycle", role: "any", weight: 3, appeal: -0.035, momentum: -9 },
    { id: "prix_essence", headline: "A fuel-price spike lands hardest on {party}", role: "leader", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "securite_incident", headline: "A security incident pushes the campaign onto {party}'s ground", role: "any", weight: 2, appeal: 0.03, momentum: 7 },
    { id: "abstention_alarm", headline: "Abstention warnings mobilize {party}'s ground game", role: "player", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "presse_ralliement", headline: "A wave of editorials rallies to {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "meeting_geant", headline: "A packed stadium meeting electrifies {party}", role: "player", weight: 2, appeal: 0.025, momentum: 9 },
    {
      id: "debat_call",
      headline: "The networks offer {party} a debate slot",
      role: "player",
      weight: 4,
      prompt: "A head-to-head is on the table. How do you play it?",
      choices: [
        { id: "accept_attack", text: "Accept and go on the attack", resultText: "You land blows and take a few. The overnight polls twitch your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
        { id: "accept_safe", text: "Accept and play it safe", resultText: "A steady, on-message night. No gaffes, no fireworks.", appeal: 0.015, momentum: 4 },
        { id: "decline", text: "Decline: protect the lead, avoid the ambush", resultText: "You dodge the studio lights. The press calls it caution.", appeal: -0.01, momentum: -4 },
      ],
    },
    {
      id: "front_fork",
      headline: "{party} must decide how hard to lean on the front républicain",
      role: "player",
      weight: 3,
      prompt: "The runoff arithmetic is everything. What's the play?",
      choices: [
        { id: "court_centre", text: "Court the centre: soft tone, broad tent", resultText: "Moderates warm up. Your base yawns.", appeal: 0.02, momentum: 5 },
        { id: "base_first", text: "Base first: turn out your own", resultText: "The faithful roar. The centre looks away.", appeal: 0.025, momentum: 8 },
        { id: "contrast", text: "Make it a contrast night against the rival", resultText: "You define them, and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
      ],
    },
    {
      id: "programme_fork",
      headline: "{party}'s programme committee is split on the big pledge",
      role: "player",
      weight: 3,
      prompt: "The draft is ready. Which way do you push?",
      choices: [
        { id: "bold", text: "Go bold with a defining, risky pledge", resultText: "The base roars. The spreadsheets at HQ look nervous.", appeal: 0.035, momentum: 12 },
        { id: "cautious", text: "Play it cautious: no hostages to fortune", resultText: "No spark, no self-inflicted wounds.", appeal: 0.01, momentum: 2 },
        { id: "contrast", text: "Make it a contrast document against the rival", resultText: "You define them more than yourself, and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
      ],
    },
  ],
};
attachElectionIssues(FRANCE, FR_ELECTION_ISSUES);

// Registry rows, store pack, daily pairing and "play next" chain.
export const FRANCE_MODULE = countryModule(FRANCE, {
  blurb: "The two-round runoff for the Élysée.",
  cover: "images/covers/country-fr.jpg",
  art: { a: "#142a59", b: "#a82b42", glow: "rgba(245,245,245,0.18)" },
  freeElections: ["2022"],
  scenarios: [
    { electionId: "2027", label: "2027 · The Republic's runoff", difficulty: "easy",
      description: "Macron is term-limited. The centre defends the Élysée against the RN in a two-round fight for France." },
    { electionId: "2022", difficulty: "hard",
      description: "The rematch. Pouvoir d'achat against the front républicain, and a far narrower runoff than last time." },
    { electionId: "2017", label: "2017 · Macron v. Le Pen", difficulty: "hard",
      description: "A 39-year-old insurgent, a movement a year old, and the debate meltdown that sealed a landslide." },
    { electionId: "2012", difficulty: "hard",
      description: "A crisis president nobody warmed to against the man who promised to be normal. A left-right runoff decided by a whisker." },
    { electionId: "2007", difficulty: "hard", addedLater: true,
      description: "A break with twelve years of Chirac against the first woman in a presidential runoff. Bayrou's voters and Le Pen's voters decide a left-right fight." },
    { electionId: "2002", difficulty: "hard", addedLater: true,
      description: "Jospin is eliminated and Le Pen reaches the runoff for the first time. Chirac has to win by a margin that counts, with the whole country watching." },
    { electionId: "1995", difficulty: "medium", addedLater: true,
      description: "Chirac on his third try against a Socialist who topped round one. The social fracture, the Mitterrand inheritance and a narrow left-right runoff." },
    { electionId: "1988", difficulty: "hard", addedLater: true,
      description: "A Socialist president against his own prime minister, two years into cohabitation. Le Pen's voters are the swing bloc, and the last week brings the hostages and Ouvéa." },
    { electionId: "1981", difficulty: "hard", addedLater: true,
      description: "The first left victory of the Fifth Republic is on the table. Mitterrand against an incumbent, with Chirac's cold endorsement and the Communist vote deciding it." },
  ],
  systemLabel: "Two-round presidential runoff",
  setupNote: "Campaign clock: six planning weeks compress the historical two-week runoff.",
  pack: {
    id: "france",
    name: "France",
    description: "Nine presidential elections from 1981 to 2027. Two rounds, a crowded first ballot, and a runoff decided by who the losers back.",
    price: 99,
  },
  daily: { pair: ["ens", "rn"], names: { ens: "Ensemble", rn: "the RN" } },
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
});
