// IRELAND: four general elections to the Dail, one bundle.
//
// Single transferable vote in multi-seat constituencies of three to five
// seats. The engine has no STV count, so this is modelled the way Australia
// models preferences: each region carries first-preference shares, and the
// transfers (vote management, the pull of a local name, the habit of numbering
// down the ballot) are already folded into the regional seat table. Seats move
// with the first-preference vote at an elasticity of 1.0, the same as the
// proportional countries, because a quota system tracks vote share closely.
// The Ceann Comhairle is returned automatically and is counted in his or her
// party's total, as in the official seat tallies.
//
// REGIONS. The 39 to 43 constituencies of each election are grouped into ten
// regions by where most of each constituency sits. The grouping is the same in
// every election, so a region means the same thing in 2011 and 2024 even
// though the constituency lines moved (166 seats in 43 constituencies in 2011,
// 158 in 40 in 2016, 160 in 39 in 2020, 174 in 43 in 2024):
//   DNO  Dublin North: Fingal, Bay North, Central, North-West (and the 2011
//        North, North-Central and North-East).
//   DSO  Dublin South: Bay South, Rathdown, Dun Laoghaire, South-Central (and
//        the 2011 South and South-East).
//   DWE  Dublin West: Mid-West, West, South-West.
//   CMB  Commuter belt: Meath East and West, Kildare North and South, Wicklow.
//   SEA  South-East: Carlow-Kilkenny, Waterford, Wexford, Wicklow-Wexford.
//   MID  Midlands: Laois, Offaly (Laois-Offaly), Longford-Westmeath.
//   COR  Cork: all five Cork constituencies.
//   MUN  Rest of Munster: Kerry, Limerick, Clare, Tipperary.
//   WES  West: Galway East and West, Mayo, Roscommon-Galway (Roscommon-South
//        Leitrim in 2011).
//   BOR  Border: Donegal, Cavan-Monaghan, Louth, Sligo-Leitrim.
//
// DATA. Every number is aggregated from first-preference counts, constituency
// by constituency, as published on the constituency pages of Wikipedia (which
// cite the official returns from the Houses of the Oireachtas and the
// constituency returning officers). Region `v` is each party's first-preference
// votes divided by all valid votes in the region. Region `s` is the count of
// real winners by party, so seats are exact and sum to the chamber. Independents
// of every stripe (including the Independent Alliance, Independents 4 Change,
// and single-member labels such as New Vision in 2011 and 100% Redress in 2024)
// are folded into `ind`, a non-playable pool. Smaller parties that never won a
// seat (Renua, the Workers' Party, Direct Democracy Ireland, the National
// Party and others) are folded into `oth`. People Before Profit-Solidarity
// stands for the United Left Alliance in 2011 (Socialist Party, People Before
// Profit and Workers and Unemployed Action) and Anti-Austerity Alliance-People
// Before Profit in 2016. Regional electorate weights are the 2024 votes cast;
// with those weights the national first-preference shares stay within 0.15
// points of the official results in every election.
//
// 2024 (29 November): 174 seats, 88 for a majority. Fianna Fail 48, Sinn Fein
// 39, Fine Gael 38, Labour 11, Social Democrats 11, Independent Ireland 4,
// PBP-Solidarity 3, Aontu 2, Greens 1, independents 17 (one of them the
// 100% Redress TD). Fianna Fail 21.9%, Fine Gael 20.8%, Sinn Fein 19.0%.
// 2020 (8 February): 160 seats, 81 for a majority. Fianna Fail 38, Sinn Fein
// 37, Fine Gael 35, Greens 12, Social Democrats 6, Labour 6, Solidarity-PBP 5,
// Aontu 1, independents 20. Sinn Fein 24.5%, Fianna Fail 22.2%, Fine Gael 20.9%.
// 2016 (26 February): 158 seats, 80 for a majority. Fine Gael 50, Fianna Fail
// 44, Sinn Fein 23, Labour 7, AAA-PBP 6, Social Democrats 3, Greens 2,
// independents 23. Fine Gael 25.5%, Fianna Fail 24.3%, Sinn Fein 13.8%.
// 2011 (25 February): 166 seats, 84 for a majority. Fine Gael 76, Labour 37,
// Fianna Fail 20, Sinn Fein 14, United Left Alliance 5, independents 14.
// Fine Gael 36.1%, Labour 19.4%, Fianna Fail 17.4%.
//
// COALITIONS are one rule set for the whole bundle, so they follow the
// settled positions rather than any one year. Fianna Fail and Fine Gael can
// govern together (they did from 2020, after backing each other's minority
// governments from 2016), but neither will govern with Sinn Fein, which both
// ruled out in 2016, 2020 and 2024. The Social Democrats, PBP-Solidarity and
// Aontu will not join Fianna Fail or Fine Gael. In 2011 that is harmless:
// Fine Gael and Labour, the actual coalition, are free to pair.

import type { CountryBundle } from "@engine/countryGame";
import { countryModule } from "./types";
import { IE_MAP } from "./paths/ie";

