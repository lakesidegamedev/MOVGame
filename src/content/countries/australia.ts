// AUSTRALIA — federal elections under full preferential voting.
//
// 2025 (May 3): 150 seats, 76 for a majority. ALP 94, Coalition 43, GRN 1
// (Ryan — Melbourne fell), crossbench 12 (teals/KAP/CA as non-playable `ind`).
// One Nation is vote-only. Albanese's Medicare-card landslide; Dutton lost
// Dickson itself.
//
// 2022 (May 21): 151 seats, 76 for a majority (pre-redistribution). ALP 77,
// Coalition 58, Greens 4 (Melbourne + Brisbane/Griffith/Ryan), crossbench 12
// (10 independents + KAP + Centre Alliance → `ind`). The teal wave and the
// end of nine years of Coalition government.
//
// Earlier elections (1996 to 2016) use the real state results from the
// official returns as compiled on Wikipedia and the Australian Electoral
// Commission: first-preference share per state by party and the seats won.
// The Coalition (`lnp`) is Liberal, National, Liberal National and Country
// Liberal combined. `ind` is independents plus the crossbench parties that won
// seats (Katter's Australian Party, Nick Xenophon Team, the WA Nationals in
// 2010 and Palmer United in 2013); their votes are folded in, except Palmer
// United's, which sits in `oth`. Chambers: 148 seats in 1996 and 1998, 150
// from 2001 to 2016. One Nation (`onp`) carries votes only.
// 2016 (July 2): LNP 76, ALP 69, Greens 1, crossbench 4.
// 2013 (September 7): LNP 90, ALP 55, Greens 1, crossbench 4.
// 2010 (August 21): LNP 72, ALP 72, Greens 1, crossbench 5 (hung parliament).
// 2007 (November 24): ALP 83, LNP 65, crossbench 2.
// 2004 (October 9): LNP 87, ALP 60, crossbench 3.
// 2001 (November 10): LNP 82, ALP 65, crossbench 3.
// 1998 (October 3): LNP 80, ALP 67, crossbench 1.
// 1996 (March 2): LNP 94, ALP 49, crossbench 5.

import type { CountryBundle } from "@engine/countryGame";
import { countryModule, oncePerCampaign } from "./types";
import { AU_MAP } from "./paths/au";

