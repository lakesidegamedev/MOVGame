// MEXICO: five presidential elections, one bundle.
//
// Mexico elects its president for a single six-year term in one round by
// national plurality: the candidate with the most votes wins, with no
// threshold and no runoff. The bundle uses the engine's plurality rule
// (`plurality: true`): the unit is the point, 100 points are split by valid
// votes, and the candidate with the most points wins outright. There are no
// coalitions to form. Party alliances are electoral tickets and live in the
// party names and taglines.
//
// Party slots. `pan` is the National Action Party's candidate every time:
// Fox (2000, with the Greens as the Alliance for Change), Calderón (2006),
// Vázquez Mota (2012), Anaya (2018, Por México al Frente with the PRD and
// Movimiento Ciudadano) and Gálvez (2024, Fuerza y Corazón por México with the
// PRI and the PRD). `pri` is the PRI's candidate from 2000 to 2018: Labastida,
// Madrazo (with the Greens), Peña Nieto (with the Greens) and Meade (with the
// Greens and Nueva Alianza). In 2024 the PRI backed Gálvez and has no slot.
// `izq` is the left's candidate: Cárdenas (2000, Alliance for Mexico around the
// PRD), López Obrador for the PRD-led coalitions (2006 and 2012) and for
// Morena (2018), then Sheinbaum for Morena, the PT and the Greens (2024). The
// slot is named for the lineage, as Japan's DPJ/CDP is. `mc` is Movimiento
// Ciudadano standing alone in 2024 (Álvarez Máynez). `oth` folds in the minor
// candidates: Rincón Gallardo, Camacho and Muñoz Ledo (2000), Mercado and
// Campa (2006), Quadri (2012) and the independent Rodríguez Calderón (2018).
//
// Regions. The 32 federal entities are grouped into eleven regions. The State
// of Mexico, Mexico City and Veracruz stand alone. The rest are contiguous
// groups: NW (Baja California, Baja California Sur, Sonora, Sinaloa), NOR
// (Chihuahua, Coahuila, Durango, Zacatecas), NE (Nuevo León, Tamaulipas, San
// Luis Potosí), WES (Jalisco, Nayarit, Colima, Aguascalientes), BAJ
// (Guanajuato, Querétaro), CEN (Puebla, Hidalgo, Tlaxcala, Morelos), SUR
// (Michoacán, Guerrero, Oaxaca, Chiapas) and PEN (Tabasco, Campeche, Yucatán,
// Quintana Roo).
//
// Sources and method. State results are the official counts (IFE for 2000,
// 2006 and 2012, INE for 2018 and 2024) as tabulated state by state on the
// English and Spanish Wikipedia election pages. Each state column sums to the
// published national figure to within 0.01 percent; the small gaps are votes
// cast abroad and rounding in the source tables. Valid votes are the votes for
// registered candidates (blank, spoiled and write-in ballots excluded).
// Regional `v` is each slot's share of the region's valid votes. Points (`s`)
// are apportioned biproportionally: 100 points go to the candidates by
// national valid votes (largest remainder), 100 points go to the regions by
// regional valid votes, and the table is fitted so rows sum to the regional
// pools and columns to the national points. The national points order
// therefore matches the real vote, including the 2006 near tie. `electorate`
// is each region's average valid vote over the five elections, in thousands,
// so the engine's national share tracks every election to within about 0.4
// points.
//
// National results (share of valid votes, then points):
// 2024 (2 June): Sheinbaum 61.27, Gálvez 28.15, Álvarez Máynez 10.58.
//   Points 61, 28, 11.
// 2018 (1 July): López Obrador 54.78, Anaya 22.94, Meade 16.90,
//   Rodríguez Calderón 5.39. Points 55, 23, 17, 5.
// 2012 (1 July): Peña Nieto 39.19, López Obrador 32.42, Vázquez Mota 26.04,
//   Quadri 2.34. Points 39, 33, 26, 2.
// 2006 (2 July): Calderón 36.96, López Obrador 36.36, Madrazo 22.92, others
//   3.77. Points 37, 36, 23, 4. Calderón's lead was 243,934 votes, 0.58
//   points of all votes cast.
// 2000 (2 July): Fox 43.48, Labastida 36.91, Cárdenas 17.01, others 2.60.
//   Points 43, 37, 17, 3. The first defeat of the PRI in 71 years.

import type { CountryBundle } from "@engine/countryGame";
import { attachElectionIssues, countryModule } from "./types";
import { MX_ELECTION_ISSUES } from "./issues/mx";
import { MX_MAP } from "./paths/mx";

