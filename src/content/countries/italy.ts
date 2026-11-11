// ITALY: four Chamber of Deputies elections (2008, 2013, 2018, 2022), one bundle.
//
// Italy changed its electoral law three times in the period this bundle
// covers, and the chamber itself shrank. The player's job is the same in every
// election (win the most seats in the Chamber), but the machinery behind the
// seats is different, and each election's tagline says which law applied.
//   2008 and 2013 ("Porcellum", law 270 of 2005): closed-list proportional
//   representation with a national majority bonus. The coalition with the most
//   votes, if it fell short of 340 of the 630 seats, was topped up to 340
//   (54%). One seat went to the Aosta Valley and twelve to Italians abroad.
//   2018 ("Rosatellum", law 165 of 2017): a mixed system. 232 single-member
//   districts decided by plurality, 386 seats by proportional lists with a 3%
//   threshold, 12 abroad. 630 seats, 316 for a majority.
//   2022 (the Rosatellum on a smaller chamber): after the 2020 referendum the
//   Chamber has 400 seats: 147 in single-member districts, 245 proportional,
//   8 abroad. 201 for a majority.
//
// Parties. Italian voters choose a list, but lists are bound into coalitions,
// and the bonus (2008, 2013) and the single-member districts (2018, 2022) are
// won by coalitions. The engine forms governments from the largest party plus
// at most one partner, so a bloc here is the coalition (or list) a voter
// actually chose between: CDX is the centre-right coalition (the People of
// Freedom, Lega and allies in 2008 and 2013; Forza Italia, Lega, Brothers of
// Italy and Us with Italy in 2018; Brothers of Italy, Lega, Forza Italia and
// Us Moderates in 2022). CSX is the centre-left coalition (the Democratic
// Party and Italy of Values in 2008, Italy. Common Good in 2013, the PD with
// More Europe and allies in 2018, and the PD with the Greens and Left
// Alliance, More Europe and Civic Commitment in 2022). M5S is the Five Star
// Movement, which stood alone in every election it contested and ran no
// list in 2008. CEN is the centre standing apart from both coalitions: the
// Union of the Centre in 2008, Mario Monti's coalition in 2013 (Civic Choice,
// the Union of the Centre and Future and Freedom), and Action and Italia Viva
// in 2022. There was no such list in 2018, when the centrists sat inside the
// two big coalitions. RAD is the left outside the centre-left coalition: the
// Rainbow Left in 2008, Civil Revolution in 2013, Free and Equal in 2018 and
// the Popular Union in 2022 (the Greens and Left Alliance ran inside the
// centre-left coalition in 2022 and are counted there). Everything else
// (La Destra, the South Tyrol People's Party, Italians abroad lists, Italexit,
// Sovereign and Popular Italy and the rest) is in Others.
//
// Regions. The 20 regions are merged into 14 domestic units plus one pool for
// the overseas constituency: Piedmont (with the single-seat Aosta Valley),
// Lombardy, Veneto, Trentino-Alto Adige with Friuli-Venezia Giulia, Tuscany
// with Liguria, Emilia-Romagna, Umbria with the Marche, Lazio, Abruzzo with
// Molise, Campania, Apulia, Basilicata with Calabria, Sicily and Sardinia.
// Italians abroad vote in four overseas constituencies and are one inset pool
// (EST) with their own results.
//
// Numbers. Every `v` is the real list vote, summed by list from the Interior
// Ministry's results for each constituency (circoscrizione) of the Chamber, as
// tabulated on the Italian Wikipedia pages "Elezioni politiche in Italia del
// <year> per circoscrizione (Camera dei deputati)". The bloc vote is the sum
// of its member lists and each region's shares are divided by the region's
// valid list votes, so the national shares include the overseas and Aosta Valley
// lists and sit a few tenths of a point under the Ministry's Italy-only
// figures. Every `s` is the real number of seats the bloc won in that
// constituency, summed into the region: proportional seats plus single-member
// seats (2018, 2022), or seats after the majority bonus was distributed
// (2008, 2013), so no apportionment is needed and the national totals match the
// official results exactly. Seat pools therefore differ by election, as the
// real constituency magnitudes did (Lombardy 98 seats in 2008, 64 in 2022).
// One correction: the 2022 constituency page gives Lombardy 1 a Five Star seat
// that the national table (41 proportional plus 10 single-member) does not
// support; the plurinominal pages and the national table put it with the
// centre-right, and that is what is used here.
//
// Seat curve. Elasticity 1.3 across the board: a proportional system on
// the proportional years, and in the bonus and single-member years the
// largest coalition gets a little more than its share, which is what the
// bonus and the district seats did.
//
// What the engine cannot express. The majority bonus, the national thresholds
// (10% for a coalition and 4% for a list outside one in 2008 and 2013; 3% for
// a list in 2018 and 2022), the single-member districts themselves and the
// requirement that a government win confidence in both houses (the Senate had
// its own, regional, bonus and in 2013 it was hung). The Chamber is modelled
// alone, the bonus appears only as the elasticity above, and the guide entry
// says so. Pre-electoral coalitions are blocs, so the 2018 Lega and Forza
// Italia rivalry inside the centre-right and the three-party structure of the
// 2022 victory are described in event text rather than played as separate
// parties.
//
// 2022 (25 September): 400 seats, 201 for a majority. Centre-right 237 (Brothers
// of Italy 119, Lega 66, Forza Italia 45, Us Moderates 7), Democratic Party and
// allies 84, Five Star 52, Action-Italia Viva 21, others 6.
// 2018 (4 March): 630 seats, 316 for a majority. Centre-right 265 (Lega 125,
// Forza Italia 104, Brothers of Italy 32, Us with Italy 4), Five Star 227,
// centre-left 122 (PD 112), Free and Equal 14, others 2. No majority:
// Five Star and Lega formed the Conte government after three months.
// 2013 (24 and 25 February): 630 seats, 316 for a majority. Centre-left 345
// (PD 297, SEL 37, Democratic Centre 6, SVP 5), centre-right 125 (PdL 98, Lega
// 18, Brothers of Italy 9), Five Star 109, Monti's coalition 47, others 4. The
// bonus gave the centre-left a Chamber majority on 29.5% of the vote, but the
// Senate was hung and Enrico Letta formed a grand coalition.
// 2008 (13 and 14 April): 630 seats, 316 for a majority. Centre-right 344
// (PdL 276, Lega 60, MpA 8), centre-left 246 (PD 217, IdV 29), Union of the
// Centre 36, others 4. Berlusconi's third government.
//
// Sources. Constituency results: the Italian Wikipedia pages above, which
// reproduce the Interior Ministry's Eligendo archive. National seat totals and
// shares: the English and Italian Wikipedia articles on each election and the
// Ministry's official summaries. Campaign events: contemporary press as
// summarised on the Wikipedia articles for each election.