// The debate win is a one-off beat: it fires at most once a campaign.
export const AUSTRALIA: CountryBundle = oncePerCampaign({
  id: "AU",
  label: "Australia",
  flag: "🇦🇺",
  currency: "$",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "76 of 150 seats",
  // Preferential single-member voting still amplifies swings, a touch less
  // brutally than raw FPTP (preferences cushion the primary-vote collapse).
  defaultSeatElasticity: 2.2,
  eventChance: 0.7,
  map: AU_MAP,

  system: {
    id: "AU",
    label: "Australia",
    parties: [
      { id: "alp", name: "Australian Labor Party", shortName: "Labor", color: "#e53440" },
      { id: "lnp", name: "Liberal-National Coalition", shortName: "Coalition", color: "#1c4f9c" },
      { id: "grn", name: "Australian Greens", shortName: "Greens", color: "#009c3d" },
      { id: "onp", name: "One Nation", shortName: "One Nation", color: "#f36c21" },
      { id: "ind", name: "Independents & minor crossbench", shortName: "Crossbench", color: "#26a69a" },
      { id: "oth", name: "Others", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Full-preferential voting (regional seats curve)", unit: "seat" },
    majority: { total: 150, threshold: 76 },
  },
  playable: ["alp", "lnp", "grn"],
  abstaining: [],
  // Labor and the Coalition never partner each other; the Greens can back Labor
  // only; the crossbench and One Nation strike no formal arrangement (teal
  // independents negotiate seat-by-seat, not as a bloc).
  coalitions: { forbidden: [["alp", "lnp"]], onlyWith: { grn: ["alp"] }, isolated: ["ind", "onp"] },
  governmentText: {
    majority: "{party} forms majority government with {seats} seats.",
    coalition: "{parties} strike a governing agreement ({seats} seats).",
    confidence_supply: "{lead} governs with confidence and supply from {partner}.",
    minority: "{party} forms minority government, and the crossbench holds the balance of power.",
    hung: "Hung parliament: the crossbench decides who governs.",
  },

  issues: [
    { id: "cost_of_living", name: "Cost of living", blurb: "Groceries, rents and mortgage rates: the squeeze on household budgets." },
    { id: "housing", name: "Housing", blurb: "Prices, rents and first home buyers locked out of the market." },
    { id: "medicare", name: "Medicare & health", blurb: "Bulk billing, hospital waits and the little green card." },
    { id: "energy_climate", name: "Energy & climate", blurb: "Coal, renewables, carbon pricing and the cost of power." },
    { id: "trump_security", name: "Trade & the United States", blurb: "Tariffs, the alliance with Washington and who can steady the ship." },
    { id: "immigration", name: "Immigration", blurb: "Migration levels, caps and who gets the blame for the housing crunch." },
    { id: "economy_jobs", name: "Jobs & the economy", blurb: "Unemployment, a mining boom, a financial crisis and the slogans that promise growth." },
    { id: "budget_debt", name: "Budget & debt", blurb: "Deficits, surpluses and the argument over who can manage the nation's finances." },
    { id: "taxes", name: "Tax reform", blurb: "The GST, income tax cuts and company tax: who pays and who gains." },
    { id: "border_security", name: "Borders & security", blurb: "Asylum boats, terrorism and war: whose hand is steadier." },
    { id: "education", name: "Education", blurb: "Schools funding, laptops and the cost of a university degree." },
    { id: "industrial_relations", name: "Workplace relations", blurb: "WorkChoices, penalty rates and how far industrial reform should go." },
  ],

  // Compulsory voting: turnout propensity is uniformly high; the action is all
  // in the tilts. 2025 dynamics — the young swung hard to Labor and the Greens,
  // graduates and teal seats stayed anti-Coalition, and the outer-suburban
  // mortgage belt broke to Labor and decided it.
  blocs: [
    { id: "young_renter", name: "Young renters (18-34)", share: 0.22, turnoutPropensity: 0.88,
      tilt: { alp: 0.3, grn: 0.55, lnp: -0.6, onp: -0.2, ind: 0.1 } },
    { id: "graduate", name: "University graduates", share: 0.28, turnoutPropensity: 0.93,
      tilt: { alp: 0.2, grn: 0.3, lnp: -0.25, onp: -0.5, ind: 0.35 } },
    { id: "mortgage_belt", name: "Outer-suburban mortgage belt", share: 0.30, turnoutPropensity: 0.91,
      tilt: { alp: 0.15, lnp: 0.1, grn: -0.3, onp: 0.15, ind: -0.3 } },
    { id: "regional", name: "Regional & rural Australia", share: 0.24, turnoutPropensity: 0.90,
      tilt: { lnp: 0.5, onp: 0.45, alp: -0.3, grn: -0.35, ind: 0.1 } },
    { id: "senior", name: "Seniors (65+)", share: 0.24, turnoutPropensity: 0.95,
      tilt: { lnp: 0.35, alp: 0.05, grn: -0.5, onp: 0.1, ind: -0.1 } },
    { id: "multicultural", name: "Multicultural urban communities", share: 0.20, turnoutPropensity: 0.89,
      tilt: { alp: 0.45, lnp: -0.3, onp: -0.7, ind: -0.2 } },
  ],

  // Electorates in thousands ∝ enrolment. Tiles sketch the continent: WA the
  // big west, NT/QLD across the top, SA centre, NSW/ACT east, VIC/TAS below.
  regions: [
    { id: "NSW", name: "New South Wales", abbr: "NSW", seats: 46, electorate: 5540, tile: { row: 1, col: 2 },
      profile: { multicultural: 1.2, mortgage_belt: 1.1, graduate: 1.05 } },
    { id: "VIC", name: "Victoria", abbr: "VIC", seats: 38, electorate: 4530, tile: { row: 2, col: 2 },
      profile: { graduate: 1.1, young_renter: 1.1, multicultural: 1.1 } },
    { id: "QLD", name: "Queensland", abbr: "QLD", seats: 30, electorate: 3700, tile: { row: 0, col: 2 },
      profile: { regional: 1.25, mortgage_belt: 1.05, senior: 1.05 } },
    { id: "WA", name: "Western Australia", abbr: "WA", seats: 16, electorate: 1890, tile: { row: 1, col: 0 },
      profile: { mortgage_belt: 1.15, young_renter: 1.05 } },
    { id: "SA", name: "South Australia", abbr: "SA", seats: 10, electorate: 1290, tile: { row: 1, col: 1 },
      profile: { senior: 1.1, mortgage_belt: 1.05 } },
    { id: "TAS", name: "Tasmania", abbr: "TAS", seats: 5, electorate: 410, tile: { row: 3, col: 2 },
      profile: { regional: 1.3, senior: 1.2, multicultural: 0.5 } },
    { id: "ACT", name: "Australian Capital Territory", abbr: "ACT", seats: 3, electorate: 320, tile: { row: 1, col: 3 },
      profile: { graduate: 1.5, young_renter: 1.2, regional: 0.3 } },
    { id: "NT", name: "Northern Territory", abbr: "NT", seats: 2, electorate: 148, tile: { row: 0, col: 1 },
      profile: { young_renter: 1.2, regional: 1.2, multicultural: 1.1 } },
  ],

  elections: {
    "2025": {
      id: "2025",
      year: 2025,
      label: "2025 · Albanese v. Dutton",
      tagline: "May 2025. Cost of living bites, Washington upends the world order mid-campaign, and Peter Dutton's year-long polling lead is gone by Easter. Five weeks to hold the middle.",
      salience: { cost_of_living: 0.92, housing: 0.78, medicare: 0.72, trump_security: 0.65, energy_climate: 0.60, immigration: 0.45 },
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      regions: {
        // Primary-vote-flavoured shares (preferences folded into the seat
        // curve); seats are the real state outcomes. Labor swept the QLD
        // gains and Dickson; the Greens kept only Ryan; the teals held.
        NSW: { v: { alp: 0.36, lnp: 0.33, grn: 0.10, onp: 0.06, ind: 0.09, oth: 0.06 }, s: { alp: 28, lnp: 12, ind: 6 } },
        VIC: { v: { alp: 0.35, lnp: 0.31, grn: 0.13, onp: 0.05, ind: 0.08, oth: 0.08 }, s: { alp: 26, lnp: 10, ind: 2 } },
        QLD: { v: { alp: 0.31, lnp: 0.36, grn: 0.12, onp: 0.09, ind: 0.05, oth: 0.07 }, s: { alp: 13, lnp: 15, grn: 1, ind: 1 } },
        WA:  { v: { alp: 0.38, lnp: 0.32, grn: 0.12, onp: 0.06, ind: 0.06, oth: 0.06 }, s: { alp: 11, lnp: 4, ind: 1 } },
        SA:  { v: { alp: 0.37, lnp: 0.32, grn: 0.11, onp: 0.06, ind: 0.08, oth: 0.06 }, s: { alp: 7, lnp: 2, ind: 1 } },
        TAS: { v: { alp: 0.36, lnp: 0.27, grn: 0.10, onp: 0.05, ind: 0.15, oth: 0.07 }, s: { alp: 4, ind: 1 } },
        ACT: { v: { alp: 0.43, lnp: 0.24, grn: 0.16, onp: 0.02, ind: 0.09, oth: 0.06 }, s: { alp: 3 } },
        NT:  { v: { alp: 0.41, lnp: 0.31, grn: 0.10, onp: 0.05, ind: 0.05, oth: 0.08 }, s: { alp: 2 } },
      },
      // The real story beats of the five-week campaign, in order. Scheduled
      // entries fire deterministically that week; the rest join the weekly draw.
      events: [
        { id: "au25_cyclone_alfred", turn: 0, party: "lnp", role: "any", weight: 1,
          headline: "Cyclone Alfred washes out the campaign launch. The budget slips, and so does {party}'s opening week", momentum: -6 },
        { id: "au25_wfh_backflip", turn: 1, party: "lnp", role: "any", weight: 1,
          headline: "{party} dumps its end-work-from-home policy mid-campaign: 'we got it wrong'", appeal: -0.03, momentum: -8 },
        { id: "au25_liberation_day", turn: 2, party: "lnp", role: "any", weight: 1,
          headline: "Trump's 'Liberation Day' tariffs land mid-campaign. Voters recoil from anything that rhymes with MAGA, and {party} wears it", appeal: -0.035, momentum: -9 },
        { id: "au25_stage_fall", turn: 3, party: "alp", role: "any", weight: 1,
          headline: "The {party} leader tumbles off the stage at a rally: 'I stepped back one step, I didn't fall'", appeal: -0.02, momentum: -5 },
        { id: "au25_debate_worm", turn: 4, party: "alp", role: "any", weight: 1,
          headline: "The worm turns: {party}'s leader takes the final debate on every network verdict", appeal: 0.03, momentum: 8 },
        { id: "au25_doge_scare", party: "lnp", role: "any", weight: 3,
          headline: "The 41,000 public-service-cuts scare sticks, and 'DOGE-style slashing' dogs {party} at every stop", appeal: -0.025, momentum: -6 },
        { id: "au25_medicare_card", party: "alp", role: "any", weight: 3,
          headline: "The Medicare card comes out of {party}'s pocket at every single event, and it's working", appeal: 0.025, momentum: 6 },
        { id: "au25_dickson_watch", party: "lnp", role: "any", weight: 2,
          headline: "Dickson watch: polling puts {party}'s own leader's seat in play", appeal: -0.02, momentum: -7 },
        { id: "au25_gas_reservation", party: "lnp", role: "any", weight: 2,
          headline: "{party}'s east-coast gas reservation plan unravels under questioning. Nobody can say what power bills do", appeal: -0.02, momentum: -5 },
        { id: "au25_early_voting", role: "leader", weight: 2,
          headline: "Record pre-poll turnout: half the country votes early, and {party} banks its lead", appeal: 0.02, momentum: 6 },
      ],
    },

    "2022": {
      id: "2022",
      year: 2022,
      label: "2022 · Albanese v. Morrison",
      tagline: "May 2022. Nine years of Coalition government, a teal wave on the harbourside, and a prime minister who doesn't hold a hose. Change the government, or hold the line.",
      // Pre-redistribution chamber: 151 seats (NSW 47 / VIC 39 / WA 15).
      majority: { total: 151, threshold: 76 },
      goalText: "76 of 151 seats",
      salience: { energy_climate: 0.88, cost_of_living: 0.78, medicare: 0.55, trump_security: 0.35, housing: 0.50, immigration: 0.40 },
      regions: {
        // AEC first-preference flavours; seats are the real 2022 state outcomes.
        // Crossbench = teals/independents + KAP (QLD) + Centre Alliance (SA).
        NSW: { v: { alp: 0.33, lnp: 0.37, grn: 0.10, onp: 0.05, ind: 0.08, oth: 0.07 }, s: { alp: 26, lnp: 16, ind: 5 } },
        VIC: { v: { alp: 0.33, lnp: 0.33, grn: 0.14, onp: 0.04, ind: 0.07, oth: 0.09 }, s: { alp: 24, lnp: 11, grn: 1, ind: 3 } },
        QLD: { v: { alp: 0.27, lnp: 0.40, grn: 0.13, onp: 0.07, ind: 0.04, oth: 0.09 }, s: { alp: 5, lnp: 21, grn: 3, ind: 1 } },
        WA:  { v: { alp: 0.37, lnp: 0.35, grn: 0.13, onp: 0.04, ind: 0.02, oth: 0.09 }, s: { alp: 9, lnp: 5, ind: 1 } },
        SA:  { v: { alp: 0.34, lnp: 0.36, grn: 0.13, onp: 0.05, ind: 0.06, oth: 0.06 }, s: { alp: 6, lnp: 3, ind: 1 } },
        TAS: { v: { alp: 0.27, lnp: 0.33, grn: 0.12, onp: 0.04, ind: 0.11, oth: 0.13 }, s: { alp: 2, lnp: 2, ind: 1 } },
        ACT: { v: { alp: 0.45, lnp: 0.27, grn: 0.19, onp: 0.02, ind: 0.05, oth: 0.02 }, s: { alp: 3 } },
        NT:  { v: { alp: 0.38, lnp: 0.29, grn: 0.13, onp: 0.05, ind: 0.01, oth: 0.14 }, s: { alp: 2 } },
      },
      events: [
        { id: "au22_hose", turn: 0, party: "lnp", role: "any", weight: 1,
          headline: "'I don't hold a hose, mate': the flood-week clip dogs {party} from day one", appeal: -0.03, momentum: -8 },
        { id: "au22_teal_wave", turn: 1, party: "lnp", role: "any", weight: 1,
          headline: "The teal wave breaks: climate independents surge in {party}'s harbourside heartland", appeal: -0.035, momentum: -10 },
        { id: "au22_aukus_row", turn: 2, party: "lnp", role: "any", weight: 1,
          headline: "The French submarine scrap and AUKUS still sting, and {party} wears the diplomacy hangover", appeal: -0.02, momentum: -5 },
        { id: "au22_small_target", turn: 3, party: "alp", role: "any", weight: 1,
          headline: "{party}'s small-target strategy holds: no hostages, no fireworks, just the change argument", appeal: 0.02, momentum: 6 },
        { id: "au22_debate_night", turn: 4, party: "alp", role: "any", weight: 1,
          headline: "Leaders' debate: {party} lands the 'how good is Australia' contrast without a gaffe", appeal: 0.025, momentum: 7 },
        { id: "au22_integrity", party: "alp", role: "any", weight: 3,
          headline: "A federal integrity commission becomes {party}'s closing argument, and it sticks", appeal: 0.03, momentum: 8 },
        { id: "au22_climate_pledge", party: "alp", role: "any", weight: 2,
          headline: "{party}'s 43% emissions pledge draws a line under a decade of climate wars", appeal: 0.025, momentum: 6 },
        { id: "au22_preference_scare", party: "lnp", role: "any", weight: 2,
          headline: "A preference-deal scare about Greens and teals rattles {party}'s suburban seats", appeal: -0.02, momentum: -5 },
        { id: "au22_early_voting", role: "leader", weight: 2,
          headline: "Pre-poll queues snake around the block as {party} banks early votes in the cities", appeal: 0.02, momentum: 5 },
        { id: "au22_morrison_brand", party: "lnp", role: "any", weight: 3,
          headline: "The character question won't die. Focus groups say {party}'s leader is the issue", appeal: -0.03, momentum: -7 },
      ],
    },

    "2019": {
      id: "2019",
      year: 2019,
      label: "2019 · Morrison v. Shorten",
      tagline: "May 2019. Every poll for three years said Labor. A big-target agenda on franking credits and negative gearing meets a daggy-dad prime minister and a wall of yellow ads. The unlosable election. Hold your nerve, or pull off the miracle.",
      // Pre-redistribution chamber: 151 seats (NSW 47 / VIC 38 / WA 16).
      majority: { total: 151, threshold: 76 },
      goalText: "76 of 151 seats",
      salience: { cost_of_living: 0.85, energy_climate: 0.7, housing: 0.55, medicare: 0.5, immigration: 0.35, trump_security: 0.25 },
      regions: {
        // AEC first-preference flavours; seats are the real 2019 state outcomes.
        // Crossbench = independents (Steggall, Wilkie…) + KAP (QLD) + Centre
        // Alliance (SA), all folded into `ind`.
        NSW: { v: { lnp: 0.42, alp: 0.34, grn: 0.09, onp: 0.04, ind: 0.06, oth: 0.05 }, s: { alp: 24, lnp: 22, ind: 1 } },
        VIC: { v: { lnp: 0.38, alp: 0.37, grn: 0.12, onp: 0.03, ind: 0.05, oth: 0.05 }, s: { alp: 21, lnp: 15, grn: 1, ind: 1 } },
        QLD: { v: { lnp: 0.44, alp: 0.27, grn: 0.10, onp: 0.09, ind: 0.04, oth: 0.06 }, s: { lnp: 23, alp: 6, ind: 1 } },
        WA:  { v: { lnp: 0.45, alp: 0.30, grn: 0.12, onp: 0.05, oth: 0.08 }, s: { lnp: 11, alp: 5 } },
        SA:  { v: { lnp: 0.38, alp: 0.34, grn: 0.11, onp: 0.05, ind: 0.07, oth: 0.05 }, s: { alp: 5, lnp: 4, ind: 1 } },
        TAS: { v: { alp: 0.35, lnp: 0.34, grn: 0.12, onp: 0.04, ind: 0.09, oth: 0.06 }, s: { alp: 2, lnp: 2, ind: 1 } },
        ACT: { v: { alp: 0.44, lnp: 0.28, grn: 0.17, oth: 0.11 }, s: { alp: 3 } },
        NT:  { v: { alp: 0.43, lnp: 0.38, grn: 0.08, oth: 0.11 }, s: { alp: 1, lnp: 1 } },
      },
      events: [
        { id: "au19_franking_scare", turn: 0, party: "alp", role: "any", weight: 1,
          headline: "The 'retiree tax': {party}'s franking-credits crackdown becomes a scare campaign in every RSL and bowls club in the country", appeal: -0.03, momentum: -8 },
        { id: "au19_bob_brown_convoy", turn: 1, party: "alp", role: "any", weight: 1,
          headline: "Bob Brown's anti-Adani convoy rolls through central Queensland and backfires, and the coal seats swing away from {party}", appeal: -0.03, momentum: -7 },
        { id: "au19_bill_you_cant_afford", turn: 2, party: "alp", role: "any", weight: 1,
          headline: "'The Bill Australia can't afford': the big-target agenda on negative gearing and dividends becomes a target-rich week for the attack ads on {party}", appeal: -0.025, momentum: -6 },
        { id: "au19_shorten_unpopular", turn: 3, party: "alp", role: "any", weight: 1,
          headline: "The preferred-PM gap won't close: focus groups keep saying {party}'s leader is the drag on the ticket", appeal: -0.02, momentum: -5 },
        { id: "au19_daggy_dad", turn: 4, party: "lnp", role: "any", weight: 1,
          headline: "Curry, caps and church: {party}'s 'quiet Australians' retail campaign quietly outworks the whole press gallery", appeal: 0.03, momentum: 8 },
        { id: "au19_palmer_blitz", party: "lnp", role: "any", weight: 3,
          headline: "Clive Palmer's $60m yellow ad blitz and a preference deal funnel the anti-Labor vote to {party}", appeal: 0.025, momentum: 7 },
        { id: "au19_death_tax", party: "alp", role: "any", weight: 2,
          headline: "A viral 'death tax' hoax spreads through the group chats, and {party} spends a week denying a policy it never had", appeal: -0.025, momentum: -6 },
        { id: "au19_climate_youth", party: "alp", role: "any", weight: 2,
          headline: "School strikers and inner-city climate marches lift {party} in the cities, even as the message sinks in the coal belt", appeal: 0.02, momentum: 5 },
        { id: "au19_polls_miracle", role: "leader", weight: 2,
          headline: "Every published poll still has {party}'s rival ahead: the mother of all expectations traps is set", appeal: 0.02, momentum: 5 },
      ],
    },

    "2016": {
      id: "2016",
      year: 2016,
      label: "2016 · Turnbull v. Shorten",
      tagline: "May 2016. A double dissolution, a $50 billion company tax cut and a leader who promised to be a different kind of prime minister. An eight-week campaign for a one-seat majority.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { economy_jobs: 0.85, medicare: 0.75, taxes: 0.6, housing: 0.5, budget_debt: 0.5, energy_climate: 0.35, border_security: 0.3 },
      regions: {
        NSW:  { v: { lnp: 0.42, alp: 0.37, grn: 0.09, oth: 0.07, ind: 0.04, onp: 0.01 }, s: { alp: 24, lnp: 23 } },
        VIC:  { v: { lnp: 0.42, alp: 0.36, grn: 0.13, oth: 0.06, ind: 0.03 }, s: { alp: 18, lnp: 17, grn: 1, ind: 1 } },
        QLD:  { v: { lnp: 0.43, alp: 0.31, grn: 0.09, oth: 0.06, onp: 0.06, ind: 0.05 }, s: { lnp: 21, alp: 8, ind: 1 } },
        WA:   { v: { lnp: 0.49, alp: 0.32, grn: 0.12, oth: 0.06, ind: 0.01 }, s: { lnp: 11, alp: 5 } },
        SA:   { v: { lnp: 0.35, alp: 0.32, ind: 0.22, grn: 0.06, oth: 0.05 }, s: { alp: 6, lnp: 4, ind: 1 } },
        TAS:  { v: { alp: 0.38, lnp: 0.35, grn: 0.10, ind: 0.09, oth: 0.08 }, s: { alp: 4, ind: 1 } },
        ACT:  { v: { alp: 0.44, lnp: 0.35, grn: 0.15, oth: 0.04, ind: 0.02 }, s: { alp: 2 } },
        NT:   { v: { alp: 0.41, lnp: 0.33, oth: 0.11, grn: 0.09, ind: 0.06 }, s: { alp: 2 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au16_budget", headline: "The budget's $50 billion company tax cut becomes the argument of the first week, and {party} pitches 'jobs and growth' to voters who want relief at home", role: "any", party: "lnp", weight: 1, appeal: -0.015, momentum: -4, turn: 0 },
        { id: "au16_negative_gearing", headline: "Labor's plan to limit negative gearing and capital gains discounts sparks a property-owner backlash against {party}", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -5, turn: 1 },
        { id: "au16_super_changes", headline: "The budget's superannuation changes anger the Liberal base, and {party} pays for its own measures in the older suburbs", role: "any", party: "lnp", weight: 1, appeal: -0.02, momentum: -5, turn: 2 },
        { id: "au16_brexit", headline: "Britain votes to leave the European Union with a week to go, and {party} leans on a steady-hand argument as markets lurch", role: "any", party: "lnp", weight: 1, appeal: 0.02, momentum: 5, turn: 3 },
        { id: "au16_mediscare", headline: "Text messages claim the Coalition will privatise Medicare, and {party}'s 'Mediscare' becomes the most effective week of the trail", role: "any", party: "alp", weight: 1, appeal: 0.04, momentum: 12, turn: 4 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au16_double_dissolution", headline: "The Senate standoff over the building industry watchdog gives {party} its reason for an early election: jobs against union power", role: "any", party: "lnp", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "au16_nbn_raid", headline: "Federal police raid Labor staff over NBN leaks in mid-campaign, and {party} paints it as a political stunt", role: "any", party: "alp", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "au16_shorten_earnest", headline: "Shorten's earnest, daily-announcement campaign style wears on some voters and wins others for {party}", role: "any", party: "alp", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "au16_xenophon", headline: "Nick Xenophon's new team surges in South Australia, and {party} loses its suburban margin there", role: "any", party: "lnp", weight: 2, appeal: -0.015, momentum: -4 },
      ],
    },
    "2013": {
      id: "2013",
      year: 2013,
      label: "2013 · Abbott v. Rudd",
      tagline: "August 2013. Labor has swapped its leader again and brought back the man it dumped three years ago. The Coalition has three-word slogans and a big lead. Five weeks to decide whether the party that could not govern itself can govern the country.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { border_security: 0.75, economy_jobs: 0.7, energy_climate: 0.6, cost_of_living: 0.55, budget_debt: 0.55, education: 0.4 },
      regions: {
        NSW:  { v: { lnp: 0.47, alp: 0.35, oth: 0.08, grn: 0.08, ind: 0.02 }, s: { lnp: 30, alp: 18 } },
        VIC:  { v: { lnp: 0.42, alp: 0.35, grn: 0.11, oth: 0.10, ind: 0.02 }, s: { alp: 19, lnp: 16, grn: 1, ind: 1 } },
        QLD:  { v: { lnp: 0.46, alp: 0.30, oth: 0.14, grn: 0.06, ind: 0.04 }, s: { lnp: 22, alp: 6, ind: 2 } },
        WA:   { v: { lnp: 0.50, alp: 0.29, grn: 0.10, oth: 0.10, ind: 0.01 }, s: { lnp: 12, alp: 3 } },
        SA:   { v: { lnp: 0.44, alp: 0.36, oth: 0.10, grn: 0.08, ind: 0.02 }, s: { lnp: 6, alp: 5 } },
        TAS:  { v: { lnp: 0.40, alp: 0.35, oth: 0.09, grn: 0.08, ind: 0.08 }, s: { lnp: 3, alp: 1, ind: 1 } },
        ACT:  { v: { alp: 0.43, lnp: 0.35, grn: 0.13, oth: 0.09 }, s: { alp: 2 } },
        NT:   { v: { lnp: 0.42, alp: 0.37, oth: 0.12, grn: 0.08, ind: 0.01 }, s: { lnp: 1, alp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au13_rudd_returns", headline: "Kevin Rudd is restored as prime minister weeks before the election is called, and {party} gets a bounce in the polls", role: "any", party: "alp", weight: 1, appeal: 0.03, momentum: 9, turn: 0 },
        { id: "au13_png", headline: "The PNG deal: no asylum seeker arriving by boat will ever settle in Australia, and {party} tries to close the gap on border control", role: "any", party: "alp", weight: 1, appeal: 0.01, momentum: 3, turn: 1 },
        { id: "au13_suppository", headline: "Abbott's 'suppository of wisdom' slip and an awkward remark about a candidate hand {party} two days of bad headlines", role: "any", party: "lnp", weight: 1, appeal: -0.025, momentum: -7, turn: 2 },
        { id: "au13_paid_parental", headline: "{party}'s generous paid parental leave scheme, funded by a levy on big companies, splits its own supporters", role: "any", party: "lnp", weight: 1, appeal: -0.015, momentum: -4, turn: 3 },
        { id: "au13_costings", headline: "The Coalition releases the rest of its costings two days before the poll, and Labor says there is a hole in {party}'s budget plans", role: "any", party: "lnp", weight: 1, appeal: -0.02, momentum: -5, turn: 4 },
        { id: "au13_feud", headline: "Six years of leadership feuding hang over {party}'s final week and no policy can outrun it", role: "any", party: "alp", weight: 1, appeal: -0.03, momentum: -9, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au13_axe_the_tax", headline: "'Axe the tax': {party}'s three-word slogan on the carbon price needs no explaining", role: "any", party: "lnp", weight: 3, appeal: 0.03, momentum: 9 },
        { id: "au13_stop_the_boats", headline: "'Stop the boats': {party}'s three-word slogan on asylum seekers needs no explaining either", role: "any", party: "lnp", weight: 3, appeal: 0.03, momentum: 9 },
        { id: "au13_palmer_blitz", headline: "Clive Palmer's party floods the airwaves in Queensland and splits the vote, and {party} loses ground", role: "any", party: "lnp", weight: 2, appeal: -0.015, momentum: -4 },
        { id: "au13_kick_this_mob", headline: "A tabloid front page tells readers to kick this mob out, and {party} faces a hostile press in the final week", role: "any", party: "alp", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },
    "2010": {
      id: "2010",
      year: 2010,
      label: "2010 · Gillard v. Abbott",
      tagline: "July 2010. A first-term prime minister has been replaced overnight by his deputy, the mining tax is hot and the climate bill is dead. Five weeks to decide, and nobody is sure the result will be a majority.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { economy_jobs: 0.7, border_security: 0.6, energy_climate: 0.55, cost_of_living: 0.5, medicare: 0.4, budget_debt: 0.4, education: 0.3 },
      regions: {
        NSW:  { v: { lnp: 0.45, alp: 0.37, grn: 0.10, ind: 0.04, oth: 0.04 }, s: { alp: 26, lnp: 20, ind: 2 } },
        VIC:  { v: { alp: 0.42, lnp: 0.40, grn: 0.13, oth: 0.04, ind: 0.01 }, s: { alp: 22, lnp: 14, grn: 1 } },
        QLD:  { v: { lnp: 0.47, alp: 0.34, grn: 0.11, oth: 0.05, ind: 0.03 }, s: { lnp: 21, alp: 8, ind: 1 } },
        WA:   { v: { lnp: 0.47, alp: 0.31, grn: 0.13, oth: 0.05, ind: 0.04 }, s: { lnp: 11, alp: 3, ind: 1 } },
        SA:   { v: { alp: 0.40, lnp: 0.40, grn: 0.12, oth: 0.07, ind: 0.01 }, s: { alp: 6, lnp: 5 } },
        TAS:  { v: { alp: 0.43, lnp: 0.34, grn: 0.17, ind: 0.05, oth: 0.01 }, s: { alp: 4, ind: 1 } },
        ACT:  { v: { alp: 0.45, lnp: 0.35, grn: 0.19, oth: 0.01 }, s: { alp: 2 } },
        NT:   { v: { lnp: 0.41, alp: 0.38, grn: 0.13, ind: 0.04, oth: 0.02, onp: 0.02 }, s: { lnp: 1, alp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au10_coup", headline: "Julia Gillard replaces Kevin Rudd in an overnight coup, and {party} goes to the polls with a new leader and an old grievance", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -5, turn: 0 },
        { id: "au10_mining_tax", headline: "The super profits tax on miners is settled in days, but {party} still wears the fight", role: "any", party: "alp", weight: 1, appeal: -0.015, momentum: -4, turn: 1 },
        { id: "au10_citizens_assembly", headline: "{party}'s promise of a citizens' assembly on climate change is mocked as a retreat from a 'great moral challenge'", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -5, turn: 2 },
        { id: "au10_cabinet_leaks", headline: "Cabinet leaks suggest Gillard opposed pension rises and paid parental leave, and {party} is thrown off message", role: "any", party: "alp", weight: 1, appeal: -0.035, momentum: -10, turn: 3 },
        { id: "au10_costing_error", headline: "The Coalition's costings show an $11 billion error and its shadow treasurer is forced into a hurried correction, hurting {party}", role: "any", party: "lnp", weight: 1, appeal: -0.03, momentum: -8, turn: 4 },
        { id: "au10_greens_record", headline: "The Greens reach a record high in the polls, and {party} looks set to win its first House seat at a general election", role: "any", party: "grn", weight: 1, appeal: 0.03, momentum: 8, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au10_real_julia", headline: "The 'real Julia' reset sets the leader loose, and the campaign starts to lift for {party}", role: "any", party: "alp", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "au10_stop_boats", headline: "Boats and a 'stop the boats' slogan push outer-suburban voters toward {party}", role: "any", party: "lnp", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "au10_nbn_clash", headline: "The National Broadband Network is the clearest policy gap of the campaign, and {party} takes the argument to the suburbs", role: "any", party: "alp", weight: 2, appeal: 0.015, momentum: 5 },
      ],
    },
    "2007": {
      id: "2007",
      year: 2007,
      label: "2007 · Rudd v. Howard",
      tagline: "October 2007. Eleven years of Howard government, a booming economy, and a new Labor leader who promises to be a conservative on money and a reformer on everything else. Six weeks to decide whether it is time.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { industrial_relations: 0.85, energy_climate: 0.7, economy_jobs: 0.6, education: 0.5, cost_of_living: 0.5, border_security: 0.3, housing: 0.3 },
      regions: {
        NSW:  { v: { alp: 0.44, lnp: 0.41, grn: 0.08, oth: 0.04, ind: 0.03 }, s: { alp: 28, lnp: 20, ind: 1 } },
        VIC:  { v: { alp: 0.45, lnp: 0.41, grn: 0.08, oth: 0.05, ind: 0.01 }, s: { alp: 21, lnp: 16 } },
        QLD:  { v: { lnp: 0.44, alp: 0.43, grn: 0.06, oth: 0.04, ind: 0.03 }, s: { alp: 15, lnp: 13, ind: 1 } },
        WA:   { v: { lnp: 0.47, alp: 0.37, grn: 0.09, oth: 0.04, ind: 0.02, onp: 0.01 }, s: { lnp: 11, alp: 4 } },
        SA:   { v: { alp: 0.43, lnp: 0.43, grn: 0.07, oth: 0.06, ind: 0.01 }, s: { alp: 6, lnp: 5 } },
        TAS:  { v: { alp: 0.44, lnp: 0.38, grn: 0.13, oth: 0.03, ind: 0.02 }, s: { alp: 5 } },
        ACT:  { v: { alp: 0.51, lnp: 0.33, grn: 0.13, oth: 0.02, ind: 0.01 }, s: { alp: 2 } },
        NT:   { v: { alp: 0.47, lnp: 0.41, grn: 0.08, ind: 0.03, oth: 0.01 }, s: { alp: 2 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au07_kevin07", headline: "'Kevin07': {party}'s economic-conservative brand and the 'me too' on money wins a hearing from swinging voters", role: "any", party: "alp", weight: 1, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "au07_workchoices", headline: "The 'Your Rights at Work' campaign turns WorkChoices into a loss of penalty rates in every marginal seat, and {party} cannot shake it", role: "any", party: "lnp", weight: 1, appeal: -0.035, momentum: -10, turn: 3 },
        { id: "au07_tax_cuts", headline: "Billions in tax cuts and a record surplus: {party} leans on the strongest economy in a generation", role: "any", party: "lnp", weight: 1, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "au07_rate_rise", headline: "The Reserve Bank lifts interest rates in the middle of the campaign, and the 'keep rates low' pledge sinks {party}", role: "any", party: "lnp", weight: 1, appeal: -0.03, momentum: -9, turn: 4 },
        { id: "au07_worm_debate", headline: "The audience dial turns for {party}'s leader in the one leaders' debate of the campaign", role: "any", party: "alp", weight: 1, appeal: 0.03, momentum: 9, turn: 2 },
        { id: "au07_bennelong", headline: "Maxine McKew challenges the prime minister in Bennelong, and {party}'s leader fights for his own seat", role: "any", party: "lnp", weight: 1, appeal: -0.025, momentum: -7, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au07_kyoto", headline: "Rudd promises to ratify the Kyoto Protocol, and {party}'s pledge on climate wins younger voters", role: "any", party: "alp", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "au07_succession", headline: "The pledge of a handover to Costello is a distraction: voters ask who is in charge of {party}", role: "any", party: "lnp", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "au07_education_revolution", headline: "The 'education revolution' and laptops for senior students play to parents, and {party} gains", role: "any", party: "alp", weight: 2, appeal: 0.015, momentum: 5 },
      ],
    },
    "2004": {
      id: "2004",
      year: 2004,
      label: "2004 · Howard v. Latham",
      tagline: "August 2004. A prime minister who says he is the one to trust on interest rates, a young Labor leader with big ideas. Six weeks to decide.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { economy_jobs: 0.65, border_security: 0.6, education: 0.5, medicare: 0.6, taxes: 0.45, energy_climate: 0.3 },
      regions: {
        NSW:  { v: { lnp: 0.46, alp: 0.37, grn: 0.08, oth: 0.04, ind: 0.04, onp: 0.01 }, s: { lnp: 27, alp: 21, ind: 2 } },
        VIC:  { v: { lnp: 0.47, alp: 0.40, grn: 0.08, oth: 0.04, ind: 0.01 }, s: { alp: 19, lnp: 18 } },
        QLD:  { v: { lnp: 0.49, alp: 0.35, oth: 0.06, grn: 0.05, ind: 0.03, onp: 0.02 }, s: { lnp: 21, alp: 6, ind: 1 } },
        WA:   { v: { lnp: 0.48, alp: 0.35, grn: 0.08, oth: 0.05, onp: 0.03, ind: 0.01 }, s: { lnp: 10, alp: 5 } },
        SA:   { v: { lnp: 0.49, alp: 0.37, oth: 0.06, grn: 0.05, ind: 0.02, onp: 0.01 }, s: { lnp: 8, alp: 3 } },
        TAS:  { v: { alp: 0.44, lnp: 0.42, grn: 0.10, oth: 0.04 }, s: { alp: 3, lnp: 2 } },
        ACT:  { v: { alp: 0.50, lnp: 0.35, grn: 0.11, oth: 0.04 }, s: { alp: 2 } },
        NT:   { v: { alp: 0.44, lnp: 0.44, grn: 0.06, oth: 0.04, ind: 0.02 }, s: { alp: 1, lnp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au04_who_trust", headline: "'Who do you trust?' With interest rates at record lows, {party} tells voters it is the one that keeps the mortgage rate down", role: "any", party: "lnp", weight: 1, appeal: 0.03, momentum: 9, turn: 0 },
        { id: "au04_jakarta", headline: "The bombing of the Australian embassy in Jakarta puts security on the agenda, and {party} gains in a week of caution", role: "any", party: "lnp", weight: 1, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "au04_handshake", headline: "The handshake: Latham appears to haul Howard towards him outside a radio studio the day before the poll, and {party}'s leader is branded aggressive", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -5, turn: 5 },
        { id: "au04_tasmanian_forests", headline: "Labor's plan to protect Tasmania's old-growth forests draws fire from timber workers and the state Labor premier, and {party} loses ground in the island's marginal seats", role: "any", party: "alp", weight: 1, appeal: -0.03, momentum: -8, turn: 4 },
        { id: "au04_medicare_gold", headline: "'Medicare Gold' and a bidding war on family payments: {party}'s big spending offers are picked apart", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -5, turn: 3 },
        { id: "au04_family_first", headline: "Family First preferences flow to {party} in the marginal seats", role: "any", party: "lnp", weight: 1, appeal: 0.015, momentum: 4, turn: 2 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au04_iraq_withdrawal", headline: "Latham pledges to bring the troops home from Iraq by Christmas, and the government attacks it as a threat to the American alliance, hurting {party}", role: "any", party: "alp", weight: 2, appeal: -0.02, momentum: -6 },
        { id: "au04_greens_rise", headline: "The Greens poll at a record level in the cities, and {party} gains disaffected Labor voters", role: "any", party: "grn", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "au04_rates_ads", headline: "A relentless advertising campaign on interest rates reaches suburban mortgage-holders, and {party} slides", role: "any", party: "alp", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },
    "2001": {
      id: "2001",
      year: 2001,
      label: "2001 · Howard v. Beazley",
      tagline: "October 2001. A freighter full of asylum seekers, the September 11 attacks, and an airline collapsed into administration. A government that was behind all year goes to the polls ahead.",
      majority: { total: 150, threshold: 76 },
      goalText: "76 of 150 seats",
      salience: { border_security: 0.95, economy_jobs: 0.5, taxes: 0.55, medicare: 0.45, education: 0.3, immigration: 0.45 },
      regions: {
        NSW:  { v: { lnp: 0.42, alp: 0.37, oth: 0.07, onp: 0.05, grn: 0.05, ind: 0.04 }, s: { lnp: 28, alp: 20, ind: 2 } },
        VIC:  { v: { lnp: 0.42, alp: 0.42, oth: 0.07, grn: 0.06, ind: 0.02, onp: 0.01 }, s: { alp: 20, lnp: 17 } },
        QLD:  { v: { lnp: 0.45, alp: 0.34, onp: 0.07, ind: 0.07, oth: 0.04, grn: 0.03 }, s: { lnp: 19, alp: 7, ind: 1 } },
        WA:   { v: { lnp: 0.43, alp: 0.37, oth: 0.07, onp: 0.06, grn: 0.06, ind: 0.01 }, s: { lnp: 8, alp: 7 } },
        SA:   { v: { lnp: 0.45, alp: 0.34, oth: 0.11, onp: 0.05, grn: 0.04, ind: 0.01 }, s: { lnp: 9, alp: 3 } },
        TAS:  { v: { alp: 0.47, lnp: 0.37, grn: 0.08, oth: 0.05, onp: 0.03 }, s: { alp: 5 } },
        ACT:  { v: { alp: 0.47, lnp: 0.32, oth: 0.11, grn: 0.07, onp: 0.03 }, s: { alp: 2 } },
        NT:   { v: { alp: 0.43, lnp: 0.41, oth: 0.05, grn: 0.04, onp: 0.04, ind: 0.03 }, s: { alp: 1, lnp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au01_tampa", headline: "The government refuses entry to a Norwegian freighter carrying 433 rescued asylum seekers, and {party} owns the border protection argument", role: "any", party: "lnp", weight: 1, appeal: 0.035, momentum: 11, turn: 0 },
        { id: "au01_children_overboard", headline: "Ministers claim asylum seekers threw their children overboard, and {party} turns the Navy's story into a campaign weapon", role: "any", party: "lnp", weight: 1, appeal: 0.025, momentum: 8, turn: 2 },
        { id: "au01_security", headline: "September 11 reshapes the campaign: {party} offers steady hands and a war-on-terror consensus", role: "any", party: "lnp", weight: 1, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "au01_labor_me_too", headline: "Labor backs the border laws and the troop commitment to Afghanistan, and {party}'s leader struggles to define a difference", role: "any", party: "alp", weight: 1, appeal: -0.03, momentum: -8, turn: 3 },
        { id: "au01_ansett_gst", headline: "The Ansett collapse and GST paperwork give {party} a hearing among small business in the outer suburbs", role: "any", party: "alp", weight: 1, appeal: 0.02, momentum: 5, turn: 4 },
        { id: "au01_launch", headline: "At the campaign launch, the prime minister says 'we will decide who comes to this country', and {party}'s base roars", role: "any", party: "lnp", weight: 1, appeal: 0.03, momentum: 9, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au01_greens_tampa", headline: "The Greens oppose the Tampa policy and reach their best vote yet, and {party} picks up disaffected Labor voters", role: "any", party: "grn", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "au01_telstra_bush", headline: "Telstra's sale and bush services become a country-seat issue, and {party} loses ground in the regions", role: "any", party: "lnp", weight: 2, appeal: -0.015, momentum: -4 },
        { id: "au01_one_nation_fades", headline: "One Nation falls from its 1998 peak, and {party} wins back some of the right's protest vote", role: "any", party: "lnp", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },
    "1998": {
      id: "1998",
      year: 1998,
      label: "1998 · Howard v. Beazley",
      tagline: "August 1998. A government that wants a ten percent consumption tax, an opposition that wants to stop it, and a new right-wing party that is winning seats in Queensland. Five weeks to decide.",
      majority: { total: 148, threshold: 75 },
      goalText: "75 of 148 seats",
      salience: { taxes: 0.9, economy_jobs: 0.6, medicare: 0.45, education: 0.3, border_security: 0.25, immigration: 0.3 },
      regions: {
        NSW:  { v: { alp: 0.40, lnp: 0.38, onp: 0.09, oth: 0.07, grn: 0.03, ind: 0.03 }, s: { lnp: 27, alp: 22, ind: 1 } },
        VIC:  { v: { alp: 0.44, lnp: 0.40, oth: 0.09, onp: 0.04, grn: 0.02, ind: 0.01 }, s: { alp: 19, lnp: 18 } },
        QLD:  { v: { lnp: 0.42, alp: 0.36, onp: 0.14, oth: 0.05, grn: 0.02, ind: 0.01 }, s: { lnp: 19, alp: 8 } },
        WA:   { v: { lnp: 0.40, alp: 0.36, onp: 0.09, oth: 0.07, grn: 0.05, ind: 0.03 }, s: { lnp: 7, alp: 7 } },
        SA:   { v: { lnp: 0.43, alp: 0.34, oth: 0.12, onp: 0.10, ind: 0.01 }, s: { lnp: 9, alp: 3 } },
        TAS:  { v: { alp: 0.49, lnp: 0.38, grn: 0.06, oth: 0.05, onp: 0.02 }, s: { alp: 5 } },
        ACT:  { v: { alp: 0.50, lnp: 0.31, oth: 0.09, onp: 0.05, grn: 0.04, ind: 0.01 }, s: { alp: 2 } },
        NT:   { v: { alp: 0.42, lnp: 0.40, onp: 0.08, oth: 0.06, grn: 0.03, ind: 0.01 }, s: { alp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au98_gst_launch", headline: "The prime minister calls the election on a 10 percent consumption tax with income tax cuts, and {party} takes the biggest gamble of its time in office", role: "any", party: "lnp", weight: 1, appeal: -0.02, momentum: -6, turn: 0 },
        { id: "au98_waterfront", headline: "The waterfront dispute of April still colours the campaign, and {party}'s fight with the union divides voters", role: "any", party: "lnp", weight: 1, appeal: -0.015, momentum: -4, turn: 1 },
        { id: "au98_no_gst", headline: "The 'no GST' campaign finds an audience as voters worry about the price of everyday items, and {party} gains", role: "any", party: "alp", weight: 1, appeal: 0.025, momentum: 8, turn: 2 },
        { id: "au98_one_nation", headline: "Pauline Hanson's One Nation, fresh from winning eleven Queensland seats, splits the vote in regional seats, and {party} loses ground", role: "any", party: "lnp", weight: 1, appeal: -0.02, momentum: -6, turn: 3 },
        { id: "au98_preferences", headline: "Both big parties put One Nation last on how-to-vote cards, and its preferences help {party} in the key seats", role: "any", party: "lnp", weight: 1, appeal: 0.02, momentum: 5, turn: 4 },
        { id: "au98_marginals", headline: "The swing is large in safe seats and small in the marginals, and {party} cannot turn its popular vote into a majority", role: "any", party: "alp", weight: 1, appeal: -0.025, momentum: -7, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au98_asian_crisis", headline: "The Asian financial crisis makes steady economic management the argument, and {party} offers experience as insurance", role: "any", party: "lnp", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "au98_native_title", headline: "The native title fight divides rural and city voters, and {party} is caught in the middle", role: "any", party: "lnp", weight: 2, appeal: -0.015, momentum: -4 },
        { id: "au98_greens_gst", headline: "The Greens campaign against the GST and their preferences flow strongly to Labor, and {party} picks up a few city votes", role: "any", party: "grn", weight: 2, appeal: 0.01, momentum: 3 },
      ],
    },
    "1996": {
      id: "1996",
      year: 1996,
      label: "1996 · Howard v. Keating",
      tagline: "January 1996. Thirteen years of Labor government, a prime minister who says he is the better economic manager, and a Liberal leader who says he will be relaxed and comfortable. Five weeks to decide whether it is time.",
      majority: { total: 148, threshold: 75 },
      goalText: "75 of 148 seats",
      salience: { economy_jobs: 0.8, medicare: 0.6, taxes: 0.5, budget_debt: 0.5, education: 0.3, immigration: 0.3 },
      regions: {
        NSW:  { v: { lnp: 0.45, alp: 0.40, oth: 0.10, grn: 0.03, ind: 0.02 }, s: { lnp: 29, alp: 20, ind: 1 } },
        VIC:  { v: { lnp: 0.44, alp: 0.43, oth: 0.09, grn: 0.02, ind: 0.02 }, s: { lnp: 21, alp: 16 } },
        QLD:  { v: { lnp: 0.54, alp: 0.34, oth: 0.08, grn: 0.03, ind: 0.01 }, s: { lnp: 23, alp: 2, ind: 1 } },
        WA:   { v: { lnp: 0.45, alp: 0.35, ind: 0.09, oth: 0.06, grn: 0.05 }, s: { lnp: 8, alp: 3, ind: 3 } },
        SA:   { v: { lnp: 0.50, alp: 0.35, oth: 0.11, grn: 0.03, ind: 0.01 }, s: { lnp: 10, alp: 2 } },
        TAS:  { v: { lnp: 0.45, alp: 0.44, grn: 0.06, oth: 0.05 }, s: { alp: 3, lnp: 2 } },
        ACT:  { v: { alp: 0.48, lnp: 0.41, grn: 0.09, ind: 0.02 }, s: { alp: 3 } },
        NT:   { v: { lnp: 0.46, alp: 0.43, grn: 0.06, ind: 0.05 }, s: { lnp: 1 } },
      },
      events: [
        // Scheduled beats, in order.
        { id: "au96_keating_calls", headline: "Keating calls the election for 2 March, and {party} starts behind in every poll after thirteen years in government", role: "any", party: "alp", weight: 1, appeal: -0.02, momentum: -6, turn: 0 },
        { id: "au96_never_ever", headline: "'Never, ever' a GST: Howard's promise to rule out a consumption tax takes the biggest issue of the last election off the table for {party}", role: "any", party: "lnp", weight: 1, appeal: 0.03, momentum: 9, turn: 1 },
        { id: "au96_medicare_safe", headline: "Labor's Medicare scare is neutralised by a Coalition pledge that Medicare is safe, and {party} gains from the reassurance", role: "any", party: "lnp", weight: 1, appeal: 0.015, momentum: 4, turn: 2 },
        { id: "au96_relaxed_comfortable", headline: "'Relaxed and comfortable': {party} offers a steady hand to voters tired of thirteen years of reform", role: "any", party: "lnp", weight: 1, appeal: 0.025, momentum: 7, turn: 3 },
        { id: "au96_hanson", headline: "The Liberals withdraw support from Pauline Hanson over remarks on Indigenous funding, but her name stays on the ballot as {party}'s candidate", role: "any", party: "lnp", weight: 1, appeal: -0.015, momentum: -4, turn: 4 },
        { id: "au96_its_time", headline: "Time for a change: thirteen years in, {party} is weighed down by voters who want a new government", role: "any", party: "alp", weight: 1, appeal: -0.03, momentum: -9, turn: 5 },
        // Unscheduled flavor: joins the weekly draw, fires at most once.
        { id: "au96_battlers", headline: "The Howard 'battlers' pitch wins over suburban working families, and {party} gains", role: "any", party: "lnp", weight: 3, appeal: 0.03, momentum: 9 },
        { id: "au96_willis_letter", headline: "The treasurer releases a letter said to be Howard's secret correspondence, Howard calls it a forgery, and {party} spends the last week defending the stunt", role: "any", party: "alp", weight: 2, appeal: -0.02, momentum: -6 },
        { id: "au96_keating_manager", headline: "Keating argues he is the better manager of the recovery, and {party} makes a late argument on jobs", role: "any", party: "alp", weight: 2, appeal: 0.015, momentum: 5 },
      ],
    },
  },

  leaders: {
    "2025": {
      alp: { partyId: "alp", name: "Anthony Albanese", charisma: 56, energy: 64, competence: 70, machine: 84 },
      lnp: { partyId: "lnp", name: "Peter Dutton", charisma: 42, energy: 74, competence: 62, machine: 72 },
      grn: { partyId: "grn", name: "Adam Bandt", charisma: 60, energy: 70, competence: 58, machine: 46 },
    },
    "2022": {
      alp: { partyId: "alp", name: "Anthony Albanese", charisma: 58, energy: 66, competence: 64, machine: 78 },
      lnp: { partyId: "lnp", name: "Scott Morrison", charisma: 48, energy: 70, competence: 58, machine: 80 },
      grn: { partyId: "grn", name: "Adam Bandt", charisma: 62, energy: 72, competence: 56, machine: 44 },
    },
    "2019": {
      alp: { partyId: "alp", name: "Bill Shorten", charisma: 44, energy: 60, competence: 62, machine: 74 },
      lnp: { partyId: "lnp", name: "Scott Morrison", charisma: 50, energy: 72, competence: 56, machine: 78 },
      grn: { partyId: "grn", name: "Richard Di Natale", charisma: 54, energy: 60, competence: 58, machine: 44 },
    },
    "2016": {
      lnp: { partyId: "lnp", name: "Malcolm Turnbull", charisma: 58, energy: 62, competence: 70, machine: 66 },
      alp: { partyId: "alp", name: "Bill Shorten", charisma: 46, energy: 70, competence: 64, machine: 76 },
      grn: { partyId: "grn", name: "Richard Di Natale", charisma: 54, energy: 60, competence: 58, machine: 44 },
    },
    "2013": {
      lnp: { partyId: "lnp", name: "Tony Abbott", charisma: 42, energy: 76, competence: 54, machine: 80 },
      alp: { partyId: "alp", name: "Kevin Rudd", charisma: 50, energy: 72, competence: 62, machine: 56 },
      grn: { partyId: "grn", name: "Christine Milne", charisma: 48, energy: 56, competence: 56, machine: 40 },
    },
    "2010": {
      alp: { partyId: "alp", name: "Julia Gillard", charisma: 62, energy: 70, competence: 68, machine: 76 },
      lnp: { partyId: "lnp", name: "Tony Abbott", charisma: 46, energy: 78, competence: 54, machine: 70 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 66, energy: 66, competence: 58, machine: 48 },
    },
    "2007": {
      alp: { partyId: "alp", name: "Kevin Rudd", charisma: 64, energy: 82, competence: 74, machine: 82 },
      lnp: { partyId: "lnp", name: "John Howard", charisma: 46, energy: 70, competence: 80, machine: 82 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 66, energy: 66, competence: 58, machine: 46 },
    },
    "2004": {
      lnp: { partyId: "lnp", name: "John Howard", charisma: 46, energy: 68, competence: 82, machine: 86 },
      alp: { partyId: "alp", name: "Mark Latham", charisma: 60, energy: 76, competence: 54, machine: 64 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 64, energy: 64, competence: 58, machine: 44 },
    },
    "2001": {
      lnp: { partyId: "lnp", name: "John Howard", charisma: 44, energy: 66, competence: 78, machine: 84 },
      alp: { partyId: "alp", name: "Kim Beazley", charisma: 56, energy: 62, competence: 66, machine: 76 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 62, energy: 62, competence: 56, machine: 42 },
    },
    "1998": {
      lnp: { partyId: "lnp", name: "John Howard", charisma: 44, energy: 64, competence: 76, machine: 80 },
      alp: { partyId: "alp", name: "Kim Beazley", charisma: 54, energy: 62, competence: 64, machine: 74 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 60, energy: 60, competence: 54, machine: 40 },
    },
    "1996": {
      lnp: { partyId: "lnp", name: "John Howard", charisma: 40, energy: 62, competence: 72, machine: 74 },
      alp: { partyId: "alp", name: "Paul Keating", charisma: 66, energy: 74, competence: 80, machine: 82 },
      grn: { partyId: "grn", name: "Bob Brown", charisma: 60, energy: 60, competence: 54, machine: 40 },
    },
  },

  // The standing Australian repertoire, any cycle.
  events: [
    { id: "newspoll_shock", headline: "Newspoll lands with a shock swing to {party}", role: "any", weight: 3, appeal: 0.03, momentum: 9 },
    { id: "newspoll_slide", headline: "Newspoll shows {party} bleeding primary vote", role: "any", weight: 3, appeal: -0.03, momentum: -8 },
    { id: "talkback_pileon", headline: "Talkback radio piles on {party} for a week straight", role: "any", weight: 2, appeal: -0.025, momentum: -6 },
    { id: "candidate_disendorsed", headline: "{party} disendorses a candidate over old social-media posts", role: "any", weight: 2, appeal: -0.025, momentum: -5 },
    { id: "preference_row", headline: "A preference-deal row engulfs {party} as how-to-vote cards become the story", role: "any", weight: 2, appeal: -0.02, momentum: -5 },
    { id: "palmer_blitz", headline: "Clive Palmer's yellow ad blitz clogs every feed, and {party} can't buy a headline", role: "any", weight: 2, appeal: -0.02, momentum: -4 },
    { id: "sausage_sizzle", headline: "Democracy-sausage energy: booth volunteers turn out in droves for {party}", role: "player", weight: 2, appeal: 0.02, momentum: 6 },
    { id: "costings_hole", headline: "A costings black hole dominates {party}'s week", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "premier_endorsement", headline: "State premiers and local mayors rally behind {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "debate_win", headline: "{party} judged the winner of the leaders' debate", role: "any", weight: 3, appeal: 0.03, momentum: 10 },
    {
      id: "debate_call",
      headline: "The networks offer {party} a leaders' debate slot",
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
      id: "preference_fork",
      headline: "{party} HQ is split on preference deals",
      role: "player",
      weight: 3,
      prompt: "How-to-vote cards are everything. What's the play?",
      choices: [
        { id: "broad", text: "Deal broadly to maximise preferences", resultText: "The arithmetic looks better. Purity politics takes a hit.", appeal: 0.02, momentum: 5 },
        { id: "pure", text: "Stay pure: no deals with the fringe", resultText: "Your base cheers. A few seats get harder.", appeal: 0.01, momentum: 3 },
        { id: "contrast", text: "Weaponise the rival's preference deals", resultText: "You change the subject, and it mostly works.", appeal: 0.015, momentum: 4, rivalAppeal: -0.02 },
      ],
    },
    {
      id: "platform_fork",
      headline: "{party}'s platform committee is split on the big pledge",
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
}, ["debate_win"]);

// Registry rows, store pack, daily pairing and "play next" chain.
export const AUSTRALIA_MODULE = countryModule(AUSTRALIA, {
  blurb: "Preferential voting across 148 to 151 seats.",
  cover: "images/covers/country-au.jpg",
  art: { a: "#082a52", b: "#126d66", glow: "rgba(247,205,79,0.22)" },
  freeElections: ["2025"],
  scenarios: [
    { electionId: "2025", difficulty: "hard",
      description: "Preferential voting, a cyclone-delayed budget, and a Trump-shaped shadow over 150 seats." },
    { electionId: "2022", difficulty: "medium",
      description: "Nine years of Coalition rule, a teal wave on the harbourside, and a PM who doesn't hold a hose." },
    { electionId: "2019", difficulty: "hard",
      description: "The unlosable election. A big-target Labor agenda, a wall of yellow ads, and a daggy-dad miracle. 151 seats under preferences." },
    { electionId: "2016", addedLater: true, difficulty: "easy",
      description: "A double dissolution, a Mediscare text campaign and an eight-week marathon. 150 seats, and a government that survives by one." },
    { electionId: "2013", addedLater: true, difficulty: "hard",
      description: "Rudd returns, the carbon tax is on trial, and the boats are the issue. 150 seats and a Coalition landslide to resist or enjoy." },
    { electionId: "2010", addedLater: true, difficulty: "easy",
      description: "A leadership coup, leaked cabinet secrets and a Greens first. 150 seats, and the first hung parliament in seventy years." },
    { electionId: "2007", addedLater: true, difficulty: "hard",
      description: "Eleven years of Howard, WorkChoices on trial, and the prime minister fighting for his own seat. 150 seats and a Labor landslide." },
    { electionId: "2004", addedLater: true, difficulty: "hard",
      description: "'Who do you trust?' on interest rates, a handshake that went wrong, and a fourth term for Howard. 150 seats." },
    { electionId: "2001", addedLater: true, difficulty: "hard",
      description: "The Tampa, September 11 and 'we will decide who comes to this country'. 150 seats and a government that wins on security." },
    { electionId: "1998", addedLater: true, difficulty: "medium",
      description: "The GST election. Labor wins more votes but not enough seats, and One Nation splits the right. 148 seats." },
    { electionId: "1996", addedLater: true, difficulty: "hard",
      description: "Thirteen years of Labor end. A weary electorate meets 'never, ever' a GST, and the Coalition wins big. 148 seats." },
  ],
  systemLabel: "Preferential voting",
  pack: {
    id: "australia",
    name: "Australia",
    description: "Eleven federal elections from 1996 to 2025. Preferential voting from the end of Keating to the teal wave: the GST, Tampa, WorkChoices, hung parliaments and the unlosable election.",
    price: 99,
  },
  daily: { pair: ["alp", "lnp"], names: { alp: "Labor", lnp: "the Coalition" } },
  next: {
    chain: [
      { id: "1996", blurb: "Continue the timeline: the end of thirteen years of Labor" },
      { id: "1998", blurb: "Continue the timeline: the GST election" },
      { id: "2001", blurb: "Continue the timeline: the Tampa election" },
      { id: "2004", blurb: "Continue the timeline: the interest rate election" },
      { id: "2007", blurb: "Continue the timeline: Kevin07" },
      { id: "2010", blurb: "Continue the timeline: the hung parliament" },
      { id: "2013", blurb: "Continue the timeline: stop the boats" },
      { id: "2016", blurb: "Continue the timeline: the double dissolution" },
      { id: "2019", blurb: "Continue the timeline: the unlosable election" },
      { id: "2022", blurb: "Continue the timeline: the teal wave" },
      { id: "2025", blurb: "Continue the timeline: hold the middle" },
    ],
  },
});