export const IRELAND: CountryBundle = {
  id: "IE",
  label: "Ireland",
  flag: "🇮🇪",
  currency: "€",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "88 of 174 seats",
  defaultSeatElasticity: 1.0,
  eventChance: 0.7,
  map: IE_MAP,

  system: {
    id: "IE",
    label: "Ireland",
    parties: [
      { id: "ff", name: "Fianna Fáil", shortName: "Fianna Fáil", color: "#4caf50" },
      { id: "fg", name: "Fine Gael", shortName: "Fine Gael", color: "#2f6fd1" },
      { id: "sf", name: "Sinn Féin", shortName: "Sinn Féin", color: "#00574b" },
      { id: "lab", name: "Labour Party", shortName: "Labour", color: "#d4202a" },
      { id: "grn", name: "Green Party", shortName: "Greens", color: "#99cc33" },
      { id: "sd", name: "Social Democrats", shortName: "Soc Dems", color: "#7b2d8e" },
      { id: "pbp", name: "People Before Profit-Solidarity", shortName: "PBP-Sol", color: "#8e2420" },
      { id: "aon", name: "Aontú", shortName: "Aontú", color: "#6b7f3a" },
      { id: "ii", name: "Independent Ireland", shortName: "Ind Ireland", color: "#c8782a" },
      { id: "ind", name: "Independents", shortName: "Independents", color: "#3aa6a0" },
      { id: "oth", name: "Others (Renua, Workers' Party, National Party…)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Single transferable vote (regional seat curve, transfers folded in)", unit: "seat" },
    majority: { total: 174, threshold: 88 },
  },
  playable: ["ff", "fg", "sf", "lab", "grn", "sd", "pbp", "aon"],
  abstaining: [],
  coalitions: {
    forbidden: [
      ["ff", "sf"], ["fg", "sf"],
      ["sd", "ff"], ["sd", "fg"],
      ["pbp", "ff"], ["pbp", "fg"],
      ["aon", "ff"], ["aon", "fg"],
    ],
    isolated: ["ind", "ii", "oth"],
  },
  governmentText: {
    majority: "{party} governs alone with {seats} seats, something no party has managed in the Dáil since 1977.",
    coalition: "{parties} agree a programme for government ({seats} seats), and the Taoiseach's chair goes to the larger party.",
    confidence_supply: "{lead} governs as a minority with confidence and supply from {partner}, the arrangement Fine Gael and Fianna Fáil used from 2016.",
    minority: "{party} leads a minority government on {seats} seats and leans on the independents, as Irish governments so often do.",
    hung: "No combination reaches a majority. {largest} is the largest party, and the talks run on for weeks.",
  },
  goalHint: "Reach {majority} of {total} seats, alone or with partners. Seats follow first preferences region by region, and independents hold a large block you cannot lead but can court. Fianna Fáil and Fine Gael can pair up, but neither will touch Sinn Féin.",

  issues: [
    { id: "bailout", name: "The bailout & the banks", blurb: "The bank guarantee, the Troika deal and who pays for both." },
    { id: "cost_of_living", name: "Cost of living", blurb: "Energy bills, groceries and the price of nearly everything." },
    { id: "housing", name: "Housing", blurb: "Rents, mortgages, homelessness and a country that does not build enough." },
    { id: "health", name: "Health service", blurb: "Trolleys, waiting lists and a system that never quite gets fixed." },
    { id: "tax_spending", name: "Tax & public spending", blurb: "Austerity, the universal social charge and what a surplus is for." },
    { id: "water_charges", name: "Water charges", blurb: "Irish Water, the meters and the biggest protests in a generation." },
    { id: "reform", name: "Political reform", blurb: "A smaller Dáil, no Seanad and cleaner politics after the crash." },
    { id: "brexit_unity", name: "Brexit & Irish unity", blurb: "The border, the backstop and the case for a united Ireland." },
    { id: "climate", name: "Climate & environment", blurb: "Emission targets, the farm lobby and the cost of going green." },
    { id: "immigration", name: "Immigration", blurb: "Asylum numbers, accommodation and the limits of public patience." },
  ],

  blocs: [
    { id: "young", name: "Young voters (18-34)", share: 0.22, turnoutPropensity: 0.6,
      tilt: { sf: 0.65, sd: 0.4, pbp: 0.5, grn: 0.35, lab: 0.1, ff: -0.15, fg: -0.4, ii: -0.1 } },
    { id: "graduate", name: "Professionals & graduates", share: 0.24, turnoutPropensity: 0.85,
      tilt: { fg: 0.4, lab: 0.2, sd: 0.4, grn: 0.4, ff: 0.0, sf: -0.4, pbp: -0.1, aon: -0.5, ii: -0.5 } },
    { id: "worker", name: "Urban working class", share: 0.2, turnoutPropensity: 0.62,
      tilt: { sf: 0.7, pbp: 0.5, lab: 0.15, sd: 0.1, aon: 0.1, ff: 0.0, fg: -0.3, grn: -0.3 } },
    { id: "rural", name: "Farmers & rural voters", share: 0.17, turnoutPropensity: 0.85,
      tilt: { ff: 0.3, fg: 0.35, ii: 0.8, ind: 0.4, aon: 0.2, sf: -0.15, lab: -0.3, sd: -0.4, pbp: -0.5, grn: -0.7 } },
    { id: "mortgage_belt", name: "Commuter-belt families", share: 0.25, turnoutPropensity: 0.76,
      tilt: { fg: 0.2, ff: 0.1, sf: 0.1, sd: 0.1, aon: 0.1 } },
    { id: "senior", name: "Older voters (65+)", share: 0.2, turnoutPropensity: 0.9,
      tilt: { fg: 0.4, ff: 0.5, ind: 0.1, ii: 0.2, lab: 0.0, sf: -0.6, grn: -0.3, pbp: -0.4, sd: -0.4 } },
    { id: "homeowner", name: "Homeowners & small business", share: 0.1, turnoutPropensity: 0.82,
      tilt: { ff: 0.3, fg: 0.2, ii: 0.5, ind: 0.3, sf: -0.1, lab: -0.2, grn: -0.2 } },
  ],

  // Pools are the 2024 sizes; each election's `s` table sets its own.
  // Electorate is thousands of first-preference votes cast (2024).
  regions: [
    { id: "BOR", name: "Border counties (Donegal, Cavan-Monaghan, Louth, Sligo-Leitrim)", abbr: "Border", seats: 19, electorate: 267, tile: { row: 0, col: 1 },
      profile: { rural: 1.3, worker: 1.1, homeowner: 1.1, young: 0.95 } },
    { id: "WES", name: "West (Galway, Mayo, Roscommon)", abbr: "West", seats: 17, electorate: 226, tile: { row: 1, col: 0 },
      profile: { rural: 1.7, senior: 1.15, young: 0.85, graduate: 0.9 } },
    { id: "MID", name: "Midlands (Laois, Offaly, Longford, Westmeath)", abbr: "Midlands", seats: 11, electorate: 138, tile: { row: 1, col: 1 },
      profile: { rural: 1.6, senior: 1.1, homeowner: 1.1, mortgage_belt: 0.8 } },
    { id: "CMB", name: "Commuter belt (Meath, Kildare, Wicklow)", abbr: "Commuter belt", seats: 20, electorate: 245, tile: { row: 1, col: 2 },
      profile: { mortgage_belt: 2.0, young: 1.1, graduate: 1.1, rural: 0.8, worker: 0.8 } },
    { id: "DNO", name: "Dublin North & Fingal", abbr: "Dublin North", seats: 18, electorate: 199, tile: { row: 1, col: 3 },
      profile: { worker: 1.4, young: 1.15, graduate: 1.0, rural: 0.1, mortgage_belt: 0.6 } },
    { id: "MUN", name: "Rest of Munster (Kerry, Limerick, Clare, Tipperary)", abbr: "Munster", seats: 22, electorate: 314, tile: { row: 2, col: 0 },
      profile: { rural: 1.6, senior: 1.1, homeowner: 1.2, young: 0.9 } },
    { id: "DWE", name: "Dublin West & South-West", abbr: "Dublin West", seats: 15, electorate: 159, tile: { row: 2, col: 2 },
      profile: { worker: 1.7, mortgage_belt: 1.3, young: 1.15, rural: 0.2, graduate: 0.8 } },
    { id: "DSO", name: "Dublin South & the coast", abbr: "Dublin South", seats: 16, electorate: 182, tile: { row: 2, col: 3 },
      profile: { graduate: 1.8, senior: 1.15, young: 1.0, worker: 0.5, rural: 0.05 } },
    { id: "COR", name: "Cork", abbr: "Cork", seats: 20, electorate: 260, tile: { row: 3, col: 0 },
      profile: { graduate: 1.1, worker: 1.1, rural: 1.0, young: 1.0, homeowner: 1.05 } },
    { id: "SEA", name: "South-East (Carlow-Kilkenny, Waterford, Wexford)", abbr: "South-East", seats: 16, electorate: 214, tile: { row: 3, col: 2 },
      profile: { rural: 1.4, senior: 1.1, worker: 1.0, mortgage_belt: 0.6 } },
  ],

  elections: {
    "2024": {
      id: "2024",
      year: 2024,
      label: "2024 · Harris v. Martin v. McDonald",
      tagline: "November 2024. Fianna Fáil, Fine Gael and the Greens go to the country after a giveaway budget and a new Taoiseach in Simon Harris. Sinn Féin led the polls through the housing crisis and has slipped since. Nobody is close to 88 seats, so the independents and the transfers decide it.",
      salience: { housing: 0.95, cost_of_living: 0.85, health: 0.7, immigration: 0.65, tax_spending: 0.5, climate: 0.3 },
      regions: {
        DNO: { v: { ff: 0.168, fg: 0.154, sf: 0.216, lab: 0.083, grn: 0.041, sd: 0.114, pbp: 0.043, aon: 0.036, ind: 0.120, oth: 0.023 }, s: { ff: 3, fg: 3, sf: 5, lab: 3, sd: 3, ind: 1 } },
        DSO: { v: { ff: 0.141, fg: 0.274, sf: 0.138, lab: 0.079, grn: 0.077, sd: 0.085, pbp: 0.071, aon: 0.036, ii: 0.005, ind: 0.065, oth: 0.029 }, s: { ff: 4, fg: 5, sf: 2, lab: 1, sd: 3, pbp: 1 } },
        DWE: { v: { ff: 0.180, fg: 0.177, sf: 0.242, lab: 0.066, grn: 0.035, sd: 0.057, pbp: 0.071, aon: 0.041, ii: 0.011, ind: 0.092, oth: 0.028 }, s: { ff: 3, fg: 3, sf: 4, lab: 1, grn: 1, pbp: 2, ind: 1 } },
        CMB: { v: { ff: 0.171, fg: 0.252, sf: 0.177, lab: 0.059, grn: 0.026, sd: 0.086, pbp: 0.020, aon: 0.065, ii: 0.004, ind: 0.120, oth: 0.019 }, s: { ff: 5, fg: 5, sf: 5, lab: 1, sd: 2, aon: 1, ind: 1 } },
        SEA: { v: { ff: 0.270, fg: 0.203, sf: 0.210, lab: 0.049, grn: 0.029, sd: 0.029, pbp: 0.018, aon: 0.043, ii: 0.003, ind: 0.137, oth: 0.009 }, s: { ff: 6, fg: 3, sf: 5, lab: 1, ind: 1 } },
        MID: { v: { ff: 0.228, fg: 0.249, sf: 0.149, lab: 0.011, grn: 0.016, pbp: 0.017, aon: 0.024, ii: 0.037, ind: 0.263, oth: 0.006 }, s: { ff: 3, fg: 4, sf: 1, ind: 3 } },
        COR: { v: { ff: 0.280, fg: 0.220, sf: 0.132, lab: 0.036, grn: 0.025, sd: 0.089, pbp: 0.024, aon: 0.038, ii: 0.074, ind: 0.065, oth: 0.017 }, s: { ff: 7, fg: 4, sf: 3, lab: 1, sd: 3, ii: 2 } },
        MUN: { v: { ff: 0.261, fg: 0.184, sf: 0.138, lab: 0.043, grn: 0.031, sd: 0.016, pbp: 0.011, aon: 0.026, ii: 0.048, ind: 0.228, oth: 0.015 }, s: { ff: 7, fg: 4, sf: 3, lab: 2, ii: 1, ind: 5 } },
        WES: { v: { ff: 0.202, fg: 0.243, sf: 0.165, lab: 0.009, grn: 0.020, sd: 0.010, pbp: 0.018, aon: 0.036, ii: 0.112, ind: 0.179, oth: 0.008 }, s: { ff: 4, fg: 4, sf: 4, aon: 1, ii: 1, ind: 3 } },
        BOR: { v: { ff: 0.233, fg: 0.151, sf: 0.331, lab: 0.036, grn: 0.014, sd: 0.006, pbp: 0.018, aon: 0.041, ii: 0.035, ind: 0.107, oth: 0.025 }, s: { ff: 6, fg: 3, sf: 7, lab: 1, ind: 2 } },
      },
      // The real story beats of 2024, in campaign order.
      events: [
        { id: "harris_calls", headline: "Simon Harris calls a 29 November election seven months after becoming Taoiseach, on the back of a budget full of giveaways. {party} goes in with a spring in its step", role: "any", party: "fg", weight: 3, appeal: 0.02, momentum: 6, turn: 0 },
        { id: "oleary_teachers", headline: "Michael O'Leary tells a Fine Gael launch there are too many teachers in the Dáil. The unions take offence, and {party} wishes it had never handed him a microphone", role: "any", party: "fg", weight: 3, appeal: -0.02, momentum: -5, turn: 1 },
        { id: "ten_leaders", headline: "RTÉ stages the biggest leaders' debate in Irish history, with ten party leaders on one stage, and {party} gets airtime it could never buy", role: "any", party: "sd", weight: 3, appeal: 0.015, momentum: 5, turn: 2 },
        { id: "rte_pledge", headline: "Sinn Féin's manifesto promises a review of RTÉ's coverage of the war in Gaza. Harris calls it chilling, the journalists' union objects, and {party} spends two days on the defensive", role: "any", party: "sf", weight: 3, appeal: -0.02, momentum: -5, turn: 3 },
        { id: "kanturk", headline: "Harris walks away from a disability carer in Kanturk who accuses the government of neglecting her sector. The video runs all weekend and {party} has a problem", role: "any", party: "fg", weight: 3, appeal: -0.025, momentum: -7, turn: 4 },
        { id: "sutcliffe_quits", headline: "Independent Ireland's Dublin South-Central candidate resigns from the party after a row over his links to Conor McGregor, and {party} spends the final weekend explaining itself", role: "any", party: "ii", weight: 3, appeal: -0.02, momentum: -6, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "apple_windfall", headline: "The government's €14 billion Apple tax windfall becomes a campaign question. {party} says it should build homes and fix hospitals now, not sit in a fund", role: "any", party: "sf", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "immigration_rows", headline: "Immigration climbs the agenda, with calls for tighter controls and stiffer asylum rules, and {party} finds an audience", role: "any", party: "ii", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "green_backlash", headline: "Voters who backed the Greens to get climate action remember who raised the carbon tax, and {party} fights for a single seat", role: "any", party: "grn", weight: 2, appeal: -0.025, momentum: -7 },
        { id: "cairns_pregnant", headline: "Holly Cairns campaigns while heavily pregnant and moves to social media for the last week, and {party} wins a warm round of coverage", role: "any", party: "sd", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "bacik_bloc", headline: "Ivana Bacik pitches Labour as the partner for a left-of-centre bloc, and {party} gets a second look from voters who are tired of both big parties", role: "any", party: "lab", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "housing_stamp_duty", headline: "A pledge to abolish stamp duty for new buyers makes the housing debate about first-time buyers, and {party} gains with the young", role: "any", party: "sf", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },

    "2020": {
      id: "2020",
      year: 2020,
      label: "2020 · Varadkar v. Martin v. McDonald",
      tagline: "February 2020. Fine Gael has governed for nine years on a recovering economy and a Brexit deal, and the voters on trolleys and on rent have noticed. Sinn Féin is rising on housing with too few candidates to turn it all into seats. A three-way split is coming and the Greens are in the mix.",
      majority: { total: 160, threshold: 81 },
      goalText: "81 of 160 seats",
      salience: { housing: 0.95, health: 0.8, brexit_unity: 0.6, cost_of_living: 0.55, climate: 0.5, tax_spending: 0.4 },
      regions: {
        DNO: { v: { ff: 0.157, fg: 0.158, sf: 0.316, lab: 0.077, grn: 0.095, sd: 0.088, pbp: 0.028, aon: 0.008, ind: 0.066, oth: 0.009 }, s: { ff: 3, fg: 3, sf: 4, lab: 2, grn: 2, sd: 3 } },
        DSO: { v: { ff: 0.136, fg: 0.267, sf: 0.183, lab: 0.061, grn: 0.166, sd: 0.025, pbp: 0.090, aon: 0.014, ind: 0.048, oth: 0.009 }, s: { ff: 2, fg: 4, sf: 2, grn: 4, pbp: 2, ind: 1 } },
        DWE: { v: { ff: 0.158, fg: 0.190, sf: 0.332, lab: 0.046, grn: 0.081, sd: 0.023, pbp: 0.090, aon: 0.007, ind: 0.063, oth: 0.012 }, s: { ff: 2, fg: 3, sf: 4, grn: 2, pbp: 2 } },
        CMB: { v: { ff: 0.188, fg: 0.228, sf: 0.233, lab: 0.044, grn: 0.069, sd: 0.081, pbp: 0.012, aon: 0.042, ind: 0.094, oth: 0.007 }, s: { ff: 4, fg: 5, sf: 5, grn: 1, sd: 2, aon: 1, ind: 1 } },
        SEA: { v: { ff: 0.280, fg: 0.186, sf: 0.280, lab: 0.074, grn: 0.054, pbp: 0.019, aon: 0.013, ind: 0.087, oth: 0.007 }, s: { ff: 4, fg: 2, sf: 3, lab: 1, grn: 2, ind: 2 } },
        MID: { v: { ff: 0.311, fg: 0.209, sf: 0.227, lab: 0.031, grn: 0.046, pbp: 0.012, ind: 0.129, oth: 0.034 }, s: { ff: 4, fg: 2, sf: 2, ind: 1 } },
        COR: { v: { ff: 0.299, fg: 0.214, sf: 0.178, lab: 0.041, grn: 0.069, sd: 0.042, pbp: 0.019, aon: 0.033, ind: 0.098, oth: 0.006 }, s: { ff: 7, fg: 4, sf: 3, lab: 1, sd: 1, pbp: 1, ind: 1 } },
        MUN: { v: { ff: 0.245, fg: 0.204, sf: 0.169, lab: 0.034, grn: 0.060, sd: 0.006, pbp: 0.006, aon: 0.011, ind: 0.257, oth: 0.009 }, s: { ff: 5, fg: 4, sf: 4, lab: 1, grn: 1, ind: 6 } },
        WES: { v: { ff: 0.225, fg: 0.254, sf: 0.180, lab: 0.012, grn: 0.052, sd: 0.021, pbp: 0.010, aon: 0.022, ind: 0.220, oth: 0.003 }, s: { ff: 3, fg: 4, sf: 3, ind: 5 } },
        BOR: { v: { ff: 0.212, fg: 0.181, sf: 0.378, lab: 0.028, grn: 0.040, pbp: 0.013, aon: 0.023, ind: 0.117, oth: 0.007 }, s: { ff: 4, fg: 4, sf: 7, lab: 1, ind: 3 } },
      },
      // The real story beats of 2020, in campaign order.
      events: [
        { id: "saturday_vote", headline: "Leo Varadkar calls the first Saturday election since 1918 and runs on Brexit and a recovering economy, and {party} presents itself as the steady hand", role: "any", party: "fg", weight: 3, appeal: 0.015, momentum: 4, turn: 0 },
        { id: "housing_doorstep", headline: "Housing is the first issue on every doorstep, and {party}, in office through years of rent rises, takes the heat", role: "any", party: "fg", weight: 3, appeal: -0.03, momentum: -7, turn: 1 },
        { id: "sf_poll_lead", headline: "A poll puts Sinn Féin ahead of both Fianna Fáil and Fine Gael. The party is running too few candidates to cash it in, but {party} has the momentum", role: "any", party: "sf", weight: 3, appeal: 0.03, momentum: 9, turn: 2 },
        { id: "mcdonald_invited", headline: "RTÉ invites Mary Lou McDonald into the final leaders' debate after Sinn Féin threatens legal action, and {party} gets the stage it wanted", role: "any", party: "sf", weight: 3, appeal: 0.025, momentum: 8, turn: 3 },
        { id: "no_sf_coalition", headline: "Micheál Martin and Leo Varadkar both rule out governing with Sinn Féin, and {party} says the voters, not the two old parties, will decide", role: "any", party: "sf", weight: 3, appeal: 0.015, momentum: 4, turn: 4 },
        { id: "ff_slips", headline: "Fianna Fáil, which expected to be the largest party, finds the cities slipping away to Sinn Féin, and {party} watches the transfers drain", role: "any", party: "ff", weight: 3, appeal: -0.02, momentum: -5, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "green_wave", headline: "The Greens ride a strong run in the 2019 local and European elections into the campaign, and {party} aims for its best result ever", role: "any", party: "grn", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "aontu_debut", headline: "Aontú, founded by Peadar Tóibín after he left Sinn Féin over abortion, contests its first general election and {party} courts the rural vote", role: "any", party: "aon", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "trolley_crisis", headline: "Another record trolley count in the hospitals ends the government's talk of a health service on the mend, and {party} wears it", role: "any", party: "fg", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "sd_focus", headline: "The Social Democrats, deliberately running a short list in winnable seats, put their effort where it counts, and {party} is the beneficiary", role: "any", party: "sd", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "end_the_deal", headline: "Fianna Fáil asks voters to let it end the confidence and supply deal it signed with Fine Gael in 2016 and lead the next government, and {party} runs as the party of change from inside the system", role: "any", party: "ff", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },

    "2016": {
      id: "2016",
      year: 2016,
      label: "2016 · Kenny v. Martin",
      tagline: "February 2016. Fine Gael and Labour ask to be kept on to finish the recovery. Water charges, homelessness and a rural revolt are splitting the vote five ways and independents are multiplying. A government with a majority is not on the cards, so the question is who ends up propping up whom.",
      majority: { total: 158, threshold: 80 },
      goalText: "80 of 158 seats",
      salience: { water_charges: 0.8, health: 0.75, housing: 0.7, tax_spending: 0.65, cost_of_living: 0.4, reform: 0.25 },
      regions: {
        DNO: { v: { ff: 0.169, fg: 0.178, sf: 0.152, lab: 0.085, grn: 0.028, sd: 0.086, pbp: 0.056, ind: 0.213, oth: 0.035 }, s: { ff: 2, fg: 4, sf: 4, lab: 1, sd: 1, ind: 4 } },
        DSO: { v: { ff: 0.139, fg: 0.284, sf: 0.108, lab: 0.092, grn: 0.074, sd: 0.028, pbp: 0.087, ind: 0.142, oth: 0.047 }, s: { ff: 1, fg: 7, sf: 1, grn: 2, pbp: 2, ind: 2 } },
        DWE: { v: { ff: 0.155, fg: 0.233, sf: 0.167, lab: 0.085, grn: 0.022, sd: 0.017, pbp: 0.154, ind: 0.137, oth: 0.030 }, s: { ff: 3, fg: 3, sf: 2, lab: 1, pbp: 3, ind: 1 } },
        CMB: { v: { ff: 0.247, fg: 0.292, sf: 0.144, lab: 0.062, grn: 0.025, sd: 0.116, pbp: 0.011, ind: 0.059, oth: 0.044 }, s: { ff: 7, fg: 7, sf: 2, sd: 2 } },
        SEA: { v: { ff: 0.300, fg: 0.262, sf: 0.133, lab: 0.089, grn: 0.031, sd: 0.008, pbp: 0.030, ind: 0.128, oth: 0.019 }, s: { ff: 4, fg: 5, sf: 2, lab: 1, ind: 2 } },
        MID: { v: { ff: 0.326, fg: 0.236, sf: 0.133, lab: 0.056, grn: 0.023, pbp: 0.004, ind: 0.178, oth: 0.046 }, s: { ff: 3, fg: 3, sf: 2, lab: 1, ind: 1 } },
        COR: { v: { ff: 0.300, fg: 0.270, sf: 0.117, lab: 0.065, grn: 0.027, sd: 0.006, pbp: 0.047, ind: 0.132, oth: 0.037 }, s: { ff: 7, fg: 5, sf: 3, lab: 1, pbp: 1, ind: 1 } },
        MUN: { v: { ff: 0.242, fg: 0.242, sf: 0.094, lab: 0.073, grn: 0.017, sd: 0.020, pbp: 0.018, ind: 0.284, oth: 0.009 }, s: { ff: 5, fg: 6, sf: 2, lab: 2, ind: 6 } },
        WES: { v: { ff: 0.249, fg: 0.312, sf: 0.082, lab: 0.041, grn: 0.015, sd: 0.016, pbp: 0.012, ind: 0.257, oth: 0.017 }, s: { ff: 5, fg: 5, ind: 5 } },
        BOR: { v: { ff: 0.279, fg: 0.231, sf: 0.255, lab: 0.030, grn: 0.021, pbp: 0.020, ind: 0.147, oth: 0.018 }, s: { ff: 7, fg: 5, sf: 5, ind: 1 } },
      },
      // The real story beats of 2016, in campaign order.
      events: [
        { id: "kenny_names_date", headline: "Enda Kenny names 26 February on Twitter while driving to the Áras to dissolve the Dáil and asks the country to keep the recovery going, and {party} owns the early running", role: "any", party: "fg", weight: 3, appeal: 0.015, momentum: 4, turn: 0 },
        { id: "scrap_irish_water", headline: "Fianna Fáil promises to suspend water charges and wind up Irish Water, and {party} finally has a mainstream home for the protest vote", role: "any", party: "ff", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "greens_court", headline: "The High Court rejects the Greens' bid to put Eamon Ryan in the RTÉ leaders' debate, and {party}, with no TDs, struggles for airtime", role: "any", party: "grn", weight: 3, appeal: -0.015, momentum: -4, turn: 2 },
        { id: "usc_bidding", headline: "A bidding war over the universal social charge ends with Fine Gael, Fianna Fáil and Sinn Féin all promising to scrap it, and {party} is left defending the tax", role: "any", party: "lab", weight: 3, appeal: -0.02, momentum: -5, turn: 3 },
        { id: "recovery_gap", headline: "Poll after poll shows the lead slipping, as voters who do not feel the recovery tell the doorstep so, and {party} watches the numbers fall", role: "any", party: "fg", weight: 3, appeal: -0.025, momentum: -6, turn: 4 },
        { id: "trolley_record", headline: "The nurses' union reports record numbers of patients on trolleys in the last week of the campaign, and {party} carries the health service on its back", role: "any", party: "fg", weight: 3, appeal: -0.02, momentum: -5, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "right2change", headline: "A Right2Change pact asks left voters to give their transfers to each other, and {party} hopes the water protests turn into seats", role: "any", party: "pbp", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "sf_ruled_out", headline: "Fine Gael and Fianna Fáil both rule out governing with Sinn Féin, and {party} says it is for the voters to decide", role: "any", party: "sf", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "homeless_record", headline: "A record number of families in emergency accommodation makes housing the question the coalition cannot answer, and {party} picks up the anger", role: "any", party: "sf", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "independent_alliance", headline: "The Independent Alliance publishes its charter for government and rural independents become the kingmakers everyone is counting, with {party} drawing the votes", role: "any", party: "ind", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "sd_launch", headline: "The new Social Democrats publish a ten-year plan, Building a Better Future, and {party} starts picking up the professional vote", role: "any", party: "sd", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "martin_steady", headline: "Micheál Martin's calm tour of the south and east steadies the party after the wipeout, and {party} comes back from the dead", role: "any", party: "ff", weight: 2, appeal: 0.02, momentum: 6 },
      ],
    },

    "2011": {
      id: "2011",
      year: 2011,
      label: "2011 · Kenny v. Gilmore v. Martin",
      tagline: "February 2011. The Troika has arrived, Brian Cowen is gone, the Greens have walked out and Fianna Fáil is about to be wiped off the map. Fine Gael and Labour are fighting to be the senior partner in a coalition nobody doubts. Win 84 seats, or at least be in the room.",
      majority: { total: 166, threshold: 84 },
      goalText: "84 of 166 seats",
      salience: { bailout: 0.95, tax_spending: 0.8, reform: 0.55, health: 0.45, cost_of_living: 0.35, housing: 0.3 },
      regions: {
        DNO: { v: { ff: 0.134, fg: 0.278, sf: 0.095, lab: 0.304, grn: 0.033, pbp: 0.055, ind: 0.097, oth: 0.003 }, s: { fg: 5, sf: 2, lab: 7, pbp: 1, ind: 2 } },
        DSO: { v: { ff: 0.113, fg: 0.327, sf: 0.046, lab: 0.266, grn: 0.049, pbp: 0.073, ind: 0.127, }, s: { fg: 8, sf: 1, lab: 6, pbp: 2, ind: 1 } },
        DWE: { v: { ff: 0.130, fg: 0.286, sf: 0.119, lab: 0.321, grn: 0.019, pbp: 0.103, ind: 0.016, oth: 0.005 }, s: { ff: 1, fg: 4, sf: 1, lab: 5, pbp: 1 } },
        CMB: { v: { ff: 0.160, fg: 0.386, sf: 0.095, lab: 0.215, grn: 0.014, pbp: 0.001, ind: 0.127, oth: 0.003 }, s: { ff: 1, fg: 10, sf: 1, lab: 4, ind: 2 } },
        SEA: { v: { ff: 0.208, fg: 0.371, sf: 0.082, lab: 0.185, grn: 0.014, pbp: 0.009, ind: 0.124, oth: 0.006 }, s: { ff: 2, fg: 7, lab: 3, ind: 2 } },
        MID: { v: { ff: 0.236, fg: 0.356, sf: 0.094, lab: 0.161, grn: 0.005, pbp: 0.004, ind: 0.144 }, s: { ff: 3, fg: 4, sf: 1, lab: 1 } },
        COR: { v: { ff: 0.218, fg: 0.383, sf: 0.099, lab: 0.212, grn: 0.016, pbp: 0.025, ind: 0.043, oth: 0.004 }, s: { ff: 4, fg: 9, sf: 2, lab: 4 } },
        MUN: { v: { ff: 0.172, fg: 0.380, sf: 0.055, lab: 0.164, grn: 0.010, pbp: 0.030, ind: 0.173, oth: 0.015 }, s: { ff: 3, fg: 10, sf: 1, lab: 4, pbp: 1, ind: 4 } },
        WES: { v: { ff: 0.176, fg: 0.457, sf: 0.070, lab: 0.097, grn: 0.008, ind: 0.192 }, s: { ff: 3, fg: 10, lab: 2, ind: 2 } },
        BOR: { v: { ff: 0.193, fg: 0.327, sf: 0.237, lab: 0.106, grn: 0.019, ind: 0.120 }, s: { ff: 3, fg: 9, sf: 5, lab: 1, ind: 1 } },
      },
      // The real story beats of 2011, in campaign order.
      events: [
        { id: "cowen_quits", headline: "Cowen quits as Fianna Fáil leader after a botched reshuffle and the Greens walk out of government. Micheál Martin inherits the party, and the blame lands on {party}", role: "any", party: "ff", weight: 3, appeal: -0.03, momentum: -8, turn: 0 },
        { id: "frankfurt_way", headline: "Gilmore calls the Troika deal a bad deal and says it is 'Frankfurt's way or Labour's way'. The crowds cheer, the economists wince, and {party} has to explain how", role: "any", party: "lab", weight: 3, appeal: -0.02, momentum: -4, turn: 1 },
        { id: "kenny_skips_tv3", headline: "Enda Kenny turns down the TV3 leaders' debate, and Fianna Fáil and Labour say {party} is running scared", role: "any", party: "fg", weight: 3, appeal: -0.015, momentum: -4, turn: 2 },
        { id: "kenny_berlin", headline: "Kenny is photographed with Angela Merkel and José Manuel Barroso in Berlin, and {party} looks like a government in waiting", role: "any", party: "fg", weight: 3, appeal: 0.02, momentum: 5, turn: 3 },
        { id: "every_little_hurts", headline: "A private poll puts Labour on 16 per cent, it drops talk of 'Gilmore for Taoiseach', and its 'Every Little Hurts' ads put {party}'s tax and spending plans on the defensive", role: "any", party: "fg", weight: 3, appeal: -0.015, momentum: -4, turn: 4 },
        { id: "prime_time", headline: "Kenny's performance in the final Prime Time debate is judged a disappointment, and talk of an overall majority for {party} fades", role: "any", party: "fg", weight: 3, appeal: -0.02, momentum: -5, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "adams_louth", headline: "Gerry Adams leaves Belfast to stand in Louth, and Sinn Féin's 'There is a Better Way' picks up the protest votes angry about the bailout, to the benefit of {party}", role: "any", party: "sf", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "ula_surge", headline: "The United Left Alliance's anti-austerity message cuts through in working-class Dublin, and {party} puts a few extra candidates in play", role: "any", party: "pbp", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "fitzgerald_coalition", headline: "Garret FitzGerald urges a Fine Gael and Labour coalition and warns against one-party government, and {party} picks up late tactical votes", role: "any", party: "lab", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "martin_debates", headline: "Micheál Martin's calm showings in the television debates win some friendly reviews, and {party} stops sinking in the polls", role: "any", party: "ff", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "green_clean_up", headline: "The Greens run a clean-up-the-mess campaign on climate and reform, but voters remember the bank guarantee, and {party} fights for a single seat", role: "any", party: "grn", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "independents_local", headline: "Local independents with a record of constituency work stand against the discredited party machines, and {party} draws votes in the towns", role: "any", party: "ind", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },
  },

  leaders: {
    "2024": {
      ff: { partyId: "ff", name: "Micheál Martin", charisma: 62, energy: 68, competence: 72, machine: 82 },
      fg: { partyId: "fg", name: "Simon Harris", charisma: 72, energy: 82, competence: 66, machine: 78 },
      sf: { partyId: "sf", name: "Mary Lou McDonald", charisma: 68, energy: 70, competence: 58, machine: 80 },
      lab: { partyId: "lab", name: "Ivana Bacik", charisma: 64, energy: 66, competence: 66, machine: 52 },
      grn: { partyId: "grn", name: "Roderic O'Gorman", charisma: 48, energy: 58, competence: 62, machine: 44 },
      sd: { partyId: "sd", name: "Holly Cairns", charisma: 72, energy: 74, competence: 62, machine: 56 },
      pbp: { partyId: "pbp", name: "Richard Boyd Barrett", charisma: 64, energy: 74, competence: 56, machine: 44 },
      aon: { partyId: "aon", name: "Peadar Tóibín", charisma: 62, energy: 70, competence: 54, machine: 40 },
    },
    "2020": {
      ff: { partyId: "ff", name: "Micheál Martin", charisma: 58, energy: 64, competence: 68, machine: 76 },
      fg: { partyId: "fg", name: "Leo Varadkar", charisma: 66, energy: 64, competence: 70, machine: 74 },
      sf: { partyId: "sf", name: "Mary Lou McDonald", charisma: 70, energy: 74, competence: 56, machine: 74 },
      lab: { partyId: "lab", name: "Brendan Howlin", charisma: 44, energy: 54, competence: 62, machine: 46 },
      grn: { partyId: "grn", name: "Eamon Ryan", charisma: 56, energy: 62, competence: 60, machine: 50 },
      sd: { partyId: "sd", name: "Róisín Shortall & Catherine Murphy", charisma: 56, energy: 58, competence: 68, machine: 44 },
      pbp: { partyId: "pbp", name: "Richard Boyd Barrett & Bríd Smith", charisma: 60, energy: 72, competence: 54, machine: 42 },
      aon: { partyId: "aon", name: "Peadar Tóibín", charisma: 58, energy: 66, competence: 52, machine: 30 },
    },
    "2016": {
      fg: { partyId: "fg", name: "Enda Kenny", charisma: 50, energy: 64, competence: 64, machine: 82 },
      ff: { partyId: "ff", name: "Micheál Martin", charisma: 58, energy: 64, competence: 62, machine: 70 },
      sf: { partyId: "sf", name: "Gerry Adams", charisma: 62, energy: 62, competence: 52, machine: 76 },
      lab: { partyId: "lab", name: "Joan Burton", charisma: 52, energy: 66, competence: 62, machine: 54 },
      grn: { partyId: "grn", name: "Eamon Ryan", charisma: 52, energy: 60, competence: 58, machine: 40 },
      sd: { partyId: "sd", name: "Shortall, Murphy & Donnelly", charisma: 56, energy: 60, competence: 66, machine: 34 },
      pbp: { partyId: "pbp", name: "Paul Murphy & Richard Boyd Barrett", charisma: 62, energy: 74, competence: 52, machine: 40 },
    },
    "2011": {
      fg: { partyId: "fg", name: "Enda Kenny", charisma: 48, energy: 62, competence: 62, machine: 88 },
      lab: { partyId: "lab", name: "Eamon Gilmore", charisma: 68, energy: 68, competence: 62, machine: 70 },
      ff: { partyId: "ff", name: "Micheál Martin", charisma: 56, energy: 66, competence: 62, machine: 54 },
      sf: { partyId: "sf", name: "Gerry Adams", charisma: 62, energy: 66, competence: 50, machine: 60 },
      grn: { partyId: "grn", name: "John Gormley", charisma: 40, energy: 54, competence: 52, machine: 34 },
      pbp: { partyId: "pbp", name: "Joe Higgins & Richard Boyd Barrett", charisma: 66, energy: 72, competence: 56, machine: 36 },
    },
  },

  events: [
    { id: "grim_figures", headline: "Grim figures on the live register lead the news, putting pressure on {party}", role: "leader", weight: 3, appeal: -0.03, momentum: -7 },
    { id: "rent_record", headline: "Another record rent rise puts housing on the front page, and voters look to {party}", role: "challenger", weight: 3, appeal: 0.025, momentum: 6 },
    { id: "leaders_debate", headline: "{party}'s leader wins the televised leaders' debate, and the Twitter poll agrees", role: "any", weight: 3, appeal: 0.03, momentum: 10 },
    { id: "old_posts", headline: "A candidate's old social media posts resurface, and {party} spends the day apologising", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "number_down_ballot", headline: "Voters are urged to number every candidate on the ballot, and the transfers drift toward {party}", role: "challenger", weight: 2, appeal: 0.025, momentum: 6 },
    { id: "radio_fumble", headline: "{party}'s leader fumbles a costings question on Morning Ireland", role: "any", weight: 2, appeal: -0.03, momentum: -6 },
    { id: "endorsement_ie", headline: "The Sunday papers and a handful of business groups line up behind {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "first_time_voters", headline: "A viral clip breaks for {party} among first-time voters", role: "challenger", weight: 2, appeal: 0.025, momentum: 8 },
    { id: "county_tour", headline: "A bus tour of the county towns wins {party} friendly local coverage and a few local radio hits", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "storm_leadership", headline: "A winter storm knocks out power across the west and puts leadership first, and {party} looks the part", role: "leader", weight: 2, appeal: 0.025, momentum: 6 },
    {
      id: "debate_call",
      headline: "RTÉ offers {party} a slot in a prime-time leaders' debate",
      role: "player",
      weight: 4,
      prompt: "A prime-time debate is on the table. How do you play it?",
      choices: [
        { id: "accept_attack", text: "Accept and go on the attack", resultText: "You land blows and take a few. The overnight polls twitch your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
        { id: "accept_safe", text: "Accept and play it safe", resultText: "A steady, on-message night. No gaffes, no fireworks.", appeal: 0.015, momentum: 4 },
        { id: "decline", text: "Decline and send a deputy", resultText: "You dodge the studio lights. The papers call it running scared.", appeal: -0.01, momentum: -4 },
      ],
    },
    {
      id: "transfer_question",
      headline: "Every doorstep asks {party} the same question: who gets your second preferences?",
      role: "player",
      weight: 3,
      prompt: "Voters want to know where your transfers go. What do you tell them?",
      choices: [
        { id: "name_partners", text: "Name your preferred partners and say so on every ballot leaflet", resultText: "Clarity reassures your side. The other side calls it a stitch-up.", appeal: 0.02, momentum: 5 },
        { id: "keep_open", text: "Tell supporters to number down the ballot and say nothing more", resultText: "Nobody is ruled out, and nobody is quite reassured.", appeal: -0.01, momentum: -3 },
        { id: "rule_out", text: "Rule out the main rival and dare voters to choose", resultText: "A bold line. It sharpens the contrast and costs you a few transfers.", appeal: 0.015, momentum: 4, rivalAppeal: -0.02 },
      ],
    },
    {
      id: "manifesto_choice",
      headline: "{party}'s front bench is split on the headline manifesto pledge",
      role: "player",
      weight: 3,
      prompt: "The manifesto goes to print on Friday. Which way do you push?",
      choices: [
        { id: "bold", text: "Go bold with a defining, risky pledge", resultText: "The base roars. The Department of Finance starts sharpening pencils.", appeal: 0.035, momentum: 12 },
        { id: "cautious", text: "Play it safe: no hostages to fortune", resultText: "No spark, no self-inflicted wounds.", appeal: 0.01, momentum: 2 },
        { id: "contrast", text: "Make it a contrast with the rival's costings", resultText: "You define them more than yourself, and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
      ],
    },
  ],
};

// Registry rows, store pack, daily pairing and "play next" chain.
export const IRELAND_MODULE = countryModule(IRELAND, {
  blurb: "Single transferable vote: Fianna Fáil, Fine Gael, Sinn Féin and an army of independents.",
  cover: "images/covers/country-ie.jpg",
  art: { a: "#0b3d2e", b: "#c8782a", glow: "rgba(236,240,245,0.2)" },
  scenarios: [
    { electionId: "2024", difficulty: "hard",
      description: "A new Taoiseach, a giveaway budget and a housing crisis that will not go away. The old rivals need partners, and Sinn Féin needs the transfers." },
    { electionId: "2020", difficulty: "hard",
      description: "Sinn Féin tops the poll with too few candidates. A three-way split leaves nobody near 81 seats without crossing a line." },
    { electionId: "2016", difficulty: "medium",
      description: "The recovery election nobody felt. Fine Gael and Labour lose a combined 56 seats and independents multiply." },
    { electionId: "2011", difficulty: "hard",
      description: "The Troika election. Fianna Fáil falls from 77 seats to 20 and Fine Gael and Labour take 113 between them." },
  ],
  systemLabel: "Single transferable vote",
  pack: {
    id: "ireland",
    name: "Ireland",
    description: "Four Dáil elections from 2011 to 2024 under the single transferable vote: the Troika landslide, the water charge election, Sinn Féin's surge and the coalition that followed.",
    price: 99,
  },
  daily: { pair: ["ff", "fg"], names: { ff: "Fianna Fáil", fg: "Fine Gael" } },
  next: {
    chain: [
      { id: "2011", blurb: "Continue the timeline: the Troika election" },
      { id: "2016", blurb: "Continue the timeline: the recovery election" },
      { id: "2020", blurb: "Continue the timeline: the three-way split" },
      { id: "2024", blurb: "Continue the timeline: the giveaway budget" },
    ],
  },
  guide: {
    title: "Ireland",
    body: "Single transferable vote in constituencies of three to five seats. The game has no STV count, so each of the ten regions wins seats in line with its first-preference vote, with transfers already folded into the regional seat table, the same shortcut Australia uses for preferences. Independents win a large block of seats and cannot be led. Fianna Fáil and Fine Gael can govern together, but neither will take Sinn Féin, and the Social Democrats, PBP-Solidarity and Aontú will not join either of them.",
  },
});