import type { CountryBundle } from "@engine/countryGame";
import { countryModule } from "./types";
import { IT_MAP } from "./paths/it";

export const ITALY: CountryBundle = {
  id: "IT",
  label: "Italy",
  flag: "🇮🇹",
  currency: "€",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "201 of 400 seats",
  defaultSeatElasticity: 1.3,
  eventChance: 0.7,
  map: IT_MAP,

  system: {
    id: "IT",
    label: "Italy",
    parties: [
      { id: "cdx", name: "Centre-right (PdL or Forza Italia, Lega, FdI)", shortName: "Centre-right", color: "#1b5aa8" },
      { id: "csx", name: "Centre-left (Democratic Party and allies)", shortName: "Centre-left", color: "#d9242f" },
      { id: "m5s", name: "Five Star Movement", shortName: "Five Star", color: "#f4b400" },
      { id: "cen", name: "Centrists (UDC, Monti, Azione-Italia Viva)", shortName: "Centrists", color: "#2aa6c9" },
      { id: "rad", name: "Radical left (Arcobaleno to Unione Popolare)", shortName: "Radical Left", color: "#8a2f6b" },
      { id: "oth", name: "Others (La Destra, SVP, Italians abroad, Italexit…)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Coalition bonus, then mixed proportional and single-member (regional pools)", unit: "seat" },
    majority: { total: 400, threshold: 201 },
  },
  playable: ["csx", "cdx", "m5s", "cen", "rad"],
  abstaining: [],
  // The two big coalitions have not been in government together by choice
  // since the republic began; the grand coalitions of 2013 and 2021 were
  // emergencies built after the vote. The radical left will not deal with the
  // right or with Monti or Calenda, and the centrists would not deal with
  // Grillo or Conte. Five Star governed with the Lega in 2018 and the PD in
  // 2019, so it is free to pick either side.
  coalitions: {
    forbidden: [["csx", "cdx"], ["rad", "cdx"], ["rad", "cen"], ["cen", "m5s"]],
    isolated: ["oth"],
  },
  governmentText: {
    majority: "{party} holds {seats} seats, a clear majority in the Chamber, and is asked by the President to form a government. The Senate still has to give its confidence.",
    coalition: "{parties} agree a programme and count {seats} seats between them, enough for the Chamber. The Senate is the harder count.",
    confidence_supply: "{lead} forms a government with the votes of {partner}, {seats} seats between them, and depends on that partner in every vote.",
    minority: "{party} has {seats} seats, short of a majority, and needs rivals to abstain to survive. Governments like this tend not to last the year.",
    hung: "No two blocs reach a majority. {largest} has the most seats, and the President begins consultations that can run for weeks.",
  },
  goalHint: "Reach {majority} of {total} seats, alone or with one partner. Seats follow each region's vote, and the biggest bloc gets a little more than its share. Lombardy, Campania, Lazio and Sicily hold the most seats. A real government also needs the Senate, which this game does not model.",

  issues: [
    { id: "economy", name: "Economy & jobs", blurb: "Stagnant growth, factory closures and a generation of temporary contracts." },
    { id: "tax", name: "Taxes", blurb: "The property tax, the flat tax and who pays for the rest." },
    { id: "austerity", name: "Austerity", blurb: "Monti's cuts, the budget deficit and what Brussels and the bond markets demand." },
    { id: "corruption", name: "The political caste", blurb: "Privileges, expense scandals and the sense that Rome serves itself." },
    { id: "migration", name: "Migration & security", blurb: "Boats from Libya, reception centres and who feels safe on the street." },
    { id: "pensions", name: "Pensions", blurb: "The Fornero law, the retirement age and what the young will get." },
    { id: "income", name: "Basic income", blurb: "The citizens' income, the minimum wage and what to do about poverty." },
    { id: "energy", name: "Energy prices", blurb: "Gas and electricity bills after the invasion of Ukraine, and who pays for the shock." },
    { id: "services", name: "Public services", blurb: "Rubbish, hospitals, schools and a state that works better in some regions than others." },
    { id: "south", name: "The South", blurb: "Unemployment, emigration and a Mezzogiorno that feels forgotten." },
    { id: "europe", name: "Europe & the euro", blurb: "Brussels, the single currency and Italy's place in the Union." },
  ],

  blocs: [
    { id: "young", name: "Young voters (18-34)", share: 0.2, turnoutPropensity: 0.64,
      tilt: { m5s: 0.5, rad: 0.3, csx: 0.0, cen: -0.1, cdx: -0.2 } },
    { id: "graduate", name: "Graduates and professionals", share: 0.18, turnoutPropensity: 0.82,
      tilt: { csx: 0.4, cen: 0.5, rad: 0.15, m5s: -0.25, cdx: -0.1 } },
    { id: "sme", name: "Small business and the self-employed", share: 0.18, turnoutPropensity: 0.8,
      tilt: { cdx: 0.5, cen: 0.15, m5s: 0.0, csx: -0.3, rad: -0.5 } },
    { id: "worker", name: "Industrial and service workers", share: 0.25, turnoutPropensity: 0.7,
      tilt: { m5s: 0.25, cdx: 0.15, csx: 0.0, rad: 0.15, cen: -0.4 } },
    { id: "pensioner", name: "Pensioners (65+)", share: 0.3, turnoutPropensity: 0.86,
      tilt: { csx: 0.3, cdx: 0.2, cen: 0.1, m5s: -0.45, rad: -0.2 } },
    { id: "south", name: "Southern families and public sector workers", share: 0.24, turnoutPropensity: 0.66,
      tilt: { m5s: 0.7, cdx: 0.05, csx: -0.15, cen: -0.3, rad: 0.0 } },
    { id: "civic", name: "Civic left tradition (the red belt)", share: 0.1, turnoutPropensity: 0.86,
      tilt: { csx: 0.8, rad: 0.3, m5s: -0.1, cen: 0.0, cdx: -0.5 } },
    { id: "catholic", name: "Practising Catholics", share: 0.2, turnoutPropensity: 0.82,
      tilt: { cdx: 0.2, cen: 0.4, csx: 0.1, m5s: -0.25, rad: -0.5 } },
    { id: "abroad", name: "Italians abroad", share: 0.05, turnoutPropensity: 0.3,
      tilt: { csx: 0.45, cen: 0.2, oth: 1.4, cdx: -0.2, m5s: -0.3 } },
  ],

  // Pools are the 2022 sizes; each election's `s` table sets its own.
  // Electorate is thousands of valid list votes cast (2022).
  regions: [
    { id: "PIE", name: "Piedmont & Aosta Valley", abbr: "Piedmont", seats: 30, electorate: 2156, tile: { row: 0, col: 0 },
      profile: { sme: 1.1, pensioner: 1.15, worker: 1.05, graduate: 1.05, south: 0.45 } },
    { id: "LOM", name: "Lombardy", abbr: "Lombardy", seats: 64, electorate: 5066, tile: { row: 0, col: 1 },
      profile: { sme: 1.4, graduate: 1.2, worker: 1.1, catholic: 1.1, south: 0.35 } },
    { id: "NEA", name: "Trentino-Alto Adige & Friuli-Venezia Giulia", abbr: "North-East", seats: 15, electorate: 1097, tile: { row: 0, col: 2 },
      profile: { sme: 1.15, catholic: 1.2, pensioner: 1.1, south: 0.3 } },
    { id: "TOS", name: "Tuscany & Liguria", abbr: "Tuscany", seats: 34, electorate: 2612, tile: { row: 1, col: 0 },
      profile: { civic: 2.0, pensioner: 1.25, graduate: 1.1, south: 0.35, sme: 0.9 } },
    { id: "EMR", name: "Emilia-Romagna", abbr: "Emilia", seats: 29, electorate: 2307, tile: { row: 1, col: 1 },
      profile: { civic: 2.4, worker: 1.1, pensioner: 1.15, graduate: 1.1, south: 0.35 } },
    { id: "VEN", name: "Veneto", abbr: "Veneto", seats: 32, electorate: 2512, tile: { row: 1, col: 2 },
      profile: { sme: 1.5, catholic: 1.4, worker: 1.1, south: 0.25, civic: 0.4 } },
    { id: "SAR", name: "Sardinia", abbr: "Sardinia", seats: 11, electorate: 686, tile: { row: 2, col: 0 },
      profile: { south: 1.3, pensioner: 1.1, young: 0.9, civic: 0.6 } },
    { id: "UMA", name: "Umbria & Marche", abbr: "Umbria-Marche", seats: 16, electorate: 1198, tile: { row: 2, col: 1 },
      profile: { civic: 1.7, pensioner: 1.2, catholic: 1.1, south: 0.5 } },
    { id: "ABM", name: "Abruzzo & Molise", abbr: "Abruzzo-Molise", seats: 11, electorate: 755, tile: { row: 2, col: 2 },
      profile: { south: 1.3, pensioner: 1.15, catholic: 1.15 } },
    { id: "EST", name: "Italians abroad", abbr: "Abroad", seats: 8, electorate: 1086, tile: { row: 3, col: 0 },
      profile: { abroad: 14, graduate: 0.8, worker: 0.5, south: 0.3, pensioner: 0.6, civic: 0.1 } },
    { id: "LAZ", name: "Lazio", abbr: "Lazio", seats: 36, electorate: 2710, tile: { row: 3, col: 1 },
      profile: { graduate: 1.25, south: 1.0, young: 1.1, sme: 0.75 } },
    { id: "PUG", name: "Apulia", abbr: "Apulia", seats: 27, electorate: 1743, tile: { row: 3, col: 2 },
      profile: { south: 1.7, catholic: 1.1, young: 1.0, civic: 0.4 } },
    { id: "CAM", name: "Campania", abbr: "Campania", seats: 38, electorate: 2304, tile: { row: 4, col: 1 },
      profile: { south: 2.0, young: 1.25, worker: 0.9, sme: 0.7, civic: 0.2 } },
    { id: "BAC", name: "Basilicata & Calabria", abbr: "Basil-Calabria", seats: 17, electorate: 965, tile: { row: 4, col: 2 },
      profile: { south: 1.9, pensioner: 1.05, catholic: 1.1, civic: 0.3 } },
    { id: "SIC", name: "Sicily", abbr: "Sicily", seats: 32, electorate: 2043, tile: { row: 5, col: 1 },
      profile: { south: 1.9, young: 1.0, graduate: 0.8, catholic: 1.05, civic: 0.2 } },
  ],

  elections: {
    "2022": {
      id: "2022",
      year: 2022,
      label: "2022 · Meloni v. Letta",
      tagline: "September 2022. The Draghi government has fallen in July and the country votes at the end of summer, on a Chamber cut to 400 seats and the Rosatellum: a third of seats in single-member districts, the rest by proportional list. The right is united and ahead, the left is split three ways, and gas bills are the whole conversation.",
      salience: { energy: 0.95, economy: 0.7, income: 0.65, tax: 0.6, europe: 0.55, migration: 0.5, pensions: 0.45, services: 0.4 },
      regions: {
        PIE: { v: { cdx: 0.452, csx: 0.278, m5s: 0.101, cen: 0.086, rad: 0.014, oth: 0.069 }, s: { cdx: 18, csx: 7, m5s: 2, cen: 2, oth: 1 } },
        LOM: { v: { cdx: 0.506, csx: 0.267, m5s: 0.075, cen: 0.103, rad: 0.011, oth: 0.038 }, s: { cdx: 43, csx: 13, m5s: 3, cen: 5 } },
        VEN: { v: { cdx: 0.563, csx: 0.23, m5s: 0.058, cen: 0.084, rad: 0.01, oth: 0.055 }, s: { cdx: 24, csx: 5, m5s: 1, cen: 2 } },
        NEA: { v: { cdx: 0.413, csx: 0.26, m5s: 0.062, cen: 0.075, rad: 0.011, oth: 0.179 }, s: { cdx: 9, csx: 2, cen: 1, oth: 3 } },
        TOS: { v: { cdx: 0.396, csx: 0.336, m5s: 0.116, cen: 0.088, rad: 0.021, oth: 0.043 }, s: { cdx: 19, csx: 10, m5s: 3, cen: 2 } },
        EMR: { v: { cdx: 0.388, csx: 0.36, m5s: 0.099, cen: 0.086, rad: 0.014, oth: 0.053 }, s: { cdx: 15, csx: 10, m5s: 2, cen: 2 } },
        UMA: { v: { cdx: 0.45, csx: 0.268, m5s: 0.132, cen: 0.077, rad: 0.009, oth: 0.064 }, s: { cdx: 11, csx: 4, m5s: 1 } },
        LAZ: { v: { cdx: 0.448, csx: 0.267, m5s: 0.15, cen: 0.083, rad: 0.017, oth: 0.035 }, s: { cdx: 23, csx: 8, m5s: 3, cen: 2 } },
        ABM: { v: { cdx: 0.469, csx: 0.222, m5s: 0.194, cen: 0.06, rad: 0.018, oth: 0.037 }, s: { cdx: 7, csx: 3, m5s: 1 } },
        CAM: { v: { cdx: 0.322, csx: 0.222, m5s: 0.346, cen: 0.052, rad: 0.02, oth: 0.038 }, s: { cdx: 14, csx: 6, m5s: 16, cen: 2 } },
        PUG: { v: { cdx: 0.411, csx: 0.225, m5s: 0.279, cen: 0.048, rad: 0.011, oth: 0.026 }, s: { cdx: 16, csx: 4, m5s: 6, cen: 1 } },
        BAC: { v: { cdx: 0.405, csx: 0.19, m5s: 0.283, cen: 0.056, rad: 0.021, oth: 0.045 }, s: { cdx: 10, csx: 3, m5s: 4 } },
        SIC: { v: { cdx: 0.362, csx: 0.164, m5s: 0.282, cen: 0.051, rad: 0.009, oth: 0.132 }, s: { cdx: 19, csx: 3, m5s: 7, cen: 2, oth: 1 } },
        SAR: { v: { cdx: 0.405, csx: 0.27, m5s: 0.218, cen: 0.046, rad: 0.016, oth: 0.045 }, s: { cdx: 7, csx: 2, m5s: 2 } },
        EST: { v: { cdx: 0.26, csx: 0.369, m5s: 0.086, cen: 0.056, oth: 0.229 }, s: { cdx: 2, csx: 4, m5s: 1, oth: 1 } },
      },
      // The real story beats of 2022, in campaign order.
      events: [
        { id: "draghi_falls", headline: "Five Star, the Lega and Forza Italia withdraw their confidence in Draghi and he resigns for good. Business mourns him, and {party} promises to keep his agenda", role: "any", party: "cen", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "centre_right_pact", headline: "The centre-right agrees how to share the single-member districts and that the biggest party names the prime minister. Brothers of Italy takes the most seats and {party} looks like a government in waiting", role: "any", party: "cdx", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "calenda_pact", headline: "Calenda signs a pact with Letta on 2 August, Letta signs another with the Greens and the Left four days later, and Calenda tears up the first on the 7th. {party} is left with a coalition that disagrees with itself", role: "any", party: "csx", weight: 3, appeal: -0.03, momentum: -8, turn: 2 },
        { id: "piacenza_video", headline: "Meloni posts a video of an assault in Piacenza and the platforms take it down. Letta calls it indecent and {party} is accused of using a victim for a headline", role: "any", party: "cdx", weight: 3, appeal: -0.02, momentum: -6, turn: 3 },
        { id: "conte_south", headline: "Conte takes the defence of the citizens' income to the South, and {party} climbs back in polls that had written it off", role: "any", party: "m5s", weight: 3, appeal: 0.035, momentum: 9, turn: 4 },
        { id: "vdl_tools", headline: "Von der Leyen says the EU has tools if Italy goes in a difficult direction. Salvini and Renzi attack the remark, and {party} makes the most of it", role: "any", party: "cdx", weight: 3, appeal: 0.015, momentum: 5, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "third_pole", headline: "Renzi and Calenda announce a Third Pole on 11 August and promise to bring Draghi back. {party} has a list, a leader and a week to fill the gap", role: "any", party: "cen", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "letta_no_conte", headline: "Letta rules out any pact with Conte, calling the break over Draghi irreversible, and {party} runs alone with a bigger grudge", role: "any", party: "m5s", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "berlusconi_tiktok", headline: "Berlusconi, 85, joins TikTok and gathers more than 350,000 followers in a day, and {party} suddenly looks young", role: "any", party: "cdx", weight: 2, appeal: 0.01, momentum: 4 },
        { id: "b_class_country", headline: "Letta warns that a right-wing victory could turn Italy into a second-rank country like Poland and Hungary. The remark is thrown back at {party} for days", role: "any", party: "csx", weight: 2, appeal: -0.015, momentum: -5 },
        { id: "nuclear_gas", headline: "Calenda and Renzi campaign for nuclear power and gas regasification ships as the answer to the energy crisis, and {party} gets a hearing from employers and engineers", role: "any", party: "cen", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "popular_union", headline: "De Magistris gathers the far left in the Popular Union and spends the campaign fighting for the 3 percent line. {party} needs every vote", role: "any", party: "rad", weight: 2, appeal: 0.01, momentum: 3 },
      ],
    },

    "2018": {
      id: "2018",
      year: 2018,
      label: "2018 · Salvini v. Di Maio v. Renzi",
      tagline: "March 2018. The new mixed law, the Rosatellum, puts a third of seats in single-member districts and sets a 3 percent bar for lists, but in practice nobody expects a winner. Renzi is trying to recover from the lost referendum, Berlusconi cannot hold office, Five Star wants to prove it can govern, and the Lega wants to stop being northern.",
      majority: { total: 630, threshold: 316 },
      goalText: "316 of 630 seats",
      salience: { migration: 0.9, tax: 0.75, economy: 0.7, income: 0.7, pensions: 0.6, south: 0.5, europe: 0.45, corruption: 0.4 },
      regions: {
        PIE: { v: { cdx: 0.401, csx: 0.248, m5s: 0.264, rad: 0.049, oth: 0.038 }, s: { cdx: 26, csx: 9, m5s: 10, rad: 2 } },
        LOM: { v: { cdx: 0.469, csx: 0.253, m5s: 0.214, rad: 0.037, oth: 0.027 }, s: { cdx: 66, csx: 20, m5s: 15, rad: 1 } },
        VEN: { v: { cdx: 0.48, csx: 0.203, m5s: 0.244, rad: 0.034, oth: 0.039 }, s: { cdx: 35, csx: 7, m5s: 8 } },
        NEA: { v: { cdx: 0.369, csx: 0.321, m5s: 0.223, rad: 0.045, oth: 0.042 }, s: { cdx: 14, csx: 7, m5s: 3 } },
        TOS: { v: { cdx: 0.337, csx: 0.309, m5s: 0.262, rad: 0.063, oth: 0.029 }, s: { cdx: 23, csx: 18, m5s: 12, rad: 2 } },
        EMR: { v: { cdx: 0.33, csx: 0.308, m5s: 0.275, rad: 0.057, oth: 0.03 }, s: { cdx: 18, csx: 18, m5s: 8, rad: 1 } },
        UMA: { v: { cdx: 0.345, csx: 0.254, m5s: 0.326, rad: 0.041, oth: 0.034 }, s: { cdx: 10, csx: 4, m5s: 11 } },
        LAZ: { v: { cdx: 0.353, csx: 0.229, m5s: 0.332, rad: 0.052, oth: 0.034 }, s: { cdx: 24, csx: 12, m5s: 22, rad: 1 } },
        ABM: { v: { cdx: 0.345, csx: 0.177, m5s: 0.407, rad: 0.041, oth: 0.03 }, s: { cdx: 4, csx: 2, m5s: 10, rad: 1 } },
        CAM: { v: { cdx: 0.277, csx: 0.164, m5s: 0.494, rad: 0.045, oth: 0.02 }, s: { cdx: 12, csx: 6, m5s: 38, rad: 2 } },
        PUG: { v: { cdx: 0.322, csx: 0.161, m5s: 0.449, rad: 0.045, oth: 0.023 }, s: { cdx: 9, csx: 4, m5s: 29, rad: 1 } },
        BAC: { v: { cdx: 0.305, csx: 0.177, m5s: 0.437, rad: 0.049, oth: 0.032 }, s: { cdx: 7, csx: 3, m5s: 16, rad: 1 } },
        SIC: { v: { cdx: 0.317, csx: 0.136, m5s: 0.488, rad: 0.036, oth: 0.023 }, s: { cdx: 10, csx: 4, m5s: 33, rad: 2 } },
        SAR: { v: { cdx: 0.311, csx: 0.177, m5s: 0.424, rad: 0.04, oth: 0.048 }, s: { cdx: 4, csx: 2, m5s: 11 } },
        EST: { v: { cdx: 0.225, csx: 0.351, m5s: 0.176, rad: 0.057, oth: 0.191 }, s: { cdx: 3, csx: 6, m5s: 1, oth: 2 } },
      },
      // The real story beats of 2018, in campaign order.
      events: [
        { id: "grasso_leu", headline: "Pietro Grasso, the Senate president and former anti-mafia prosecutor, takes over Free and Equal, a list of PD dissidents and the old left. {party} has a leader who looks nothing like a party boss", role: "any", party: "rad", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "flat_tax", headline: "Berlusconi promises a flat tax of 23 percent and Salvini says 15. Il Sole 24 Ore prices it at 25 to 40 billion euros a year, and {party} owns the tax debate anyway", role: "any", party: "cdx", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "macerata", headline: "A local man opens fire on African migrants in Macerata days after the murder of a young Italian woman. Immigration takes over the campaign, and {party} gains among voters who want fewer arrivals", role: "any", party: "cdx", weight: 3, appeal: 0.025, momentum: 7, turn: 2 },
        { id: "rimborsopoli", headline: "Reports show several Five Star MPs faked bank transfers to hide that they kept money they had promised to return. {party} spends the week expelling its own", role: "any", party: "m5s", weight: 3, appeal: -0.03, momentum: -8, turn: 3 },
        { id: "rosary_rally", headline: "Salvini closes a huge rally in Milan by swearing on the Gospel and kissing a rosary, and {party} reaches believers the Lega never won", role: "any", party: "cdx", weight: 3, appeal: 0.01, momentum: 4, turn: 4 },
        { id: "basic_income_south", headline: "Di Maio promises a citizens' income of 780 euros a month and in the South the pitch lands. {party} fills squares from Naples to Palermo", role: "any", party: "m5s", weight: 3, appeal: 0.035, momentum: 9, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "gentiloni_steady", headline: "Gentiloni, the calm incumbent, polls better than his party, but {party} cannot turn his popularity into votes", role: "any", party: "csx", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "tajani_pick", headline: "Berlusconi, barred from office by his tax fraud conviction, names Antonio Tajani as his pick for prime minister if Forza Italia comes out on top of the coalition. {party} has to explain who would really lead", role: "any", party: "cdx", weight: 2, appeal: -0.01, momentum: -3 },
        { id: "minimum_wage", headline: "Renzi promises a minimum wage of 10 euros an hour and 80 euros a month for every child, but {party} still carries the Jobs Act and the lost referendum", role: "any", party: "csx", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "three_percent", headline: "The 3 percent bar keeps small lists scrambling, and {party} has to tell voters that a vote under the line only helps someone else", role: "any", party: "rad", weight: 2, appeal: -0.015, momentum: -4 },
      ],
    },

    "2013": {
      id: "2013",
      year: 2013,
      label: "2013 · Bersani v. Berlusconi v. Grillo",
      tagline: "February 2013. Monti's technocrats have raised taxes and cut spending to save the euro, Berlusconi has pulled his party out of the majority and is back on television, and a comedian called Beppe Grillo is filling squares. The Porcellum still gives the winning coalition a bonus to 340 of 630 seats, so finishing first by a nose is worth more than a hundred extra seats.",
      majority: { total: 630, threshold: 316 },
      goalText: "316 of 630 seats",
      salience: { austerity: 0.95, tax: 0.85, economy: 0.8, corruption: 0.7, europe: 0.55, pensions: 0.4, income: 0.3 },
      regions: {
        PIE: { v: { cdx: 0.276, csx: 0.275, m5s: 0.273, cen: 0.118, rad: 0.02, oth: 0.038 }, s: { cdx: 9, csx: 24, m5s: 8, cen: 4, oth: 1 } },
        LOM: { v: { cdx: 0.357, csx: 0.282, m5s: 0.196, cen: 0.121, rad: 0.016, oth: 0.028 }, s: { cdx: 25, csx: 54, m5s: 14, cen: 8 } },
        VEN: { v: { cdx: 0.319, csx: 0.233, m5s: 0.263, cen: 0.119, rad: 0.013, oth: 0.053 }, s: { cdx: 12, csx: 24, m5s: 10, cen: 5 } },
        NEA: { v: { cdx: 0.224, csx: 0.353, m5s: 0.215, cen: 0.134, rad: 0.018, oth: 0.056 }, s: { cdx: 3, csx: 16, m5s: 3, cen: 2 } },
        TOS: { v: { cdx: 0.214, csx: 0.385, m5s: 0.264, cen: 0.089, rad: 0.025, oth: 0.023 }, s: { cdx: 7, csx: 36, m5s: 8, cen: 3 } },
        EMR: { v: { cdx: 0.209, csx: 0.402, m5s: 0.246, cen: 0.093, rad: 0.019, oth: 0.031 }, s: { cdx: 6, csx: 30, m5s: 7, cen: 2 } },
        UMA: { v: { cdx: 0.223, csx: 0.328, m5s: 0.303, cen: 0.103, rad: 0.023, oth: 0.02 }, s: { cdx: 3, csx: 15, m5s: 5, cen: 2 } },
        LAZ: { v: { cdx: 0.279, csx: 0.298, m5s: 0.281, cen: 0.088, rad: 0.026, oth: 0.028 }, s: { cdx: 11, csx: 32, m5s: 11, cen: 4 } },
        ABM: { v: { cdx: 0.293, csx: 0.267, m5s: 0.296, cen: 0.092, rad: 0.033, oth: 0.019 }, s: { cdx: 3, csx: 9, m5s: 3, cen: 1 } },
        CAM: { v: { cdx: 0.357, csx: 0.26, m5s: 0.222, cen: 0.113, rad: 0.026, oth: 0.022 }, s: { cdx: 15, csx: 31, m5s: 9, cen: 5 } },
        PUG: { v: { cdx: 0.33, csx: 0.265, m5s: 0.255, cen: 0.105, rad: 0.024, oth: 0.021 }, s: { cdx: 10, csx: 21, m5s: 8, cen: 3 } },
        BAC: { v: { cdx: 0.288, csx: 0.297, m5s: 0.247, cen: 0.107, rad: 0.028, oth: 0.033 }, s: { cdx: 5, csx: 15, m5s: 5, cen: 1 } },
        SIC: { v: { cdx: 0.311, csx: 0.215, m5s: 0.337, cen: 0.086, rad: 0.034, oth: 0.017 }, s: { cdx: 12, csx: 23, m5s: 13, cen: 4 } },
        SAR: { v: { cdx: 0.237, csx: 0.295, m5s: 0.297, cen: 0.094, rad: 0.028, oth: 0.049 }, s: { cdx: 3, csx: 10, m5s: 4, cen: 1 } },
        EST: { v: { cdx: 0.148, csx: 0.311, m5s: 0.097, cen: 0.184, rad: 0.016, oth: 0.244 }, s: { cdx: 1, csx: 5, m5s: 1, cen: 2, oth: 3 } },
      },
      // The real story beats of 2013, in campaign order.
      events: [
        { id: "monti_runs", headline: "Monti swaps the technocrat's chair for a centrist list and publishes an agenda for Italy, with open backing from the Vatican. {party} offers calm after the storm", role: "any", party: "cen", weight: 3, appeal: 0.03, momentum: 8, turn: 0 },
        { id: "imu_refund", headline: "Berlusconi works every talk show in sight and promises to refund the 2012 property tax in cash. {party} climbs back from the dead", role: "any", party: "cdx", weight: 3, appeal: 0.035, momentum: 9, turn: 1 },
        { id: "mps_scandal", headline: "Losses at Monte dei Paschi di Siena, the oldest bank in the world and a pillar of the Tuscan left, hit the front pages. {party} cannot shake the smell of the establishment", role: "any", party: "csx", weight: 3, appeal: -0.03, momentum: -8, turn: 2 },
        { id: "mussolini_remark", headline: "On Holocaust Remembrance Day Berlusconi says Mussolini did good things apart from the racial laws. {party} spends a week on damage control", role: "any", party: "cdx", weight: 3, appeal: -0.02, momentum: -6, turn: 3 },
        { id: "monti_tax_memory", headline: "Monti asks voters to finish the reforms he started, but the property tax and the pension age are still fresh. {party} cannot shake the memory of the bills", role: "any", party: "cen", weight: 3, appeal: -0.015, momentum: -4, turn: 4 },
        { id: "san_giovanni", headline: "Grillo closes his Tsunami Tour in Rome's Piazza San Giovanni before a vast crowd, and {party} surges in every poll that is still allowed", role: "any", party: "m5s", weight: 3, appeal: 0.04, momentum: 10, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "bersani_primary", headline: "Bersani won the centre-left primary against Renzi in December and holds the left together with Vendola. {party} enters the race as the favourite", role: "any", party: "csx", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "tsunami_tour", headline: "Grillo drives from town to town filling squares that no party can fill and refuses every interview. {party} grows on the street", role: "any", party: "m5s", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "youth_jobless", headline: "Youth unemployment passes 36 percent and the case against austerity writes itself. {party} says Monti's cuts did this", role: "any", party: "m5s", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "civil_revolution", headline: "Ingroia gathers magistrates, communists and Greens in Civil Revolution and the left splits again. {party} fights for the 4 percent line", role: "any", party: "rad", weight: 2, appeal: -0.015, momentum: -4 },
        { id: "bonus_maths", headline: "Pollsters spell out the bonus: whoever finishes first by a nose takes 340 seats. Tactical voters drift to {party}", role: "any", party: "csx", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },

    "2008": {
      id: "2008",
      year: 2008,
      label: "2008 · Berlusconi v. Veltroni",
      tagline: "April 2008. Prodi's government has fallen after twenty months and Italy votes under the Porcellum, which gives the winning coalition at least 340 of 630 seats. Veltroni's new Democratic Party refuses allies on its left and runs a campaign borrowed from Obama, Berlusconi has merged his party with Fini's and is far ahead, and rubbish is piled in the streets of Naples.",
      majority: { total: 630, threshold: 316 },
      goalText: "316 of 630 seats",
      salience: { tax: 0.8, economy: 0.75, services: 0.6, corruption: 0.55, migration: 0.5, south: 0.4, pensions: 0.4 },
      regions: {
        PIE: { v: { cdx: 0.463, csx: 0.365, cen: 0.051, rad: 0.033, oth: 0.088 }, s: { cdx: 27, csx: 18, cen: 2, oth: 1 } },
        LOM: { v: { cdx: 0.552, csx: 0.321, cen: 0.043, rad: 0.029, oth: 0.055 }, s: { cdx: 62, csx: 32, cen: 4 } },
        VEN: { v: { cdx: 0.544, csx: 0.308, cen: 0.056, rad: 0.022, oth: 0.07 }, s: { cdx: 31, csx: 16, cen: 3 } },
        NEA: { v: { cdx: 0.399, csx: 0.322, cen: 0.052, rad: 0.031, oth: 0.196 }, s: { cdx: 11, csx: 8, cen: 1, oth: 2 } },
        TOS: { v: { cdx: 0.366, csx: 0.48, cen: 0.04, rad: 0.043, oth: 0.071 }, s: { cdx: 25, csx: 27, cen: 3 } },
        EMR: { v: { cdx: 0.364, csx: 0.499, cen: 0.043, rad: 0.03, oth: 0.064 }, s: { cdx: 19, csx: 22, cen: 2 } },
        UMA: { v: { cdx: 0.368, csx: 0.465, cen: 0.055, rad: 0.032, oth: 0.08 }, s: { cdx: 11, csx: 13, cen: 1 } },
        LAZ: { v: { cdx: 0.437, csx: 0.409, cen: 0.048, rad: 0.033, oth: 0.073 }, s: { cdx: 29, csx: 23, cen: 3 } },
        ABM: { v: { cdx: 0.43, csx: 0.415, cen: 0.058, rad: 0.029, oth: 0.068 }, s: { cdx: 9, csx: 7, cen: 1 } },
        CAM: { v: { cdx: 0.515, csx: 0.339, cen: 0.065, rad: 0.027, oth: 0.054 }, s: { cdx: 36, csx: 22, cen: 4 } },
        PUG: { v: { cdx: 0.475, csx: 0.355, cen: 0.079, rad: 0.03, oth: 0.061 }, s: { cdx: 24, csx: 16, cen: 4 } },
        BAC: { v: { cdx: 0.423, csx: 0.382, cen: 0.079, rad: 0.033, oth: 0.083 }, s: { cdx: 15, csx: 11, cen: 2 } },
        SIC: { v: { cdx: 0.544, csx: 0.288, cen: 0.094, rad: 0.026, oth: 0.048 }, s: { cdx: 32, csx: 16, cen: 5 } },
        SAR: { v: { cdx: 0.43, csx: 0.402, cen: 0.056, rad: 0.036, oth: 0.076 }, s: { cdx: 9, csx: 8, cen: 1 } },
        EST: { v: { cdx: 0.309, csx: 0.366, cen: 0.084, rad: 0.027, oth: 0.214 }, s: { cdx: 4, csx: 7, oth: 1 } },
      },
      // The real story beats of 2008, in campaign order.
      events: [
        { id: "prodi_falls", headline: "Prodi loses the Senate confidence vote by 161 to 156 after Mastella's party walks out, and Napolitano dissolves parliament. {party} goes to the country with a government that has just collapsed", role: "any", party: "csx", weight: 3, appeal: -0.03, momentum: -8, turn: 0 },
        { id: "pdl_symbol", headline: "Berlusconi merges Forza Italia and Fini's National Alliance into one People of Freedom list, allied with the Lega. {party} starts with a single symbol and a big lead in the polls", role: "any", party: "cdx", weight: 3, appeal: 0.03, momentum: 8, turn: 1 },
        { id: "veltroni_alone", headline: "Veltroni refuses an alliance with the left and signs up only Di Pietro's Italy of Values and the Radicals. {party} bets that a clean break will beat the old Union", role: "any", party: "csx", weight: 3, appeal: 0.015, momentum: 5, turn: 2 },
        { id: "casini_refuses", headline: "Casini turns down Berlusconi's offer to join the People of Freedom and runs the Union of the Centre alone rather than as a junior partner. {party} gets an identity of its own", role: "any", party: "cen", weight: 3, appeal: 0.02, momentum: 6, turn: 3 },
        { id: "naples_rubbish", headline: "Rubbish still lies uncollected in the streets of Naples, and the centre-left runs both the city and the region. {party} takes the blame", role: "any", party: "csx", weight: 3, appeal: -0.03, momentum: -8, turn: 4 },
        { id: "alitalia_bid", headline: "Air France-KLM bids for Alitalia and Berlusconi says he will find Italian buyers instead. {party} turns a failing airline into a question of national pride", role: "any", party: "cdx", weight: 3, appeal: 0.02, momentum: 6, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "rainbow_left", headline: "Bertinotti puts four left parties under one Rainbow symbol, and the Greens and the communists find they share a ballot paper but not a programme. {party} struggles to look new", role: "any", party: "rad", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "veltrusconi", headline: "Both big blocs promise tax cuts and the papers call them Veltrusconi. Voters who want a real alternative look at {party}", role: "any", party: "rad", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "calearo_boccuzzi", headline: "Veltroni's lists include a Confindustria executive and a survivor of the ThyssenKrupp fire. {party} says it speaks for both the boss and the worker", role: "any", party: "csx", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "ici_pledge", headline: "Berlusconi repeats his pledge to scrap the property tax on first homes, and {party} makes the tax bill the question of the campaign", role: "any", party: "cdx", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "security_crime", headline: "A string of violent crimes keeps security on the front pages, and {party} owns the issue", role: "any", party: "cdx", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },
  },

  leaders: {
    "2022": {
      cdx: { partyId: "cdx", name: "Giorgia Meloni", charisma: 84, energy: 90, competence: 62, machine: 78 },
      csx: { partyId: "csx", name: "Enrico Letta", charisma: 44, energy: 62, competence: 70, machine: 64 },
      m5s: { partyId: "m5s", name: "Giuseppe Conte", charisma: 74, energy: 66, competence: 58, machine: 54 },
      cen: { partyId: "cen", name: "Carlo Calenda & Matteo Renzi", charisma: 62, energy: 80, competence: 70, machine: 44 },
      rad: { partyId: "rad", name: "Luigi de Magistris", charisma: 62, energy: 70, competence: 42, machine: 30 },
    },
    "2018": {
      cdx: { partyId: "cdx", name: "Matteo Salvini & Silvio Berlusconi", charisma: 82, energy: 90, competence: 54, machine: 78 },
      csx: { partyId: "csx", name: "Matteo Renzi", charisma: 60, energy: 78, competence: 58, machine: 62 },
      m5s: { partyId: "m5s", name: "Luigi Di Maio", charisma: 58, energy: 80, competence: 40, machine: 68 },
      rad: { partyId: "rad", name: "Pietro Grasso", charisma: 52, energy: 48, competence: 70, machine: 40 },
    },
    "2013": {
      csx: { partyId: "csx", name: "Pier Luigi Bersani", charisma: 50, energy: 62, competence: 70, machine: 76 },
      cdx: { partyId: "cdx", name: "Silvio Berlusconi", charisma: 86, energy: 80, competence: 50, machine: 84 },
      m5s: { partyId: "m5s", name: "Beppe Grillo", charisma: 92, energy: 94, competence: 36, machine: 70 },
      cen: { partyId: "cen", name: "Mario Monti", charisma: 36, energy: 40, competence: 88, machine: 44 },
      rad: { partyId: "rad", name: "Antonio Ingroia", charisma: 48, energy: 56, competence: 54, machine: 38 },
    },
    "2008": {
      cdx: { partyId: "cdx", name: "Silvio Berlusconi", charisma: 82, energy: 70, competence: 58, machine: 90 },
      csx: { partyId: "csx", name: "Walter Veltroni", charisma: 68, energy: 74, competence: 62, machine: 60 },
      cen: { partyId: "cen", name: "Pier Ferdinando Casini", charisma: 56, energy: 55, competence: 62, machine: 52 },
      rad: { partyId: "rad", name: "Fausto Bertinotti", charisma: 62, energy: 50, competence: 56, machine: 44 },
    },
  },

  events: [
    { id: "grim_istat", headline: "Istat publishes grim figures on output and jobs, and the government is on the front page. {party} takes the heat", role: "leader", weight: 3, appeal: -0.03, momentum: -7 },
    { id: "cartelle_season", headline: "A fresh round of tax demands lands on kitchen tables, and voters look to {party}", role: "challenger", weight: 3, appeal: 0.025, momentum: 6 },
    { id: "talkshow_clash", headline: "{party}'s leader wins a rowdy clash on the Thursday talk show, and the clip is everywhere by Friday", role: "any", weight: 3, appeal: 0.03, momentum: 9 },
    { id: "candidate_scandal", headline: "A candidate on {party}'s list is photographed at the wrong dinner, and the party spends the day explaining", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "mayors_endorse", headline: "A bloc of provincial mayors comes out for {party}, and local newspapers run the photograph", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "leader_slip", headline: "{party}'s leader gets a number wrong on live radio, and the correction is worse than the mistake", role: "any", weight: 2, appeal: -0.03, momentum: -6 },
    { id: "endorsement_corriere", headline: "The big papers line up behind {party}, and the editorials are not subtle", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "viral_young", headline: "A short video of {party}'s leader goes round the under-30s and nobody in the party knows why", role: "challenger", weight: 2, appeal: 0.025, momentum: 8 },
    { id: "piazza_tour", headline: "A week of piazzas and market stalls through the small towns wins {party} warm local coverage", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "quirinale_calm", headline: "The President's calm appeal for a clean campaign favours the party that looks like it can govern, and that is {party}", role: "leader", weight: 2, appeal: 0.025, momentum: 6 },
    {
      id: "tv_confronto",
      headline: "Rai offers {party} a head-to-head with its main rival",
      role: "player",
      weight: 4,
      prompt: "A prime-time confronto is on the table. How do you play it?",
      choices: [
        { id: "accept_attack", text: "Accept and go on the attack", resultText: "You land blows and take a few. The overnight polls twitch your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
        { id: "accept_safe", text: "Accept and play it safe", resultText: "A steady, on-message night. No gaffes, no fireworks.", appeal: 0.015, momentum: 4 },
        { id: "decline", text: "Decline and send a deputy", resultText: "You dodge the studio lights. The papers call it a snub.", appeal: -0.01, momentum: -4 },
      ],
    },
    {
      id: "partners_list",
      headline: "The lists close on Friday and {party}'s allies want more safe seats",
      role: "player",
      weight: 3,
      prompt: "Your partners are demanding more candidates in winnable seats. What do you do?",
      choices: [
        { id: "give_way", text: "Give way and keep the coalition happy", resultText: "The alliance holds and your own people grumble.", appeal: 0.01, momentum: 2 },
        { id: "hold_line", text: "Hold your ground and put your own people first", resultText: "Your base is pleased. The allies mutter about it for a week.", appeal: 0.005, momentum: 0 },
        { id: "ultimatum", text: "Tell them to take it or run alone", resultText: "A bold line. Some of them blink, some of them leave.", appeal: 0.02, momentum: 5, rivalAppeal: -0.01 },
      ],
    },
    {
      id: "tax_promise",
      headline: "{party}'s manifesto goes to print and the tax chapter is still a fight",
      role: "player",
      weight: 3,
      prompt: "The manifesto goes to print on Friday. Which way do you push?",
      choices: [
        { id: "bold", text: "Go bold with a headline pledge", resultText: "The base roars. The economists start sharpening their pencils.", appeal: 0.035, momentum: 12 },
        { id: "cautious", text: "Play it safe and promise nothing costly", resultText: "No spark, no self-inflicted wounds.", appeal: 0.01, momentum: 2 },
        { id: "contrast", text: "Make it a contrast with the rival's costings", resultText: "You define them more than yourself, and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
      ],
    },
  ],
};

// Registry rows, store pack, daily pairing and "play next" chain.
export const ITALY_MODULE = countryModule(ITALY, {
  blurb: "Coalitions, a majority bonus, then a mixed system and a chamber cut to 400: four elections from 2008 to 2022.",
  cover: "images/covers/country-it.jpg",
  art: { a: "#0f3d2e", b: "#c8102e", glow: "rgba(236,240,245,0.2)" },
  scenarios: [
    { electionId: "2022", difficulty: "hard",
      description: "Draghi has fallen, the left is split three ways and Meloni leads a united right into a 400-seat chamber. Gas bills decide everything." },
    { electionId: "2018", difficulty: "hard",
      description: "The first Rosatellum election. Five Star is the biggest party, the Lega overtakes Forza Italia, and nobody can make a majority." },
    { electionId: "2013", difficulty: "hard",
      description: "Monti's austerity, Berlusconi's comeback and Grillo's tsunami. The bonus gives the winner 340 seats, and the Senate is a trap." },
    { electionId: "2008", difficulty: "hard",
      description: "Prodi has fallen. Veltroni goes it alone, Berlusconi merges his party with Fini's, and Naples is buried in rubbish." },
  ],
  systemLabel: "Coalition bonus, then mixed",
  pack: {
    id: "italy",
    name: "Italy",
    description: "Four elections to the Chamber of Deputies from 2008 to 2022: the Berlusconi comeback, the Monti and Grillo years, and the Rosatellum.",
    price: 99,
  },
  daily: { pair: ["csx", "cdx"], names: { csx: "the Centre-left", cdx: "the Centre-right" } },
  next: {
    chain: [
      { id: "2008", blurb: "Continue the timeline: Veltroni and the Naples rubbish" },
      { id: "2013", blurb: "Continue the timeline: Monti, Grillo and the bonus" },
      { id: "2018", blurb: "Continue the timeline: the first Rosatellum" },
      { id: "2022", blurb: "Continue the timeline: after Draghi" },
    ],
  },
  guide: {
    title: "Italy",
    body: "Chamber of Deputies only. In 2008 and 2013 the winning coalition got a bonus that lifted it to 340 of 630 seats. In 2018 and 2022 about a third of seats go to single-member districts and the rest to proportional lists, and the chamber shrinks to 400 seats in 2022. Parties are the coalitions voters chose between, so Centre-right means Forza Italia or the People of Freedom, the Lega and Brothers of Italy together. Italians abroad are their own pool. Left and right blocs never govern together here, and a real government also needs the Senate, which is not modelled.",
  },
});