export const MEXICO: CountryBundle = {
  id: "MX",
  label: "Mexico",
  flag: "🇲🇽",
  currency: "MX$",
  unitName: "point",
  unitNamePlural: "points",
  goalText: "Most of 100 presidency points",
  defaultSeatElasticity: 1.0,
  eventChance: 0.75,
  map: MX_MAP,

  system: {
    id: "MX",
    label: "Mexico",
    parties: [
      { id: "pan", name: "National Action Party (PAN) and allies", shortName: "PAN", color: "#0b4ea2" },
      { id: "pri", name: "Institutional Revolutionary Party (PRI)", shortName: "PRI", color: "#1b8a3c" },
      { id: "izq", name: "PRD/Morena left", shortName: "PRD/Morena", color: "#8b1d3b" },
      { id: "mc", name: "Citizens' Movement (MC)", shortName: "MC", color: "#f27c00" },
      { id: "oth", name: "Others (minor candidates, independents)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Single-round presidential plurality (points by region)", unit: "point" },
    // The threshold is kept for reference only: under plurality the candidate
    // with the most points wins, whatever the share.
    majority: { total: 100, threshold: 51 },
  },
  playable: ["pan", "izq", "pri", "mc"],
  abstaining: [],
  // One round, one winner: no coalitions.
  coalitions: { none: true },
  governmentText: {
    majority: "{party} wins the presidency with {seats} points.",
  },
  plurality: true,
  goalHint: "Finish first. The candidate with the most of the {total} presidency points wins outright: there is no second round and no share you must reach. National broadcasts reach the whole country, and regional pushes win the points a region holds.",

  issues: [
    { id: "security", name: "Crime and security", blurb: "Cartel violence, kidnappings, the army on the streets and who answers for the dead." },
    { id: "economy_jobs", name: "Jobs and wages", blurb: "Wages, prices, informal work and whether the factories keep hiring." },
    { id: "corruption", name: "Corruption", blurb: "Governors who stole, contracts for friends and who goes to jail." },
    { id: "poverty", name: "Poverty and social programmes", blurb: "Cash transfers, pensions for the elderly and the forgotten south." },
    { id: "energy", name: "Pemex and energy", blurb: "Oil, electricity and how much private money the state lets in." },
    { id: "democracy", name: "Democracy and the vote", blurb: "Clean elections, the electoral institute and the end of one-party rule." },
    { id: "us_relations", name: "Trade, migration and the United States", blurb: "NAFTA, remittances, the border and the president in Washington." },
  ],

  blocs: [
    { id: "north_middle", name: "Northern and urban middle class", share: 0.18, turnoutPropensity: 0.74,
      tilt: { pan: 0.45, izq: -0.35, pri: -0.05, mc: 0.25 } },
    { id: "catholic", name: "Practising Catholic voters", share: 0.12, turnoutPropensity: 0.78,
      tilt: { pan: 0.6, izq: -0.45, pri: 0.05 } },
    { id: "urban_working", name: "Urban working class", share: 0.22, turnoutPropensity: 0.64,
      tilt: { izq: 0.45, pan: -0.2, pri: -0.15 } },
    { id: "rural_south", name: "Rural and indigenous south", share: 0.14, turnoutPropensity: 0.6,
      tilt: { izq: 0.35, pri: 0.3, pan: -0.6, mc: -0.3 } },
    { id: "pri_loyal", name: "Unions, ejidos and PRI loyalists", share: 0.1, turnoutPropensity: 0.82,
      tilt: { pri: 0.85, izq: -0.25, pan: -0.4 } },
    { id: "young", name: "Young voters (18 to 29)", share: 0.16, turnoutPropensity: 0.5,
      tilt: { mc: 0.55, izq: 0.1, pri: -0.45, pan: -0.05 } },
    { id: "welfare", name: "Pensioners and welfare recipients", share: 0.1, turnoutPropensity: 0.8,
      tilt: { izq: 0.45, pri: 0.2, pan: -0.25 } },
  ],

  // `seats` is the 2024 pool; each election's `s` sets its own. `electorate`
  // is the region's average valid vote over the five elections, in thousands.
  regions: [
    { id: "NW", name: "Baja California, Sonora & Sinaloa", abbr: "Northwest", seats: 7, electorate: 3564, tile: { row: 0, col: 0 },
      profile: { north_middle: 1.3, young: 1.1, rural_south: 0.4, catholic: 0.7 } },
    { id: "NOR", name: "Chihuahua, Coahuila, Durango & Zacatecas", abbr: "North", seats: 8, electorate: 3735, tile: { row: 0, col: 1 },
      profile: { north_middle: 1.3, pri_loyal: 1.3, rural_south: 0.5, urban_working: 0.8 } },
    { id: "NE", name: "Nuevo León, Tamaulipas & San Luis Potosí", abbr: "Northeast", seats: 9, electorate: 4400, tile: { row: 0, col: 2 },
      profile: { north_middle: 1.5, young: 1.1, rural_south: 0.5, catholic: 1.0 } },
    { id: "WES", name: "Jalisco, Nayarit, Colima & Aguascalientes", abbr: "West", seats: 9, electorate: 4390, tile: { row: 1, col: 0 },
      profile: { catholic: 1.5, north_middle: 1.1, young: 1.2, rural_south: 0.5 } },
    { id: "BAJ", name: "Guanajuato & Querétaro", abbr: "Bajío", seats: 7, electorate: 3017, tile: { row: 1, col: 1 },
      profile: { catholic: 2.0, north_middle: 1.0, urban_working: 0.7, welfare: 0.8 } },
    { id: "MEX", name: "State of Mexico", abbr: "Edomex", seats: 14, electorate: 6685, tile: { row: 1, col: 2 },
      profile: { urban_working: 1.5, pri_loyal: 1.2, welfare: 1.0, catholic: 0.7 } },
    { id: "VER", name: "Veracruz", abbr: "Veracruz", seats: 6, electorate: 3249, tile: { row: 1, col: 3 },
      profile: { rural_south: 1.3, pri_loyal: 1.2, welfare: 1.1, north_middle: 0.6 } },
    { id: "SUR", name: "Michoacán, Guerrero, Oaxaca & Chiapas", abbr: "Pacific South", seats: 13, electorate: 6236, tile: { row: 2, col: 1 },
      profile: { rural_south: 2.2, welfare: 1.3, north_middle: 0.4, catholic: 0.7 } },
    { id: "CDMX", name: "Mexico City", abbr: "CDMX", seats: 10, electorate: 4928, tile: { row: 2, col: 2 },
      profile: { urban_working: 1.6, young: 1.2, north_middle: 1.0, catholic: 0.5, rural_south: 0.1 } },
    { id: "CEN", name: "Puebla, Hidalgo, Tlaxcala & Morelos", abbr: "Centre", seats: 11, electorate: 4915, tile: { row: 2, col: 3 },
      profile: { urban_working: 1.1, rural_south: 1.1, pri_loyal: 1.1, catholic: 1.0 } },
    { id: "PEN", name: "Tabasco, Campeche, Yucatán & Quintana Roo", abbr: "Yucatán", seats: 6, electorate: 2853, tile: { row: 2, col: 4 },
      profile: { welfare: 1.3, rural_south: 1.1, pri_loyal: 1.0, north_middle: 0.8 } },
  ],

  elections: {
    "2024": {
      id: "2024",
      year: 2024,
      label: "2024 · Sheinbaum v. Gálvez",
      tagline: "June 2, 2024. López Obrador cannot run again, his approval is near 60 percent, and his chosen successor carries Morena, the PT and the Greens. The PAN, the PRI and the PRD, old enemies, unite behind Xóchitl Gálvez. Movimiento Ciudadano runs alone and courts the young.",
      salience: { poverty: 0.9, security: 0.85, corruption: 0.6, economy_jobs: 0.6, democracy: 0.55, energy: 0.35, us_relations: 0.3, health: 0.5 },
      regions: {
        NW:   { v: { izq: 0.665, pan: 0.243, mc: 0.092 }, s: { izq: 4, pan: 2, mc: 1 } },
        NOR:  { v: { izq: 0.553, pan: 0.355, mc: 0.092 }, s: { izq: 4, pan: 3, mc: 1 } },
        NE:   { v: { izq: 0.553, pan: 0.307, mc: 0.141 }, s: { izq: 5, pan: 3, mc: 1 } },
        WES:  { v: { izq: 0.479, pan: 0.360, mc: 0.161 }, s: { izq: 5, pan: 3, mc: 1 } },
        BAJ:  { v: { izq: 0.495, pan: 0.400, mc: 0.105 }, s: { izq: 3, pan: 3, mc: 1 } },
        MEX:  { v: { izq: 0.620, pan: 0.271, mc: 0.109 }, s: { izq: 9, pan: 4, mc: 1 } },
        CDMX: { v: { izq: 0.563, pan: 0.352, mc: 0.085 }, s: { izq: 6, pan: 3, mc: 1 } },
        CEN:  { v: { izq: 0.677, pan: 0.210, mc: 0.113 }, s: { izq: 8, pan: 2, mc: 1 } },
        VER:  { v: { izq: 0.681, pan: 0.236, mc: 0.083 }, s: { izq: 4, pan: 1, mc: 1 } },
        SUR:  { v: { izq: 0.709, pan: 0.206, mc: 0.085 }, s: { izq: 9, pan: 3, mc: 1 } },
        PEN:  { v: { izq: 0.712, pan: 0.201, mc: 0.087 }, s: { izq: 4, pan: 1, mc: 1 } },
      },
      events: [
        { id: "heir_2024", headline: "Sheinbaum, López Obrador's chosen successor, opens the campaign with his approval near 60 percent, and {party} starts far ahead", role: "any", party: "izq", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "xochitl_2024", headline: "Xóchitl Gálvez, the senator who sold gelatin as a girl, became the opposition's candidate after the president attacked her from his morning press conference. {party} has a story to tell", role: "any", party: "pan", weight: 3, appeal: 0.015, momentum: 5, turn: 1 },
        { id: "debate1_2024", headline: "The first debate, April 7: Gálvez attacks, Sheinbaum stays calm, and {party} leaves with its lead intact", role: "any", party: "izq", weight: 3, appeal: 0.01, momentum: 4, turn: 2 },
        { id: "marea_rosa_2024", headline: "The Pink Tide fills the Zócalo for Gálvez on May 19, and {party} shows it can still draw a crowd", role: "any", party: "pan", weight: 3, appeal: 0.015, momentum: 6, turn: 3 },
        { id: "san_pedro_2024", headline: "A stage collapses in a gust of wind at a Movimiento Ciudadano rally in San Pedro Garza García on May 22, killing nine people. {party} suspends its campaign events", role: "any", party: "mc", weight: 3, appeal: -0.01, momentum: -8, turn: 4 },
        { id: "pensions_2024", headline: "The pensions for the elderly reach every home in the final weeks, and {party} reminds each recipient who started them", role: "any", party: "izq", weight: 3, appeal: 0.015, momentum: 5, turn: 5 },
        { id: "maynez_young_2024", headline: "Álvarez Máynez's jingle goes viral on TikTok, and {party} gains ground among young voters", role: "any", party: "mc", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "candidates_killed_2024", headline: "Dozens of candidates for local office are murdered during the campaign, and the security record lands on {party}", role: "any", party: "izq", weight: 2, appeal: -0.015, momentum: -5 },
        { id: "prian_2024", headline: "Morena's ads call the alliance the PRIAN, the old parties back together, and {party} has to explain its partners", role: "any", party: "pan", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "2018": {
      id: "2018",
      year: 2018,
      label: "2018 · López Obrador v. Anaya",
      tagline: "July 1, 2018. López Obrador's third run, now at the head of Morena, the party he founded, with the PT and the evangelical PES. Peña Nieto's government is sunk by scandal and the gasoline price rise, and its candidate Meade is not even a party member. The PAN's Ricardo Anaya leads a left and right alliance with the PRD.",
      salience: { corruption: 0.95, security: 0.85, economy_jobs: 0.6, poverty: 0.6, us_relations: 0.45, energy: 0.4, democracy: 0.3 },
      regions: {
        NW:   { v: { izq: 0.645, pan: 0.165, pri: 0.141, oth: 0.050 }, s: { izq: 4, pan: 1, pri: 1, oth: 1 } },
        NOR:  { v: { izq: 0.462, pan: 0.254, pri: 0.216, oth: 0.067 }, s: { izq: 4, pan: 2, pri: 2 } },
        NE:   { v: { izq: 0.418, pan: 0.307, pri: 0.163, oth: 0.112 }, s: { izq: 4, pan: 3, pri: 1, oth: 1 } },
        WES:  { v: { izq: 0.463, pan: 0.315, pri: 0.156, oth: 0.066 }, s: { izq: 4, pan: 3, pri: 1, oth: 1 } },
        BAJ:  { v: { izq: 0.348, pan: 0.396, pri: 0.164, oth: 0.091 }, s: { izq: 2, pan: 2, pri: 1, oth: 1 } },
        MEX:  { v: { izq: 0.557, pan: 0.197, pri: 0.197, oth: 0.049 }, s: { izq: 8, pan: 3, pri: 3 } },
        CDMX: { v: { izq: 0.590, pan: 0.245, pri: 0.123, oth: 0.042 }, s: { izq: 5, pan: 2, pri: 1, oth: 1 } },
        CEN:  { v: { izq: 0.626, pan: 0.173, pri: 0.157, oth: 0.044 }, s: { izq: 7, pan: 2, pri: 2 } },
        VER:  { v: { izq: 0.554, pan: 0.283, pri: 0.127, oth: 0.036 }, s: { izq: 4, pan: 2, pri: 1 } },
        SUR:  { v: { izq: 0.627, pan: 0.142, pri: 0.201, oth: 0.030 }, s: { izq: 9, pan: 2, pri: 3 } },
        PEN:  { v: { izq: 0.631, pan: 0.168, pri: 0.175, oth: 0.026 }, s: { izq: 4, pan: 1, pri: 1 } },
      },
      events: [
        { id: "third_run_2018", headline: "López Obrador opens his third run with a double-digit lead and a party of his own, and {party} looks hard to stop", role: "any", party: "izq", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "anaya_pgr_2018", headline: "Federal prosecutors look into a property sale linked to Anaya, and {party} spends weeks on money laundering questions", role: "any", party: "pan", weight: 3, appeal: -0.025, momentum: -7, turn: 1 },
        { id: "gasolinazo_2018", headline: "Meade cannot shake the Peña Nieto record: the White House mansion, Odebrecht and the gasoline price rise. {party} stays stuck in third", role: "any", party: "pri", weight: 3, appeal: -0.02, momentum: -6, turn: 2 },
        { id: "debate2_2018", headline: "The second debate in Tijuana, May 20, on trade and Trump: Anaya attacks, López Obrador shrugs it off, and {party} keeps its lead", role: "any", party: "izq", weight: 3, appeal: 0.01, momentum: 4, turn: 3 },
        { id: "airport_2018", headline: "Business leaders warn against López Obrador's plan to cancel the new Mexico City airport, and {party} has to answer for it", role: "any", party: "izq", weight: 3, appeal: -0.015, momentum: -5, turn: 4 },
        { id: "azteca_2018", headline: "The last debate in Mérida barely moves the polls, and {party} closes with a full Estadio Azteca", role: "any", party: "izq", weight: 3, appeal: 0.01, momentum: 5, turn: 5 },
        { id: "bronco_2018", headline: "El Bronco proposes cutting off the hands of thieves at the first debate, and the night belongs to the front-runner", role: "any", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "voto_util_2018", headline: "Anaya and Meade each ask the other's voters for a useful vote against López Obrador, and {party} pulls some over", role: "any", party: "pan", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },

    "2012": {
      id: "2012",
      year: 2012,
      label: "2012 · Peña Nieto v. López Obrador",
      tagline: "July 1, 2012. Twelve years after losing power the PRI is back with a young former governor of the State of Mexico and the Greens. López Obrador runs again for the PRD, the PT and Movimiento Ciudadano, promising a loving republic. Josefina Vázquez Mota is the PAN's first woman candidate, carrying Calderón's drug war.",
      salience: { security: 0.9, economy_jobs: 0.75, corruption: 0.65, democracy: 0.55, poverty: 0.55, energy: 0.4, us_relations: 0.3 },
      regions: {
        NW:   { v: { pri: 0.421, izq: 0.271, pan: 0.287, oth: 0.021 }, s: { pri: 3, izq: 2, pan: 2, oth: 1 } },
        NOR:  { v: { pri: 0.463, izq: 0.223, pan: 0.285, oth: 0.029 }, s: { pri: 4, izq: 2, pan: 2 } },
        NE:   { v: { pri: 0.357, izq: 0.222, pan: 0.393, oth: 0.028 }, s: { pri: 3, izq: 2, pan: 4 } },
        WES:  { v: { pri: 0.416, izq: 0.238, pan: 0.315, oth: 0.031 }, s: { pri: 4, izq: 2, pan: 3 } },
        BAJ:  { v: { pri: 0.411, izq: 0.160, pan: 0.402, oth: 0.027 }, s: { pri: 3, izq: 1, pan: 2 } },
        MEX:  { v: { pri: 0.442, izq: 0.348, pan: 0.186, oth: 0.024 }, s: { pri: 6, izq: 5, pan: 3 } },
        CDMX: { v: { pri: 0.264, izq: 0.540, pan: 0.177, oth: 0.019 }, s: { pri: 3, izq: 5, pan: 2 } },
        CEN:  { v: { pri: 0.374, izq: 0.373, pan: 0.225, oth: 0.028 }, s: { pri: 4, izq: 4, pan: 2 } },
        VER:  { v: { pri: 0.344, izq: 0.297, pan: 0.345, oth: 0.014 }, s: { pri: 2, izq: 2, pan: 3 } },
        SUR:  { v: { pri: 0.422, izq: 0.388, pan: 0.171, oth: 0.019 }, s: { pri: 5, izq: 5, pan: 2, oth: 1 } },
        PEN:  { v: { pri: 0.373, izq: 0.386, pan: 0.227, oth: 0.014 }, s: { pri: 2, izq: 3, pan: 1 } },
      },
      events: [
        { id: "favourite_2012", headline: "Peña Nieto opens the campaign far ahead, married to a television star and on every screen, and {party} plays it safe", role: "any", party: "pri", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "empty_stands_2012", headline: "Vázquez Mota's candidacy rally at the Estadio Azul ends with the stands emptying, and {party} looks adrift", role: "any", party: "pan", weight: 3, appeal: -0.02, momentum: -6, turn: 1 },
        { id: "debate1_2012", headline: "The first debate, May 6: López Obrador goes after Peña Nieto and the PRI's return, the polls barely move, and {party} holds its base", role: "any", party: "izq", weight: 3, appeal: 0.02, momentum: 6, turn: 2 },
        { id: "ibero_2012", headline: "May 11: students at the Ibero heckle Peña Nieto over the 2006 Atenco raid, #YoSoy132 is born, and {party} takes the hit", role: "any", party: "pri", weight: 3, appeal: -0.03, momentum: -8, turn: 3 },
        { id: "guardian_2012", headline: "The Guardian publishes documents suggesting Televisa sold favourable coverage, and {party} spends the week denying it", role: "any", party: "pri", weight: 3, appeal: -0.015, momentum: -5, turn: 4 },
        { id: "machine_2012", headline: "The PRI's governors and the State of Mexico machine turn out the vote in the final week, and {party} holds its lead", role: "any", party: "pri", weight: 3, appeal: 0.02, momentum: 6, turn: 5 },
        { id: "amorosa_2012", headline: "López Obrador promises a loving republic and drops the anger of 2006, and {party} wins back some moderates", role: "any", party: "izq", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "drug_war_2012", headline: "The toll of Calderón's drug war passes 50,000 dead, and the PAN's candidate wears it. {party} cannot change the subject", role: "any", party: "pan", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "2006": {
      id: "2006",
      year: 2006,
      label: "2006 · Calderón v. López Obrador",
      tagline: "July 2, 2006. The former mayor of Mexico City, López Obrador, leads all winter for the PRD, the PT and Convergencia. The PAN's Felipe Calderón runs as the jobs president. The PRI's Roberto Madrazo, with the Greens, is fighting his own party. It ends 0.58 points apart.",
      salience: { economy_jobs: 0.9, poverty: 0.8, security: 0.55, corruption: 0.55, democracy: 0.5, energy: 0.4, us_relations: 0.35 },
      regions: {
        NW:   { v: { pan: 0.452, izq: 0.284, pri: 0.226, oth: 0.038 }, s: { pan: 3, izq: 2, pri: 2 } },
        NOR:  { v: { pan: 0.436, izq: 0.243, pri: 0.281, oth: 0.040 }, s: { pan: 4, izq: 2, pri: 2 } },
        NE:   { v: { pan: 0.481, izq: 0.213, pri: 0.266, oth: 0.040 }, s: { pan: 4, izq: 2, pri: 3 } },
        WES:  { v: { pan: 0.470, izq: 0.225, pri: 0.261, oth: 0.044 }, s: { pan: 4, izq: 2, pri: 2, oth: 1 } },
        BAJ:  { v: { pan: 0.584, izq: 0.182, pri: 0.198, oth: 0.036 }, s: { pan: 4, izq: 1, pri: 1 } },
        MEX:  { v: { pan: 0.319, izq: 0.445, pri: 0.186, oth: 0.050 }, s: { pan: 4, izq: 6, pri: 3, oth: 1 } },
        CDMX: { v: { pan: 0.279, izq: 0.591, pri: 0.087, oth: 0.043 }, s: { pan: 3, izq: 7, pri: 1, oth: 1 } },
        CEN:  { v: { pan: 0.348, izq: 0.388, pri: 0.222, oth: 0.042 }, s: { pan: 4, izq: 4, pri: 2 } },
        VER:  { v: { pan: 0.354, izq: 0.364, pri: 0.256, oth: 0.026 }, s: { pan: 2, izq: 2, pri: 2, oth: 1 } },
        SUR:  { v: { pan: 0.227, izq: 0.466, pri: 0.284, oth: 0.023 }, s: { pan: 3, izq: 6, pri: 3 } },
        PEN:  { v: { pan: 0.260, izq: 0.379, pri: 0.340, oth: 0.021 }, s: { pan: 2, izq: 2, pri: 2 } },
      },
      events: [
        { id: "lead_2006", headline: "López Obrador opens the campaign ten points ahead, the mayor who survived the 2005 attempt to strip his immunity, and {party} looks unstoppable", role: "any", party: "izq", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "chachalaca_2006", headline: "López Obrador tells President Fox to shut up, 'cállate, chachalaca', and {party} hands its rivals the clip", role: "any", party: "izq", weight: 3, appeal: -0.02, momentum: -6, turn: 1 },
        { id: "danger_2006", headline: "PAN ads call López Obrador a danger to Mexico and compare him to Hugo Chávez, and {party} slips in the polls", role: "any", party: "izq", weight: 3, appeal: -0.025, momentum: -7, turn: 2 },
        { id: "empty_chair_2006", headline: "López Obrador skips the first debate on April 25, and the empty chair costs {party}", role: "any", party: "izq", weight: 3, appeal: -0.015, momentum: -5, turn: 3 },
        { id: "hildebrando_2006", headline: "At the second debate, June 6, López Obrador accuses Calderón's brother-in-law of profiting from government contracts, and {party} spends a week answering", role: "any", party: "pan", weight: 3, appeal: -0.02, momentum: -6, turn: 4 },
        { id: "gordillo_2006", headline: "Elba Esther Gordillo, the teachers' union leader, has broken with Madrazo, and {party} loses part of its machine on election day", role: "any", party: "pri", weight: 3, appeal: -0.02, momentum: -6, turn: 5 },
        { id: "jobs_2006", headline: "Calderón promises to be the jobs president, with steady hands on the economy, and {party} owns the argument", role: "any", party: "pan", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "cce_ads_2006", headline: "Business groups pay for their own television ads warning against economic adventures, and {party} feels it", role: "any", party: "izq", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "pensions_2006", headline: "López Obrador points to the pensions for the elderly he paid as mayor, and {party} gains among older voters", role: "any", party: "izq", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "2000": {
      id: "2000",
      year: 2000,
      label: "2000 · Fox v. Labastida",
      tagline: "July 2, 2000. The PRI has held the presidency for 71 years. Its candidate, Francisco Labastida, won the party's first open primary. Vicente Fox, the cowboy-booted former Coca-Cola executive, runs for the PAN and the Greens. Cuauhtémoc Cárdenas tries a third time for the left.",
      salience: { democracy: 0.95, economy_jobs: 0.75, corruption: 0.7, security: 0.5, poverty: 0.5, us_relations: 0.35, energy: 0.3 },
      regions: {
        NW:   { v: { pan: 0.413, pri: 0.456, izq: 0.116, oth: 0.015 }, s: { pan: 3, pri: 4, izq: 1 } },
        NOR:  { v: { pan: 0.459, pri: 0.412, izq: 0.111, oth: 0.018 }, s: { pan: 4, pri: 3, izq: 1 } },
        NE:   { v: { pan: 0.494, pri: 0.409, izq: 0.077, oth: 0.020 }, s: { pan: 4, pri: 4, izq: 1 } },
        WES:  { v: { pan: 0.516, pri: 0.378, izq: 0.079, oth: 0.027 }, s: { pan: 5, pri: 4, izq: 1 } },
        BAJ:  { v: { pan: 0.604, pri: 0.302, izq: 0.069, oth: 0.025 }, s: { pan: 4, pri: 2 } },
        MEX:  { v: { pan: 0.445, pri: 0.326, izq: 0.191, oth: 0.038 }, s: { pan: 6, pri: 4, izq: 3, oth: 1 } },
        CDMX: { v: { pan: 0.444, pri: 0.244, izq: 0.264, oth: 0.048 }, s: { pan: 5, pri: 3, izq: 3, oth: 1 } },
        CEN:  { v: { pan: 0.415, pri: 0.400, izq: 0.160, oth: 0.025 }, s: { pan: 4, pri: 3, izq: 1, oth: 1 } },
        VER:  { v: { pan: 0.408, pri: 0.386, izq: 0.188, oth: 0.018 }, s: { pan: 3, pri: 3, izq: 1 } },
        SUR:  { v: { pan: 0.263, pri: 0.401, izq: 0.318, oth: 0.018 }, s: { pan: 3, pri: 5, izq: 4 } },
        PEN:  { v: { pan: 0.393, pri: 0.420, izq: 0.173, oth: 0.014 }, s: { pan: 2, pri: 2, izq: 1 } },
      },
      events: [
        { id: "voto_util_2000", headline: "Fox asks Cárdenas voters for a useful vote to end 71 years of PRI rule, and {party} gains among them", role: "any", party: "pan", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "debate1_2000", headline: "The first debate, April 25: Labastida complains on air that Fox has called him names, and the clip makes {party} look weak", role: "any", party: "pri", weight: 3, appeal: -0.025, momentum: -7, turn: 1 },
        { id: "black_tuesday_2000", headline: "Black Tuesday, May 23: the planned debate collapses over its format, Fox insists on 'today, today, today' in front of the cameras, and {party} looks stubborn", role: "any", party: "pan", weight: 3, appeal: -0.025, momentum: -7, turn: 2 },
        { id: "debate2_2000", headline: "The second debate, May 26, comes three days after Black Tuesday and settles little. {party} keeps pressing its useful-vote appeal to Cárdenas voters", role: "any", party: "pan", weight: 3, appeal: 0.02, momentum: 6, turn: 3 },
        { id: "munoz_ledo_2000", headline: "Porfirio Muñoz Ledo quits the race and backs Fox, and {party} picks up a voice from the left", role: "any", party: "pan", weight: 3, appeal: 0.015, momentum: 4, turn: 4 },
        { id: "cierre_2000", headline: "Cárdenas fills the Zócalo to close his third run, and {party} holds its base in the capital and Michoacán", role: "any", party: "izq", weight: 3, appeal: 0.015, momentum: 4, turn: 5 },
        { id: "governors_2000", headline: "The PRI's governors turn out the old machine in the countryside, and {party} holds the rural vote", role: "any", party: "pri", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "amigos_fox_2000", headline: "The Friends of Fox network raises money and volunteers outside the party, and {party} reaches voters the PAN never had", role: "any", party: "pan", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "nuevo_pri_2000", headline: "Labastida promises a new PRI, and voters who remember 1994 are not sure they believe it. {party} cannot escape its past", role: "any", party: "pri", weight: 2, appeal: -0.015, momentum: -4 },
      ],
    },
  },

  leaders: {
    "2024": {
      izq: { partyId: "izq", name: "Claudia Sheinbaum", charisma: 58, energy: 76, competence: 82, machine: 90 },
      pan: { partyId: "pan", name: "Xóchitl Gálvez", charisma: 66, energy: 70, competence: 54, machine: 56 },
      mc:  { partyId: "mc", name: "Jorge Álvarez Máynez", charisma: 56, energy: 80, competence: 46, machine: 38 },
    },
    "2018": {
      izq: { partyId: "izq", name: "Andrés Manuel López Obrador", charisma: 86, energy: 80, competence: 62, machine: 76 },
      pan: { partyId: "pan", name: "Ricardo Anaya", charisma: 54, energy: 78, competence: 72, machine: 58 },
      pri: { partyId: "pri", name: "José Antonio Meade", charisma: 34, energy: 56, competence: 80, machine: 70 },
    },
    "2012": {
      pri: { partyId: "pri", name: "Enrique Peña Nieto", charisma: 70, energy: 70, competence: 50, machine: 90 },
      izq: { partyId: "izq", name: "Andrés Manuel López Obrador", charisma: 76, energy: 80, competence: 58, machine: 62 },
      pan: { partyId: "pan", name: "Josefina Vázquez Mota", charisma: 48, energy: 56, competence: 58, machine: 56 },
    },
    "2006": {
      pan: { partyId: "pan", name: "Felipe Calderón", charisma: 52, energy: 72, competence: 72, machine: 66 },
      izq: { partyId: "izq", name: "Andrés Manuel López Obrador", charisma: 84, energy: 84, competence: 60, machine: 70 },
      pri: { partyId: "pri", name: "Roberto Madrazo", charisma: 38, energy: 60, competence: 58, machine: 78 },
    },
    "2000": {
      pan: { partyId: "pan", name: "Vicente Fox", charisma: 86, energy: 80, competence: 54, machine: 60 },
      pri: { partyId: "pri", name: "Francisco Labastida", charisma: 42, energy: 56, competence: 66, machine: 88 },
      izq: { partyId: "izq", name: "Cuauhtémoc Cárdenas", charisma: 52, energy: 54, competence: 70, machine: 60 },
    },
  },

  events: [
    { id: "poll_mx", headline: "A fresh newspaper poll shows {party} gaining among undecided voters", role: "any", weight: 3, appeal: 0.02, momentum: 5 },
    { id: "viral_mx", headline: "A viral video, true or not, spreads faster than the campaign can answer, and {party} takes the hit", role: "any", weight: 3, appeal: -0.03, momentum: -7 },
    { id: "debate_mx", headline: "{party}'s candidate wins the debate, and the clip is on every network by morning", role: "any", weight: 4, appeal: 0.035, momentum: 11 },
    { id: "governor_mx", headline: "A popular governor lends {party} the state machine and his rallies for the final stretch", role: "any", weight: 2, appeal: 0.025, momentum: 6 },
    { id: "violence_mx", headline: "A massacre in a mid-sized city leads every newscast, and the governing side answers for it", role: "leader", weight: 2, appeal: -0.025, momentum: -6 },
    { id: "peso_mx", headline: "The peso slides against the dollar, and the front-runner is asked what it means for prices", role: "leader", weight: 2, appeal: -0.02, momentum: -5 },
    { id: "spending_mx", headline: "The electoral institute fines {party} for overspending, and the story runs for days", role: "any", weight: 2, appeal: -0.02, momentum: -5 },
    { id: "rally_mx", headline: "A packed rally in a central plaza electrifies {party}", role: "player", weight: 2, appeal: 0.025, momentum: 9 },
    { id: "spots_mx", headline: "{party}'s television spots land, and the jingle is on every radio", role: "player", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "caravan_mx", headline: "{party}'s caravan fills the plazas of three states in one weekend", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "spot_pulled_mx", headline: "The electoral authorities order one of {party}'s attack spots off the air", role: "any", weight: 2, appeal: -0.015, momentum: -4 },
    { id: "business_mx", headline: "Business leaders warn about the front-runner's economic plans, and {party} spends the week answering", role: "leader", weight: 2, appeal: -0.015, momentum: -4 },
    { id: "endorse_mx", headline: "A former rival's local organisers switch to {party} in a televised ceremony", role: "challenger", weight: 2, appeal: 0.015, momentum: 5 },
    {
      id: "debate_call_mx",
      headline: "The electoral institute sets the next debate, and {party} must decide how to play it",
      role: "player",
      weight: 4,
      prompt: "The next debate is on every channel. How do you play it?",
      choices: [
        { id: "attack", text: "Go on the attack against the front-runner", resultText: "You land blows and take a few. The overnight polls twitch your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
        { id: "safe", text: "Play it safe and stay on message", resultText: "A steady night. No gaffes, no fireworks.", appeal: 0.015, momentum: 4 },
        { id: "skip", text: "Skip it: protect the lead and avoid the ambush", resultText: "The empty podium is the story of the night.", appeal: -0.015, momentum: -5 },
      ],
    },
    {
      id: "useful_vote_mx",
      headline: "Third-place voters are being asked for a useful vote, and {party} can make its own pitch",
      role: "player",
      weight: 4,
      prompt: "Supporters of the candidate in third could decide the race. What do you offer them?",
      choices: [
        { id: "useful_vote", text: "Ask them for a useful vote: a ballot for the third candidate is wasted", resultText: "Some come over. Their candidate's camp is furious.", appeal: 0.025, momentum: 8, rivalAppeal: -0.005 },
        { id: "policy", text: "Adopt one of their signature pledges", resultText: "A few come over. Your own base wonders what changed.", appeal: 0.015, momentum: 4 },
        { id: "base", text: "Ignore them and run to your own base", resultText: "Your base turns out. The third camp stays where it is.", appeal: 0.005, momentum: 2 },
      ],
    },
    {
      id: "ally_parties_mx",
      headline: "A small party offers {party} its registration and its slots on the ballot",
      role: "player",
      weight: 3,
      prompt: "The small party wants seats in Congress on your list and a ministry if you win. What do you do?",
      choices: [
        { id: "take", text: "Take the deal: their ballot line and their activists", resultText: "Their logo goes next to yours. The press counts what it cost.", appeal: 0.025, momentum: 6 },
        { id: "refuse", text: "Refuse and run alone", resultText: "Clean, and thinner on the ground.", appeal: 0.005, momentum: 2 },
        { id: "contrast", text: "Refuse, and attack your rival's alliance of convenience", resultText: "You define them more than yourself, and it lands.", appeal: 0.015, momentum: 5, rivalAppeal: -0.02 },
      ],
    },
  ],
};
attachElectionIssues(MEXICO, MX_ELECTION_ISSUES);

// Registry rows, store pack, daily pairing and "play next" chain.
export const MEXICO_MODULE = countryModule(MEXICO, {
  blurb: "The presidency from the fall of the PRI to Sheinbaum: five elections, eleven regions, one round, most votes wins.",
  cover: "images/covers/country-mx.jpg",
  art: { a: "#0b3d2e", b: "#8b1d3b", glow: "rgba(255,236,214,0.22)" },
  freeElections: ["2024"],
  scenarios: [
    { electionId: "2024", difficulty: "hard",
      description: "López Obrador's successor against an opposition alliance of the PAN, the PRI and the PRD, with Movimiento Ciudadano chasing young voters." },
    { electionId: "2018", difficulty: "hard",
      description: "López Obrador's third run, now with Morena, against a divided opposition and a government sunk by scandal." },
    { electionId: "2012", difficulty: "medium",
      description: "The PRI comes back with Peña Nieto. #YoSoy132, the Televisa questions and López Obrador's second run decide how wide the gap is." },
    { electionId: "2006", difficulty: "easy",
      description: "Calderón against López Obrador, decided by 0.58 points. Every region counts, and a single point is the whole race." },
    { electionId: "2000", difficulty: "hard",
      description: "Vicente Fox against the PRI's 71 years in power, with Cárdenas holding the left. The useful vote decides it." },
  ],
  systemLabel: "Single-round presidential plurality",
  pack: {
    id: "mexico",
    name: "Mexico",
    description: "Five presidential elections from 2000 to 2024: Fox, Calderón, Peña Nieto, López Obrador and Sheinbaum across eleven regions, where the most votes win in one round.",
    price: 99,
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
});
