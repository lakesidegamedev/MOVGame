// INDIA: six Lok Sabha general elections, one bundle.
//
// First past the post in 543 single-member constituencies. India's parties
// are not national, so the bundle models the alliances voters actually
// faced in each state: the BJP-led National Democratic Alliance (NDA), the
// Congress-led United Progressive Alliance (UPA; the INDIA bloc in 2024) and
// the regional parties that stood outside both. In 1999 and 2004 the UPA row
// is Congress and the allies it had before polling (the UPA itself was named
// after the 2004 count). Regions are groups of states
// and union territories (fifteen in all), each with its real seat total.
//
// Method. Every number is aggregated from constituency-level results (all
// candidates, all votes) in the Election Commission of India's published
// tables, as carried in public open datasets for 1999, 2004, 2009, 2014, 2019
// and 2024.
// Each candidate's party is mapped to the side it stood on in that state
// that year; votes are summed by region and the seat is given to the
// candidate with the most votes in each constituency. NOTA and independents
// sit in Other, so shares are of all votes counted and match the published
// national shares (BJP 37.4% in 2019 and 36.6% in 2024, Congress 21.2% in
// 2024). Two seats are entered by hand: Vellore in 2019 (the DMK's Kathir
// Anand beat A. C. Shanmugam in the August 2019 re-run after the April poll
// was cancelled over cash seizures) and Surat in 2024 (the BJP's Mukesh
// Dalal was elected unopposed after the other nominations were withdrawn or
// rejected). Every election has 543 seats and a 272 majority line.
//
// Grouping rules. A regional party is shown on its own only where it stood
// apart from both big alliances in its state. Where it was a pre-poll ally,
// its votes and seats sit with the alliance: TDP in 2014 and 2024 with the
// NDA; DMK in 2009, 2019 and 2024 with the UPA; AIADMK in 2019 with the NDA;
// the Samajwadi Party in 2024 with the INDIA bloc in Uttar Pradesh; Left
// parties in Tamil Nadu in 2019, and everywhere but Kerala, West Bengal and
// Tripura in 2024, with the UPA; Trinamool with the UPA in 2009 only; AAP
// with the INDIA bloc in Delhi, Haryana, Gujarat, Goa and Chandigarh in 2024
// and alone in Punjab. Trinamool contested 2024 against Congress and the
// Left in Bengal, so it is shown separately even though it belongs to INDIA
// nationally. The 2019 UPA total here includes the four Maharashtra and one
// Lakshadweep seats of the NCP, which fought on a joint Congress slate.
// Andhra Pradesh and Telangana are one region (42 seats in all six
// elections) so that the 2009 and 2014 states line up with the present map.
// For 1999 and 2004 the present map is rebuilt from the constituencies of the
// day: Bihar and Jharkhand, Madhya Pradesh and Chhattisgarh, and Uttar Pradesh
// and Uttarakhand were each one state in 1999, so the five Uttarakhand seats
// (Almora, Garhwal, Hardwar, Nainital, Tehri Garhwal) are moved from Uttar
// Pradesh to the hills region, and every region keeps its seat total.
// The Andaman and Nicobar Islands vote with West Bengal and Lakshadweep with
// Kerala; neither is drawn on the map.
//
// 2004 (20 April to 10 May, count 13 May). Alliances are the pre-poll seat
// sharing recorded on Wikipedia's state pages for the election (party tables
// for each state, 2004 Indian general election in <state>): NDA 189 (BJP 138,
// Shiv Sena 12, BJD 11, SAD 8, JD(U) 8, TDP 5, Trinamool 2 and five small
// allies), UPA 228 (Congress 145, RJD 24, DMK 16, NCP 9, PMK 6, TRS 5, JMM 5,
// LJP 4, MDMK 4, and the Left parties that stood on a Congress or DMK slate
// in Tamil Nadu, Andhra Pradesh and Jharkhand), Left 55, Samajwadi Party
// with the RLD 39 (the UP seat deal of 70 and 10), BSP 19, the rest 13. The
// NDA total matches the usual 189. The UPA row is wider than the 218 to 222
// usually quoted because the Left seats it fought alongside are counted by
// state. The Left Front fought Congress in West Bengal, Kerala and Tripura,
// so it stands apart there. AIADMK was in the NDA in Tamil Nadu in 2004. The
// DMK, PMK and MDMK had left the NDA and were in Congress's front, which is
// how a front that won all 40 seats in Tamil Nadu and Puducherry counts as
// UPA. Parties outside every front (JD(S), AGP, INLD, the National
// Conference, independents) are in Other. Two independents backed by a front
// are counted with it: Kokrajhar in Assam (NDA, from the Assam page) and
// Ernakulam in Kerala (Left).
// States without an alliance table on their Wikipedia page (Odisha, Rajasthan,
// Goa, Tripura and the small northeastern states and territories) take each
// party's national alliance.
// 1999 (5 September to 3 October, count 6 October). Alliances are the table
// "By state and alliance" in the Wikipedia article for the election, checked
// against its Tamil Nadu, Bihar, Kerala and West Bengal pages: NDA 299 (BJP
// 182, TDP 29, JD(U) 21, Shiv Sena 15, DMK 12, BJD 10, Trinamool 8, INLD 5,
// PMK 5, MDMK 4, SAD 2, ABLTC 2 and four small allies), which is the 299 the
// article gives, Congress and allies 139 (Congress 114, AIADMK 10, RJD 7,
// and the Left parties on the Tamil Nadu and Punjab slates), Left 41, the
// Samajwadi Party 26, BSP 14, the NCP 8 (founded in June 1999 and standing
// alone), the rest 16. The AIADMK is counted with Congress because the two
// fought Tamil Nadu together; the DMK, PMK and MDMK were NDA members. The
// National Conference contested all six Kashmir seats against the BJP and is
// in Other. The article's table leaves out the AIADMK and the small states;
// the Tamil Nadu page and each party's national alliance fill them in.
//
// 2024 (19 April to 1 June, count 4 June): NDA 293 (BJP 240, TDP 16, JD(U)
// 12, Shiv Sena 7, LJP Ram Vilas 5), INDIA bloc 234 (Congress 99, SP 37,
// Trinamool 29, DMK 22, Shiv Sena UBT 9, NCP Sharadchandra Pawar 8), others
// 16. Modi sworn in for a third term with the BJP short of 272 alone.
// 2019 (11 April to 19 May, count 23 May): NDA 353 (BJP 303), UPA 91
// (Congress 52, DMK 24 including Vellore), the rest 99 (Trinamool 22, YSRCP
// 22, BJD 12, BSP 10). The UPA group in this bundle is a little wider than the
// published 91.
// 2014 (7 April to 12 May, count 16 May): NDA 336 (BJP 282, the first
// single-party majority since 1984), UPA 60 (Congress 44, its lowest ever),
// AIADMK 37, Trinamool 34, BJD 20.
// 2009 (16 April to 13 May, count 16 May): UPA 262 (Congress 206, Trinamool
// 19, DMK 18, NCP 9), NDA 159 (BJP 116, JD(U) 20, Shiv Sena 11), Left 24, BSP
// 21, SP 23, BJD 14. On this grouping the NDA is 157; the published tally of
// 159 rests on a slightly different list of allies, and this bundle keeps the
// two Telangana Rashtra Samithi seats apart.

import type { CountryBundle } from "@engine/countryGame";
import { attachElectionIssues } from "./types";
import { IN_ELECTION_ISSUES } from "./issues/in";
import { IN_MAP } from "./paths/in";

export const INDIA: CountryBundle = {
  id: "IN",
  label: "India",
  flag: "🇮🇳",
  currency: "₹",
  unitName: "seat",
  unitNamePlural: "seats",
  goalText: "272 of 543 seats",
  defaultSeatElasticity: 2.6,
  eventChance: 0.7,
  map: IN_MAP,

  system: {
    id: "IN",
    label: "India",
    parties: [
      { id: "nda", name: "National Democratic Alliance (BJP and allies)", shortName: "NDA", color: "#ff8c1a" },
      { id: "upa", name: "UPA / INDIA bloc (Congress and allies)", shortName: "UPA/INDIA", color: "#1ea7e1" },
      { id: "tmc", name: "All India Trinamool Congress", shortName: "Trinamool", color: "#28b04a" },
      { id: "left", name: "Left Front (CPI(M), CPI and allies)", shortName: "Left", color: "#b3122f" },
      { id: "sp", name: "Samajwadi Party (with the RLD in 2004 and 2019)", shortName: "Samajwadi", color: "#d6336c" },
      { id: "bsp", name: "Bahujan Samaj Party", shortName: "BSP", color: "#2b3a9e" },
      { id: "bjd", name: "Biju Janata Dal", shortName: "BJD", color: "#0a9a74" },
      { id: "ysr", name: "YSR Congress Party", shortName: "YSRCP", color: "#7b8ee6" },
      { id: "tdp", name: "Telugu Desam Party", shortName: "TDP", color: "#f2cf1d" },
      { id: "brs", name: "Telangana Rashtra Samithi (Bharat Rashtra Samithi)", shortName: "TRS/BRS", color: "#ff9ec4" },
      { id: "dmk", name: "Dravida Munnetra Kazhagam (2014, outside the UPA)", shortName: "DMK", color: "#3a3a3a" },
      { id: "aiadmk", name: "All India Anna Dravida Munnetra Kazhagam", shortName: "AIADMK", color: "#7a9a2c" },
      { id: "aap", name: "Aam Aadmi Party", shortName: "AAP", color: "#17a2b8" },
      { id: "ncp", name: "Nationalist Congress Party (standing alone in 1999)", shortName: "NCP", color: "#1f9e9a" },
      { id: "oth", name: "Others (independents, NOTA, small parties)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "First past the post (543 constituencies, regional seats curve)", unit: "seat" },
    majority: { total: 543, threshold: 272 },
  },
  playable: ["nda", "upa", "tmc", "left", "sp", "bsp", "bjd", "ysr", "aiadmk", "aap"],
  // State parties that stand in one region (Trinamool in Bengal, with a few
  // candidates next door; the Samajwadi Party in Uttar Pradesh; the BJD in
  // Odisha; the YSRCP in Andhra Pradesh; the AIADMK in Tamil Nadu) cannot
  // reach 272: the setup says so and the results score them against their
  // real seat count. The BSP, the Left and the AAP are left out because they
  // stood across most of the country in at least one election here (the AAP
  // fielded 432 candidates in 2014), so they are not regional in every year.
  regional: ["tmc", "sp", "bjd", "ysr", "aiadmk"],
  abstaining: [],
  // The two big alliances never govern together, and the Samajwadi Party and
  // the Left have never joined an NDA government. Everyone else has backed
  // one side or the other at some point (the Left and the BSP supported UPA
  // governments from outside; Trinamool has sat in both fronts).
  coalitions: {
    forbidden: [["nda", "upa"], ["nda", "left"], ["nda", "sp"]],
    isolated: ["oth"],
  },
  governmentText: {
    majority: "{party} governs with {seats} seats, a Lok Sabha majority its allies already helped build.",
    coalition: "{parties} form a coalition government ({seats} seats).",
    confidence_supply: "{lead} governs with outside support from {partner}, which backs the government without joining it.",
    minority: "{party} forms a minority government on {seats} seats and has to win its support vote by vote.",
    hung: "No front reaches 272. {largest} is the largest group, and the President waits to see who can show a majority.",
  },
  goalHint: "Reach {majority} of {total} seats. Alliances are fought state by state, so Uttar Pradesh, Maharashtra and the big southern and eastern states count as much as a sweep of the Hindi belt.",

  issues: [
    { id: "inflation", name: "Prices", blurb: "Food and fuel inflation, onion and pulse prices, and the rupee." },
    { id: "jobs", name: "Jobs", blurb: "Unemployment, short-term recruitment and a young population looking for work." },
    { id: "corruption", name: "Corruption", blurb: "Telecom and coal scandals in 2014, Rafale in 2019, electoral bonds and agency raids in 2024." },
    { id: "security", name: "National security", blurb: "The Mumbai attack, Pulwama and Balakot, and the border." },
    { id: "welfare", name: "Welfare and farm support", blurb: "Rural jobs guarantees, loan waivers, cash transfers and free grain." },
    { id: "growth", name: "Growth and reform", blurb: "The Gujarat model, GST, demonetisation and who gets the jobs growth creates." },
    { id: "identity", name: "Caste, religion and reservations", blurb: "Quotas, a caste census, the temple at Ayodhya and the citizenship law, as the parties raised them." },
    { id: "federalism", name: "Centre and states", blurb: "Telangana, special status for Andhra, tax shares and the powers of governors." },
    { id: "institutions", name: "Institutions and the Constitution", blurb: "Investigation agencies, the Election Commission, the courts and the question of changing the Constitution." },
  ],

  // Shares are national fractions and overlap, as in the polling categories.
  blocs: [
    { id: "young", name: "Young voters (18-29)", share: 0.26, turnoutPropensity: 0.58,
      tilt: { aap: 0.4, nda: 0.1, left: 0.1, upa: 0.0, bsp: -0.1, aiadmk: -0.1 } },
    { id: "urban", name: "Urban middle class", share: 0.20, turnoutPropensity: 0.57,
      tilt: { nda: 0.35, aap: 0.3, ysr: -0.1, left: -0.2, sp: -0.3, bsp: -0.5, aiadmk: -0.1 } },
    { id: "farm", name: "Farmers and farm labour", share: 0.45, turnoutPropensity: 0.69,
      tilt: { sp: 0.15, bsp: 0.1, ysr: 0.2, brs: 0.2, bjd: 0.2, aiadmk: 0.15, left: 0.1, upa: 0.05, nda: -0.05 } },
    { id: "upper", name: "Upper-caste voters", share: 0.17, turnoutPropensity: 0.72,
      tilt: { nda: 0.55, tdp: 0.1, upa: -0.05, left: -0.1, aap: -0.1, bsp: -0.35, sp: -0.5 } },
    { id: "obc", name: "Other Backward Classes", share: 0.38, turnoutPropensity: 0.67,
      tilt: { sp: 0.5, aiadmk: 0.2, dmk: 0.2, nda: 0.1, tdp: 0.1, upa: -0.1, bsp: -0.1 } },
    { id: "dalit", name: "Scheduled Caste voters", share: 0.17, turnoutPropensity: 0.66,
      tilt: { bsp: 0.9, upa: 0.15, aap: 0.15, left: 0.1, sp: -0.2, nda: -0.25 } },
    { id: "adivasi", name: "Scheduled Tribe voters", share: 0.09, turnoutPropensity: 0.70,
      tilt: { upa: 0.25, bjd: 0.2, ysr: 0.1, nda: 0.0, bsp: -0.1 } },
    { id: "muslim", name: "Muslim voters", share: 0.14, turnoutPropensity: 0.66,
      tilt: { tmc: 0.8, sp: 0.7, upa: 0.5, left: 0.4, aap: 0.4, brs: 0.3, bsp: 0.2, ysr: 0.2, dmk: 0.4, bjd: 0.1, nda: -1.4 } },
  ],

  // Pools are the 543 seats as the constituencies stood in all four
  // elections. Electorate is thousands of votes counted in 2024.
  regions: [
    { id: "UP", name: "Uttar Pradesh", abbr: "UP", seats: 80, electorate: 87912, tile: { row: 1, col: 2 },
      profile: { upper: 1.3, obc: 1.2, dalit: 1.25, muslim: 1.2, farm: 1.2, urban: 0.7, adivasi: 0.1 } },
    { id: "BJ", name: "Bihar & Jharkhand", abbr: "Bihar-Jhk", seats: 54, electorate: 60691, tile: { row: 1, col: 3 },
      profile: { obc: 1.35, muslim: 1.2, adivasi: 1.3, farm: 1.2, young: 1.1, urban: 0.5, upper: 0.8 } },
    { id: "MP", name: "Madhya Pradesh & Chhattisgarh", abbr: "Central", seats: 40, electorate: 53002, tile: { row: 2, col: 2 },
      profile: { adivasi: 3.0, obc: 1.5, farm: 1.2, muslim: 0.4, urban: 0.8 } },
    { id: "GR", name: "Gujarat & Rajasthan", abbr: "West", seats: 53, electorate: 62578, tile: { row: 2, col: 1 },
      profile: { upper: 1.1, obc: 1.2, adivasi: 1.2, muslim: 0.8, urban: 1.0 } },
    { id: "MH", name: "Maharashtra & Goa", abbr: "Maharashtra", seats: 50, electorate: 58086, tile: { row: 3, col: 2 },
      profile: { urban: 1.5, muslim: 0.8, adivasi: 0.9, farm: 0.9 } },
    { id: "DH", name: "Delhi & Haryana", abbr: "Delhi-Hry", seats: 18, electorate: 22443, tile: { row: 1, col: 1 },
      profile: { urban: 1.5, upper: 1.3, young: 1.1, farm: 0.9, muslim: 0.8, adivasi: 0.05 } },
    { id: "PB", name: "Punjab", abbr: "Punjab", seats: 13, electorate: 13531, tile: { row: 1, col: 0 },
      profile: { dalit: 2.0, farm: 1.5, urban: 0.9, muslim: 0.15, upper: 0.4, obc: 0.5, adivasi: 0.05 } },
    { id: "HM", name: "Himachal, Uttarakhand & Kashmir", abbr: "Hills", seats: 15, electorate: 14193, tile: { row: 0, col: 1 },
      profile: { upper: 1.7, muslim: 1.2, urban: 0.6, adivasi: 0.3 } },
    { id: "KA", name: "Karnataka", abbr: "Karnataka", seats: 28, electorate: 38794, tile: { row: 4, col: 2 },
      profile: { urban: 1.3, dalit: 1.1, muslim: 0.9, upper: 0.8, adivasi: 0.4 } },
    { id: "KL", name: "Kerala", abbr: "Kerala", seats: 21, electorate: 20030, tile: { row: 5, col: 2 },
      profile: { muslim: 2.0, obc: 1.3, dalit: 0.8, upper: 0.4, farm: 0.5, young: 0.9, adivasi: 0.2 } },
    { id: "TN", name: "Tamil Nadu", abbr: "Tamil Nadu", seats: 40, electorate: 44482, tile: { row: 5, col: 3 },
      profile: { obc: 1.8, dalit: 1.2, urban: 1.2, upper: 0.25, muslim: 0.5, adivasi: 0.1 } },
    { id: "AT", name: "Andhra Pradesh & Telangana", abbr: "Telugu", seats: 42, electorate: 55738, tile: { row: 3, col: 3 },
      profile: { farm: 1.2, dalit: 1.1, obc: 1.2, muslim: 0.8, adivasi: 0.6, upper: 0.5 } },
    { id: "WB", name: "West Bengal", abbr: "Bengal", seats: 43, electorate: 60686, tile: { row: 1, col: 4 },
      profile: { muslim: 2.0, dalit: 1.3, urban: 1.1, adivasi: 0.6, obc: 0.3 } },
    { id: "OD", name: "Odisha", abbr: "Odisha", seats: 21, electorate: 25129, tile: { row: 2, col: 3 },
      profile: { adivasi: 2.5, farm: 1.2, obc: 0.9, urban: 0.6, muslim: 0.3 } },
    { id: "NE", name: "Northeast", abbr: "Northeast", seats: 25, electorate: 28070, tile: { row: 1, col: 5 },
      profile: { adivasi: 3.5, muslim: 1.8, dalit: 0.4, obc: 0.3, upper: 0.5, urban: 0.5 } },
  ],

  elections: {
    "2024": {
      id: "2024",
      year: 2024,
      label: "2024 · Modi v. Rahul Gandhi",
      tagline: "April to June 2024. Modi is asking for a third term and 'ab ki baar 400 paar', the Ram temple is open, and the opposition has built an INDIA bloc out of old rivals. An opposition chief minister is in custody, and the Hindi belt will say whether the BJP still wins without its allies.",
      salience: { jobs: 0.9, identity: 0.8, institutions: 0.75, inflation: 0.75, welfare: 0.7, corruption: 0.55, growth: 0.5, federalism: 0.35, caste: 0.55 },
      regions: {
        UP: { v: { nda: 0.436, upa: 0.432, tmc: 0.005, bsp: 0.094, oth: 0.033 }, s: { nda: 36, upa: 43, oth: 1 } },
        BJ: { v: { nda: 0.468, upa: 0.374, bsp: 0.015, oth: 0.143 }, s: { nda: 39, upa: 14, oth: 1 } },
        MP: { v: { nda: 0.573, upa: 0.352, bsp: 0.027, oth: 0.048 }, s: { nda: 39, upa: 1 } },
        GR: { v: { nda: 0.552, upa: 0.38, bsp: 0.007, oth: 0.061 }, s: { nda: 40, upa: 11, oth: 2 } },
        MH: { v: { nda: 0.428, upa: 0.44, bsp: 0.007, oth: 0.125 }, s: { nda: 18, upa: 31, oth: 1 } },
        DH: { v: { nda: 0.494, upa: 0.459, bsp: 0.011, oth: 0.036 }, s: { nda: 12, upa: 6 } },
        PB: { v: { nda: 0.186, upa: 0.265, bsp: 0.025, aap: 0.26, oth: 0.264 }, s: { upa: 7, aap: 3, oth: 3 } },
        HM: { v: { nda: 0.446, upa: 0.385, bsp: 0.009, oth: 0.16 }, s: { nda: 11, upa: 2, oth: 2 } },
        KA: { v: { nda: 0.517, upa: 0.454, oth: 0.029 }, s: { nda: 19, upa: 9 } },
        KL: { v: { nda: 0.166, upa: 0.453, left: 0.333, oth: 0.048 }, s: { nda: 1, upa: 19, left: 1 } },
        TN: { v: { nda: 0.177, upa: 0.47, aiadmk: 0.227, oth: 0.126 }, s: { upa: 40 } },
        AT: { v: { nda: 0.462, upa: 0.179, bsp: 0.006, ysr: 0.239, brs: 0.066, oth: 0.048 }, s: { nda: 29, upa: 8, ysr: 4, oth: 1 } },
        WB: { v: { nda: 0.388, upa: 0.048, tmc: 0.456, left: 0.063, oth: 0.045 }, s: { nda: 13, upa: 1, tmc: 29 } },
        OD: { v: { nda: 0.454, upa: 0.132, bsp: 0.004, bjd: 0.375, oth: 0.035 }, s: { nda: 20, upa: 1 } },
        NE: { v: { nda: 0.433, upa: 0.355, tmc: 0.004, left: 0.01, aap: 0.006, oth: 0.192 }, s: { nda: 16, upa: 7, oth: 2 } },
      },
      // The real story beats of 2024, in campaign order.
      events: [
        { id: "ram_mandir", headline: "The Ram temple at Ayodhya is consecrated, and {party} carries the day's images into every village in the Hindi belt", role: "any", party: "nda", weight: 3, appeal: 0.03, momentum: 8, turn: 0 },
        { id: "nitish_flip", headline: "Nitish Kumar quits the INDIA bloc he helped build and rejoins the NDA, and Mamata Banerjee says she will go alone in Bengal. {party} watches its alliance lose its first bricks", role: "any", party: "upa", weight: 3, appeal: -0.03, momentum: -8, turn: 1 },
        { id: "electoral_bonds", headline: "The Supreme Court strikes down electoral bonds and the list of donors is published, and {party} finds the cash trail dominating the week", role: "any", party: "nda", weight: 3, appeal: -0.02, momentum: -5, turn: 2 },
        { id: "kejriwal_arrest", headline: "The Enforcement Directorate arrests Arvind Kejriwal a month before polling opens, and {party} loses its best campaigner to a cell", role: "any", party: "aap", weight: 3, appeal: -0.02, momentum: -5, turn: 3 },
        { id: "revanna_videos", headline: "Videos linked to Prajwal Revanna, the NDA's candidate in Hassan, surface days before Karnataka votes, and {party} spends the week disowning them", role: "any", party: "nda", weight: 3, appeal: -0.02, momentum: -5, turn: 4 },
        { id: "constitution_400", headline: "Opponents turn 'ab ki baar 400 paar' into a charge that the BJP needs 400 seats to change the Constitution, and {party}'s reservation message lands across the Hindi belt", role: "any", party: "upa", weight: 3, appeal: 0.03, momentum: 8, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "nyay_yatra", headline: "Rahul Gandhi's Bharat Jodo Nyay Yatra spends two months on the road through fifteen states, and {party} has a message for the villages", role: "any", party: "upa", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "agniveer", headline: "Anger over the short-service Agniveer recruitment scheme runs through army-recruiting districts in Haryana, Rajasthan and Uttar Pradesh, and {party} takes the blame", role: "any", party: "nda", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "tax_freeze", headline: "The tax department freezes Congress bank accounts over old dues, and {party} starts the campaign short of cash", role: "any", party: "upa", weight: 2, appeal: -0.015, momentum: -4 },
        { id: "andhra_pact", headline: "The TDP, Jana Sena and BJP seal a three-party pact in Andhra Pradesh, and {party} faces one united opponent for the first time", role: "any", party: "ysr", weight: 2, appeal: -0.025, momentum: -6 },
        { id: "pandian", headline: "The BJP attacks the influence of V. K. Pandian, a Tamil-born former civil servant, over the BJD government in Odisha, and {party} struggles to answer", role: "any", party: "bjd", weight: 2, appeal: -0.03, momentum: -7 },
        { id: "sandeshkhali", headline: "Allegations of land grabs and abuse against local Trinamool leaders in Sandeshkhali spread across Bengal, and {party} is forced onto the defensive", role: "any", party: "tmc", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "split_parties", headline: "Both the Shiv Sena and the NCP have split, and the Uddhav Thackeray and Sharad Pawar factions must fight under new names. Maharashtra reads it as a grievance, and {party} benefits", role: "any", party: "upa", weight: 2, appeal: 0.025, momentum: 6 },
      ],
    },

    "2019": {
      id: "2019",
      year: 2019,
      label: "2019 · Modi v. Rahul Gandhi",
      tagline: "April to May 2019. A terror attack in Kashmir and an air strike across the border have turned the campaign into one about security, and Modi is asking for five more years. Congress has a minimum income promise, and in Uttar Pradesh the Samajwadi Party and the BSP have buried their feud.",
      salience: { security: 0.95, jobs: 0.75, welfare: 0.7, corruption: 0.65, growth: 0.6, identity: 0.55, inflation: 0.4, federalism: 0.35 },
      regions: {
        UP: { v: { nda: 0.508, upa: 0.063, sp: 0.196, bsp: 0.193, oth: 0.04 }, s: { nda: 64, upa: 1, sp: 5, bsp: 10 } },
        BJ: { v: { nda: 0.539, upa: 0.318, left: 0.019, bsp: 0.015, oth: 0.109 }, s: { nda: 51, upa: 3 } },
        MP: { v: { nda: 0.561, upa: 0.362, bsp: 0.024, oth: 0.053 }, s: { nda: 37, upa: 3 } },
        GR: { v: { nda: 0.612, upa: 0.332, bsp: 0.01, oth: 0.046 }, s: { nda: 52, oth: 1 } },
        MH: { v: { nda: 0.509, upa: 0.32, bsp: 0.008, oth: 0.163 }, s: { nda: 42, upa: 6, oth: 2 } },
        DH: { v: { nda: 0.573, upa: 0.263, bsp: 0.026, aap: 0.075, oth: 0.063 }, s: { nda: 18 } },
        PB: { v: { nda: 0.372, upa: 0.401, left: 0.005, bsp: 0.035, aap: 0.074, oth: 0.113 }, s: { nda: 4, upa: 8, aap: 1 } },
        HM: { v: { nda: 0.593, upa: 0.316, bsp: 0.023, oth: 0.068 }, s: { nda: 12, upa: 3 } },
        KA: { v: { nda: 0.513, upa: 0.416, bsp: 0.012, oth: 0.059 }, s: { nda: 25, upa: 2, oth: 1 } },
        KL: { v: { nda: 0.129, upa: 0.474, left: 0.318, oth: 0.079 }, s: { upa: 20, left: 1 } },
        TN: { v: { nda: 0.297, upa: 0.526, oth: 0.177 }, s: { nda: 1, upa: 39 } },
        AT: { v: { nda: 0.078, upa: 0.118, left: 0.005, ysr: 0.309, tdp: 0.249, brs: 0.153, oth: 0.088 }, s: { nda: 4, upa: 3, ysr: 22, tdp: 3, brs: 9, oth: 1 } },
        WB: { v: { nda: 0.404, upa: 0.058, tmc: 0.43, left: 0.075, oth: 0.033 }, s: { nda: 18, upa: 3, tmc: 22 } },
        OD: { v: { nda: 0.384, upa: 0.144, left: 0.005, bsp: 0.008, bjd: 0.427, oth: 0.032 }, s: { nda: 8, upa: 1, bjd: 12 } },
        NE: { v: { nda: 0.437, upa: 0.338, left: 0.023, oth: 0.202 }, s: { nda: 17, upa: 4, oth: 4 } },
      },
      // The real story beats of 2019, in campaign order.
      events: [
        { id: "ews_quota", headline: "Parliament passes a 10 percent quota for economically weaker sections of the general category, and {party} shores up its upper-caste base", role: "any", party: "nda", weight: 3, appeal: 0.015, momentum: 4, turn: 0 },
        { id: "gathbandhan_up", headline: "Mayawati and Akhilesh Yadav bury a decades-old feud and announce a joint front in Uttar Pradesh, and {party} sees its caste arithmetic add up", role: "any", party: "sp", weight: 3, appeal: 0.025, momentum: 7, turn: 1 },
        { id: "pulwama_balakot", headline: "Forty CRPF men die at Pulwama and Indian jets strike Balakot twelve days later. Security displaces everything else, and {party} owns the moment", role: "any", party: "nda", weight: 3, appeal: 0.04, momentum: 10, turn: 2 },
        { id: "nyay", headline: "Rahul Gandhi promises 72,000 rupees a year to the poorest fifth of families under NYAY, and {party} finally has a number to sell", role: "any", party: "upa", weight: 3, appeal: 0.025, momentum: 7, turn: 3 },
        { id: "wayanad", headline: "Rahul Gandhi files from Wayanad as well as Amethi. The Kerala seat lifts {party} in the south and hands its rival a line about running", role: "any", party: "upa", weight: 3, appeal: 0.015, momentum: 5, turn: 4 },
        { id: "kolkata_clash", headline: "Clashes break out at Amit Shah's roadshow in Kolkata and a Vidyasagar bust is smashed, and the Election Commission cuts the Bengal campaign short. {party} has made the state a national fight", role: "any", party: "nda", weight: 3, appeal: 0.02, momentum: 6, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "rafale", headline: "Rahul Gandhi's 'chowkidar chor hai' attack on the Rafale deal meets Modi's 'main bhi chowkidar' reply, and {party} finds the charge has not travelled beyond its own supporters", role: "any", party: "upa", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "pm_kisan", headline: "The interim budget promises small farmers 6,000 rupees a year, and {party} answers the farm distress story with cash", role: "any", party: "nda", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "jagan_walk", headline: "Jagan Mohan Reddy ends a 3,600 kilometre walk across Andhra Pradesh, and {party} fills every hall it books", role: "any", party: "ysr", weight: 2, appeal: 0.03, momentum: 8 },
        { id: "sabarimala", headline: "The Sabarimala temple dispute spills into Kerala politics, and {party} is blamed for enforcing the court's order", role: "any", party: "left", weight: 2, appeal: -0.03, momentum: -7 },
        { id: "bjd_women", headline: "Naveen Patnaik reserves a third of BJD tickets for women, and {party} stands out in Odisha", role: "any", party: "bjd", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "kolkata_rally", headline: "Mamata Banerjee hosts opposition leaders from a dozen parties at a Kolkata rally, and {party} is cast as the architect of the anti-Modi front", role: "any", party: "tmc", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "mayawati_ban", headline: "The Election Commission bars Mayawati from campaigning for 48 hours over a speech to Muslim voters, and {party} loses days it cannot buy back", role: "any", party: "bsp", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "2014": {
      id: "2014",
      year: 2014,
      label: "2014 · Modi v. Rahul Gandhi",
      tagline: "April to May 2014. Ten years of UPA rule are ending in scandal, price rises and policy drift, and the BJP has bet everything on one man, the Gujarat chief minister since 2001, Narendra Modi. A new party, the AAP, has just left the Delhi government to go national.",
      salience: { corruption: 0.95, inflation: 0.9, growth: 0.85, jobs: 0.6, identity: 0.45, federalism: 0.4, welfare: 0.4, security: 0.3 },
      regions: {
        UP: { v: { nda: 0.433, upa: 0.084, sp: 0.222, bsp: 0.196, aap: 0.01, oth: 0.055 }, s: { nda: 73, upa: 2, sp: 5 } },
        BJ: { v: { nda: 0.394, upa: 0.287, tmc: 0.007, left: 0.031, bsp: 0.019, aap: 0.009, oth: 0.253 }, s: { nda: 43, upa: 9, oth: 2 } },
        MP: { v: { nda: 0.525, upa: 0.359, left: 0.005, sp: 0.006, bsp: 0.034, aap: 0.012, oth: 0.059 }, s: { nda: 37, upa: 3 } },
        GR: { v: { nda: 0.575, upa: 0.321, bsp: 0.017, aap: 0.011, oth: 0.076 }, s: { nda: 53 } },
        MH: { v: { nda: 0.512, upa: 0.341, left: 0.005, bsp: 0.026, aap: 0.023, oth: 0.093 }, s: { nda: 44, upa: 6 } },
        DH: { v: { nda: 0.432, upa: 0.198, bsp: 0.032, aap: 0.164, oth: 0.174 }, s: { nda: 15, upa: 1, oth: 2 } },
        PB: { v: { nda: 0.35, upa: 0.331, left: 0.006, bsp: 0.019, aap: 0.244, oth: 0.05 }, s: { nda: 6, upa: 3, aap: 4 } },
        HM: { v: { nda: 0.473, upa: 0.359, left: 0.005, bsp: 0.026, aap: 0.013, oth: 0.124 }, s: { nda: 12, oth: 3 } },
        KA: { v: { nda: 0.43, upa: 0.409, bsp: 0.009, aap: 0.008, oth: 0.144 }, s: { nda: 17, upa: 9, oth: 2 } },
        KL: { v: { nda: 0.104, upa: 0.404, left: 0.291, aap: 0.014, oth: 0.187 }, s: { upa: 13, left: 6, oth: 2 } },
        TN: { v: { nda: 0.189, upa: 0.047, left: 0.011, dmk: 0.253, aiadmk: 0.438, aap: 0.005, oth: 0.057 }, s: { nda: 3, aiadmk: 37 } },
        AT: { v: { nda: 0.377, upa: 0.116, left: 0.007, bsp: 0.008, ysr: 0.289, brs: 0.139, oth: 0.064 }, s: { nda: 19, upa: 2, ysr: 9, brs: 11, oth: 1 } },
        WB: { v: { nda: 0.17, upa: 0.099, tmc: 0.391, left: 0.296, bsp: 0.005, oth: 0.039 }, s: { nda: 3, upa: 4, tmc: 34, left: 2 } },
        OD: { v: { nda: 0.215, upa: 0.268, left: 0.006, bsp: 0.01, bjd: 0.441, aap: 0.007, oth: 0.053 }, s: { nda: 1, bjd: 20 } },
        NE: { v: { nda: 0.341, upa: 0.302, tmc: 0.017, left: 0.076, oth: 0.264 }, s: { nda: 10, upa: 8, left: 2, oth: 5 } },
      },
      // The real story beats of 2014, in campaign order.
      events: [
        { id: "telangana_bill", headline: "Parliament carves out Telangana after pepper spray in the Lok Sabha, and {party} is blamed on both sides of the new border", role: "any", party: "upa", weight: 3, appeal: -0.03, momentum: -8, turn: 0 },
        { id: "aap_49_days", headline: "Arvind Kejriwal quits as Delhi chief minister after 49 days and sets out to contest the country, and critics tell {party} it ran away", role: "any", party: "aap", weight: 3, appeal: -0.02, momentum: -6, turn: 1 },
        { id: "chaiwala", headline: "In January Mani Shankar Aiyar said Modi could come and serve tea at a Congress meeting, and {party} turns 'chaiwala' into its campaign", role: "any", party: "nda", weight: 3, appeal: 0.025, momentum: 7, turn: 0 },
        { id: "shah_ban", headline: "The Election Commission bars Amit Shah from rallies in Uttar Pradesh over a speech about 'revenge', and {party} spends a week answering for it", role: "any", party: "nda", weight: 3, appeal: -0.015, momentum: -4, turn: 3 },
        { id: "varanasi", headline: "Modi files in Varanasi after a vast roadshow, with Kejriwal standing against him, and {party} owns the news cycle", role: "any", party: "nda", weight: 3, appeal: 0.03, momentum: 8, turn: 4 },
        { id: "neech_rajniti", headline: "Priyanka Gandhi attacks Modi's 'neech rajniti' and he turns the phrase into a charge of caste insult in his final rallies, and {party} loses the last argument", role: "any", party: "upa", weight: 3, appeal: -0.02, momentum: -6, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "scams_prices", headline: "Telecom and coal scandals and a run of price rises have worn down the government's name, and {party} pays for ten years in office", role: "any", party: "upa", weight: 2, appeal: -0.03, momentum: -8 },
        { id: "mulayam_boys", headline: "Mulayam Singh Yadav says boys make mistakes of men facing the death penalty for rape, and {party} spends the week apologising", role: "any", party: "sp", weight: 2, appeal: -0.025, momentum: -6 },
        { id: "jaya_alone", headline: "Jayalalithaa breaks with the Left and names candidates for all 40 seats on her own, and {party} runs as the only choice for a DMK-weary Tamil Nadu", role: "any", party: "aiadmk", weight: 2, appeal: 0.03, momentum: 8 },
        { id: "phailin", headline: "Naveen Patnaik's handling of Cyclone Phailin, with few lives lost, is praised at home and abroad, and {party} rides the goodwill", role: "any", party: "bjd", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "jagan_legacy", headline: "Jagan Mohan Reddy runs on his father's welfare legacy across Andhra Pradesh, and {party} fills halls in every district", role: "any", party: "ysr", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "hologram", headline: "Modi's 3D hologram speeches reach hundreds of villages at once, and {party}'s message is everywhere in a single evening", role: "any", party: "nda", weight: 2, appeal: 0.015, momentum: 5 },
        { id: "broom", headline: "The AAP's broom becomes the symbol of the anti-corruption mood in the cities, and {party} draws first-time voters", role: "any", party: "aap", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "saradha", headline: "The Saradha chit fund collapse reaches the Bengal government's door, and {party} faces questions it would rather not answer", role: "any", party: "tmc", weight: 2, appeal: -0.02, momentum: -5 },
      ],
    },

    "2009": {
      id: "2009",
      year: 2009,
      label: "2009 · Singh v. Advani",
      tagline: "April to May 2009. Manmohan Singh seeks a second term after the nuclear deal, the farm loan waiver and a global slump, and L. K. Advani makes his last run at the top job. The Left has withdrawn its support from the government, the Third Front is hunting for a leader, and Congress is fighting alone in Uttar Pradesh and Bihar.",
      salience: { welfare: 0.8, security: 0.75, inflation: 0.6, growth: 0.6, identity: 0.45, corruption: 0.35, federalism: 0.3, nuclear_deal: 0.4 },
      regions: {
        UP: { v: { nda: 0.211, upa: 0.185, sp: 0.233, bsp: 0.274, oth: 0.097 }, s: { nda: 15, upa: 21, sp: 23, bsp: 20, oth: 1 } },
        BJ: { v: { nda: 0.358, upa: 0.16, left: 0.041, bsp: 0.042, oth: 0.399 }, s: { nda: 40, upa: 5, oth: 9 } },
        MP: { v: { nda: 0.441, upa: 0.394, left: 0.006, sp: 0.02, bsp: 0.054, oth: 0.085 }, s: { nda: 26, upa: 13, bsp: 1 } },
        GR: { v: { nda: 0.42, upa: 0.454, left: 0.01, bsp: 0.025, oth: 0.091 }, s: { nda: 21, upa: 31, oth: 1 } },
        MH: { v: { nda: 0.353, upa: 0.39, left: 0.007, sp: 0.01, bsp: 0.048, oth: 0.192 }, s: { nda: 21, upa: 26, oth: 3 } },
        DH: { v: { nda: 0.219, upa: 0.482, bsp: 0.116, oth: 0.183 }, s: { upa: 17, oth: 1 } },
        PB: { v: { nda: 0.44, upa: 0.452, left: 0.007, bsp: 0.057, oth: 0.044 }, s: { nda: 5, upa: 8 } },
        HM: { v: { nda: 0.342, upa: 0.443, left: 0.008, sp: 0.007, bsp: 0.071, oth: 0.129 }, s: { nda: 3, upa: 11, oth: 1 } },
        KA: { v: { nda: 0.418, upa: 0.377, bsp: 0.017, oth: 0.188 }, s: { nda: 19, upa: 6, oth: 3 } },
        KL: { v: { nda: 0.063, upa: 0.486, left: 0.379, bsp: 0.013, oth: 0.059 }, s: { upa: 17, left: 4 } },
        TN: { v: { nda: 0.024, upa: 0.426, left: 0.05, bsp: 0.008, aiadmk: 0.323, oth: 0.169 }, s: { upa: 28, left: 2, aiadmk: 10 } },
        AT: { v: { nda: 0.038, upa: 0.397, left: 0.029, bsp: 0.009, tdp: 0.249, brs: 0.061, oth: 0.217 }, s: { upa: 34, tdp: 6, brs: 2 } },
        WB: { v: { nda: 0.063, upa: 0.451, left: 0.433, bsp: 0.01, oth: 0.043 }, s: { nda: 2, upa: 25, left: 15, oth: 1 } },
        OD: { v: { nda: 0.169, upa: 0.36, left: 0.034, bsp: 0.019, bjd: 0.373, oth: 0.045 }, s: { upa: 6, left: 1, bjd: 14 } },
        NE: { v: { nda: 0.225, upa: 0.377, left: 0.086, oth: 0.312 }, s: { nda: 5, upa: 14, left: 2, oth: 4 } },
      },
      // The real story beats of 2009, in campaign order.
      events: [
        { id: "bjd_exit", headline: "Naveen Patnaik ends eleven years of alliance with the BJP over seat sharing, and {party} goes to Odisha's voters on its own", role: "any", party: "bjd", weight: 3, appeal: 0.025, momentum: 6, turn: 0 },
        { id: "fourth_front", headline: "Seat talks collapse and the SP, RJD and LJP form a fourth front, leaving Congress to fight alone in Uttar Pradesh and Bihar. {party} has two big states to rebuild by itself", role: "any", party: "upa", weight: 3, appeal: -0.015, momentum: -4, turn: 1 },
        { id: "varun_gandhi", headline: "A hate speech case against Varun Gandhi, the BJP's candidate in Pilibhit, dominates the week, and {party} cannot shake it", role: "any", party: "nda", weight: 3, appeal: -0.02, momentum: -5, turn: 2 },
        { id: "shoe_tytler", headline: "A journalist throws a shoe at P. Chidambaram over the 1984 riot cases, and Congress drops Jagdish Tytler and Sajjan Kumar. {party} spends the week on the wrong story", role: "any", party: "upa", weight: 3, appeal: -0.02, momentum: -5, turn: 3 },
        { id: "weakest_pm", headline: "Advani calls Manmohan Singh the weakest prime minister India has had, Singh replies with Advani's own record, and {party} spends days on the defensive", role: "any", party: "nda", weight: 3, appeal: -0.015, momentum: -4, turn: 2 },
        { id: "jai_ho", headline: "Jai Ho, the Oscar-winning song, becomes Congress's campaign anthem and blasts from every rally truck. {party} sounds like a winner from the start", role: "any", party: "upa", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "terror_26_11", headline: "The Mumbai attacks are still fresh, and the BJP campaigns hard on weak handling of terror. {party} gains with voters who want a tougher state", role: "any", party: "nda", weight: 2, appeal: 0.02, momentum: 5 },
        { id: "singur_nandigram", headline: "Singur and Nandigram have turned Bengal against its Left government, and the Trinamool and Congress alliance sweeps up the anger. {party} is the casualty", role: "any", party: "left", weight: 2, appeal: -0.03, momentum: -8 },
        { id: "loan_waiver", headline: "The 60,000 crore rupee farm loan waiver and the rural jobs guarantee are in every village conversation, and {party} claims the credit", role: "any", party: "upa", weight: 2, appeal: 0.025, momentum: 6 },
        { id: "mayawati_pm", headline: "Mayawati's name is floated as a Third Front prime minister, and {party} dreams big in Uttar Pradesh", role: "any", party: "bsp", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "black_money", headline: "Advani promises to bring back black money held in Swiss banks, and {party} finds a line that travels", role: "any", party: "nda", weight: 2, appeal: 0.015, momentum: 4 },
        { id: "kalyan_singh", headline: "Mulayam Singh Yadav's tie-up with Kalyan Singh, the former BJP chief minister, costs {party} Muslim votes", role: "any", party: "sp", weight: 2, appeal: -0.025, momentum: -6 },
        { id: "jaya_front", headline: "Jayalalithaa stitches together a front of the AIADMK, PMK, MDMK and the Left in Tamil Nadu, and {party} fights the DMK on even terms", role: "any", party: "aiadmk", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "2004": {
      id: "2004",
      year: 2004,
      label: "2004 · Vajpayee v. Sonia Gandhi",
      tagline: "April and May 2004. The NDA has called the election early on the back of 'India Shining', a decisive run of state wins and a prime minister still ahead in the polls. Sonia Gandhi's Congress has finally built alliances in Tamil Nadu, Bihar and Maharashtra, while the Samajwadi Party and the BSP stand outside both fronts in Uttar Pradesh. Four phases of polling, counted on 13 May.",
      salience: { growth: 0.7, welfare: 0.75, identity: 0.5, leadership: 0.45, jobs: 0.5, security: 0.4, stability: 0.5, local: 0.45 },
      regions: {
        UP: { v: { nda: 0.231, upa: 0.124, sp: 0.312, bsp: 0.247, oth: 0.086 }, s: { nda: 11, upa: 9, sp: 38, bsp: 19, oth: 3 } },
        BJ: { v: { nda: 0.37, upa: 0.446, left: 0.016, bsp: 0.033, oth: 0.135 }, s: { nda: 12, upa: 42 } },
        MP: { v: { nda: 0.481, upa: 0.359, left: 0.004, bsp: 0.047, oth: 0.109 }, s: { nda: 35, upa: 5 } },
        GR: { v: { nda: 0.488, upa: 0.434, left: 0.005, bsp: 0.024, oth: 0.049 }, s: { nda: 35, upa: 17, oth: 1 } },
        MH: { v: { nda: 0.428, upa: 0.429, left: 0.008, bsp: 0.03, oth: 0.105 }, s: { nda: 26, upa: 24 } },
        DH: { v: { nda: 0.254, upa: 0.466, bsp: 0.041, oth: 0.239 }, s: { nda: 2, upa: 16 } },
        PB: { v: { nda: 0.448, upa: 0.386, bsp: 0.077, oth: 0.089 }, s: { nda: 11, upa: 2 } },
        HM: { v: { nda: 0.368, upa: 0.398, left: 0.004, sp: 0.03, bsp: 0.037, oth: 0.163 }, s: { nda: 4, upa: 6, sp: 1, oth: 4 } },
        KA: { v: { nda: 0.367, upa: 0.369, bsp: 0.012, oth: 0.252 }, s: { nda: 18, upa: 8, oth: 2 } },
        KL: { v: { nda: 0.122, upa: 0.384, left: 0.461, bsp: 0.005, oth: 0.028 }, s: { nda: 2, upa: 1, left: 18 } },
        TN: { v: { nda: 0.38, upa: 0.573, bsp: 0.006, oth: 0.041 }, s: { upa: 40 } },
        AT: { v: { nda: 0.415, upa: 0.52, bsp: 0.014, oth: 0.051 }, s: { nda: 5, upa: 37 } },
        WB: { v: { nda: 0.292, upa: 0.149, left: 0.505, bsp: 0.009, oth: 0.045 }, s: { nda: 1, upa: 7, left: 35 } },
        OD: { v: { nda: 0.494, upa: 0.42, bsp: 0.022, oth: 0.064 }, s: { nda: 18, upa: 3 } },
        NE: { v: { nda: 0.335, upa: 0.305, left: 0.083, oth: 0.277 }, s: { nda: 9, upa: 11, left: 2, oth: 3 } },
      },
      // The real story beats of 2004, in campaign order.
      events: [
        { id: "dmk_pmk_exit", headline: "The DMK and the PMK, who left the NDA in December and January over Ayodhya, have joined Congress's front in Tamil Nadu, and {party} faces a southern collapse", role: "any", party: "nda", weight: 3, appeal: -0.025, momentum: -7, turn: 0 },
        { id: "rahul_amethi", headline: "Rahul Gandhi announces in March that he will contest his father's old seat at Amethi, and {party} puts a new face in front of Uttar Pradesh", role: "any", party: "upa", weight: 3, appeal: 0.015, momentum: 5, turn: 0 },
        { id: "foreign_origin_04", headline: "The BJP and the AIADMK tell the Election Commission they will keep raising Sonia Gandhi's foreign origin, and {party} spends another week on it", role: "any", party: "nda", weight: 3, appeal: -0.01, momentum: -3, turn: 1 },
        { id: "vajpayee_lucknow", headline: "Vajpayee files his nomination at Lucknow on 7 April, and {party} opens its campaign on its best-known face", role: "any", party: "nda", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "nda_manifesto", headline: "NDA leaders meet in New Delhi on 8 April to adopt an 'Agenda for Development and Good Governance', and {party} sets out the case for another term", role: "any", party: "nda", weight: 3, appeal: 0.01, momentum: 3, turn: 1 },
        { id: "ap_double_poll", headline: "Andhra Pradesh votes for the state assembly and the Lok Sabha together on 20 and 26 April, and {party}'s ally, the TDP, carries the weight of its time in office", role: "any", party: "nda", weight: 3, appeal: -0.02, momentum: -6, turn: 3 },
        { id: "market_slide", headline: "Share prices start to fall after the second phase on 26 April as investors doubt an NDA win, and {party} is put on the defensive over its reform record", role: "any", party: "nda", weight: 3, appeal: -0.015, momentum: -5, turn: 3 },
        { id: "chhapra_repoll", headline: "Booth capturing is reported at Chhapra in Bihar on 5 May and the Election Commission orders a fresh poll there, an awkward week for the RJD, {party}'s main Bihar ally", role: "any", party: "upa", weight: 3, appeal: -0.01, momentum: -3, turn: 5 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "india_shining", headline: "The 'India Shining' advertisements, about 5 billion rupees of them, run in every medium while villages cope with drought, and {party} is accused of boasting", role: "any", party: "nda", weight: 2, appeal: -0.02, momentum: -6 },
        { id: "mulayam_alone", headline: "Talks with Congress collapsed, so Mulayam Singh Yadav's Samajwadi Party and its ally the RLD take on Congress, the BJP and the BSP alone, and {party} makes Uttar Pradesh a four-way race", role: "any", party: "sp", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "mayawati_all_80", headline: "Mayawati's BSP contests all 80 seats in Uttar Pradesh, and {party} bets on its Dalit base across the state", role: "any", party: "bsp", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "dpa_clear_field", headline: "Karunanidhi's front of the DMK, Congress, PMK, MDMK and the Left puts up one candidate against the AIADMK and the BJP in each of Tamil Nadu's 39 seats, and {party} has a clear field", role: "any", party: "upa", weight: 2, appeal: 0.03, momentum: 8 },
        { id: "lalu_front", headline: "Lalu Prasad Yadav's RJD, Congress and Ram Vilas Paswan's LJP settle a Bihar seat deal of 26, 4 and 8, with one seat each for the NCP and the CPI(M), and {party} is the front to beat", role: "any", party: "upa", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "maharashtra_front", headline: "Congress and the NCP fight Maharashtra as one front, with 26 and 18 seats, and {party} avoids the split vote that cost it in 1999", role: "any", party: "upa", weight: 2, appeal: 0.025, momentum: 7 },
        { id: "left_swing", headline: "The Left Front fights Congress and the NDA in Bengal, Kerala and Tripura, and {party} presents itself as the vote that decides the next government", role: "any", party: "left", weight: 2, appeal: 0.02, momentum: 5 },
      ],
    },

    "1999": {
      id: "1999",
      year: 1999,
      label: "1999 · Vajpayee v. Sonia Gandhi",
      tagline: "September and October 1999. Vajpayee's government fell by a single vote in April, the Kargil war has just ended, and the NDA has gathered more than twenty parties behind him. Sonia Gandhi fights her first Lok Sabha election with few allies, and Sharad Pawar has left Congress over her Italian birth. Polling runs from 5 September to 3 October.",
      salience: { security: 0.8, leadership: 0.65, stability: 0.7, growth: 0.45, corruption: 0.3, alliances: 0.4, identity: 0.35 },
      regions: {
        UP: { v: { nda: 0.292, upa: 0.161, sp: 0.25, bsp: 0.226, oth: 0.071 }, s: { nda: 27, upa: 11, sp: 26, bsp: 14, oth: 2 } },
        BJ: { v: { nda: 0.455, upa: 0.371, left: 0.037, bsp: 0.009, ncp: 0.013, oth: 0.115 }, s: { nda: 41, upa: 11, left: 1, oth: 1 } },
        MP: { v: { nda: 0.466, upa: 0.439, bsp: 0.052, oth: 0.043 }, s: { nda: 29, upa: 11 } },
        GR: { v: { nda: 0.507, upa: 0.452, left: 0.005, bsp: 0.015, ncp: 0.003, oth: 0.018 }, s: { nda: 36, upa: 16, oth: 1 } },
        MH: { v: { nda: 0.382, upa: 0.333, left: 0.006, bsp: 0.003, ncp: 0.214, oth: 0.062 }, s: { nda: 30, upa: 11, ncp: 6, oth: 3 } },
        DH: { v: { nda: 0.555, upa: 0.377, bsp: 0.021, oth: 0.047 }, s: { nda: 17, upa: 1 } },
        PB: { v: { nda: 0.406, upa: 0.444, bsp: 0.038, oth: 0.112 }, s: { nda: 3, upa: 9, oth: 1 } },
        HM: { v: { nda: 0.44, upa: 0.337, left: 0.006, bsp: 0.066, oth: 0.151 }, s: { nda: 10, upa: 1, oth: 4 } },
        KA: { v: { nda: 0.405, upa: 0.454, bsp: 0.006, oth: 0.135 }, s: { nda: 10, upa: 18 } },
        KL: { v: { nda: 0.08, upa: 0.47, left: 0.399, oth: 0.051 }, s: { upa: 12, left: 9 } },
        TN: { v: { nda: 0.469, upa: 0.419, oth: 0.112 }, s: { nda: 26, upa: 14 } },
        AT: { v: { nda: 0.498, upa: 0.428, left: 0.027, oth: 0.047 }, s: { nda: 36, upa: 5, oth: 1 } },
        WB: { v: { nda: 0.373, upa: 0.135, left: 0.465, oth: 0.027 }, s: { nda: 11, upa: 3, left: 29 } },
        OD: { v: { nda: 0.578, upa: 0.369, left: 0.014, bsp: 0.003, oth: 0.036 }, s: { nda: 19, upa: 2 } },
        NE: { v: { nda: 0.272, upa: 0.364, left: 0.066, ncp: 0.027, oth: 0.271 }, s: { nda: 4, upa: 14, left: 2, ncp: 2, oth: 3 } },
      },
      // The real story beats of 1999, in campaign order.
      events: [
        { id: "one_vote_fall", headline: "Vajpayee's government fell by a single vote on 17 April when the AIADMK withdrew, and {party} asks voters to finish what the Lok Sabha could not", role: "any", party: "nda", weight: 3, appeal: 0.025, momentum: 7, turn: 0 },
        { id: "pawar_exit", headline: "Sharad Pawar, P. A. Sangma and Tariq Anwar, expelled on 20 May for questioning Sonia Gandhi's Italian birth, have founded the NCP, and {party} fights Maharashtra against its own former chief minister", role: "any", party: "upa", weight: 3, appeal: -0.03, momentum: -8, turn: 0 },
        { id: "dmk_joins_nda", headline: "The DMK joins the NDA for the first time while the AIADMK, which brought the government down, stands with Congress in Tamil Nadu, and {party} gathers more than twenty parties", role: "any", party: "nda", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "sonia_bellary", headline: "Sonia Gandhi files in Bellary as well as Amethi, and the BJP answers with Sushma Swaraj in Bellary, so {party} makes a southern seat the symbol of its campaign", role: "any", party: "upa", weight: 3, appeal: 0.02, momentum: 6, turn: 1 },
        { id: "tdp_bjp_andhra", headline: "In Andhra Pradesh the TDP takes 34 seats and the BJP 8 in one joint run against Congress, and {party} treats the state as its anchor in the south", role: "any", party: "nda", weight: 3, appeal: 0.015, momentum: 5, turn: 2 },
        { id: "madhepura", headline: "Lalu Prasad Yadav is tied down at Madhepura by Sharad Yadav of the JD(U), and {party} has its Bihar chief fighting for his own seat", role: "any", party: "upa", weight: 3, appeal: -0.02, momentum: -5, turn: 4 },
        // Unscheduled flavour: joins the weekly draw, fires at most once.
        { id: "kargil", headline: "The Kargil war, ended in July, is still the story in every barracks town and village, and {party} campaigns on Vajpayee's handling of it", role: "any", party: "nda", weight: 2, appeal: 0.03, momentum: 8 },
        { id: "videshi_swadeshi", headline: "The BJP sets the 'videshi' Sonia Gandhi against the 'swadeshi' Vajpayee at every rally, and {party} has a ready contrast", role: "any", party: "nda", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "sonia_offer_resign", headline: "Sonia Gandhi's offer in May to resign as party leader brought an outpouring of support, and {party} workers rally round her", role: "any", party: "upa", weight: 2, appeal: 0.015, momentum: 5 },
        { id: "few_allies", headline: "Congress goes into the campaign with far fewer allies than the NDA's twenty-odd parties, and {party} has to win seat by seat on its own", role: "any", party: "upa", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "mulayam_refuses", headline: "Mulayam Singh Yadav refused in April to back a Sonia Gandhi government, and {party} now fights Congress as well as the BJP in Uttar Pradesh", role: "any", party: "sp", weight: 2, appeal: 0.02, momentum: 6 },
        { id: "bsp_every_seat", headline: "The BSP contests every one of the 85 seats in Uttar Pradesh on its own, and {party} backs its Dalit base against all comers", role: "any", party: "bsp", weight: 2, appeal: 0.015, momentum: 5 },
        { id: "basu_offer", headline: "Jayalalithaa's April suggestion of Jyoti Basu as prime minister, which he declined, keeps {party} in the national picture", role: "any", party: "left", weight: 2, appeal: 0.01, momentum: 3 },
        { id: "bengal_tmc_bjp", headline: "Mamata Banerjee's Trinamool Congress and the BJP take on the Left Front together across Bengal, and {party} faces a combined opposition in its stronghold", role: "any", party: "left", weight: 2, appeal: -0.02, momentum: -5 },
        { id: "growth_record", headline: "Steady growth and low inflation under the NDA give {party} a record to run on", role: "any", party: "nda", weight: 2, appeal: 0.015, momentum: 4 },
      ],
    },
  },

  leaders: {
    "2024": {
      nda: { partyId: "nda", name: "Narendra Modi", charisma: 88, energy: 90, competence: 70, machine: 94 },
      upa: { partyId: "upa", name: "Rahul Gandhi & Mallikarjun Kharge", charisma: 62, energy: 78, competence: 54, machine: 64 },
      tmc: { partyId: "tmc", name: "Mamata Banerjee", charisma: 70, energy: 84, competence: 56, machine: 80 },
      left: { partyId: "left", name: "Sitaram Yechury & Pinarayi Vijayan", charisma: 44, energy: 56, competence: 62, machine: 60 },
      bsp: { partyId: "bsp", name: "Mayawati", charisma: 56, energy: 52, competence: 50, machine: 56 },
      bjd: { partyId: "bjd", name: "Naveen Patnaik", charisma: 58, energy: 46, competence: 70, machine: 78 },
      ysr: { partyId: "ysr", name: "Jagan Mohan Reddy", charisma: 68, energy: 74, competence: 52, machine: 62 },
      aiadmk: { partyId: "aiadmk", name: "Edappadi K. Palaniswami", charisma: 48, energy: 60, competence: 58, machine: 70 },
      aap: { partyId: "aap", name: "Arvind Kejriwal", charisma: 64, energy: 74, competence: 54, machine: 46 },
    },
    "2019": {
      nda: { partyId: "nda", name: "Narendra Modi", charisma: 88, energy: 92, competence: 70, machine: 94 },
      upa: { partyId: "upa", name: "Rahul Gandhi", charisma: 62, energy: 72, competence: 48, machine: 60 },
      tmc: { partyId: "tmc", name: "Mamata Banerjee", charisma: 74, energy: 88, competence: 56, machine: 82 },
      left: { partyId: "left", name: "Sitaram Yechury", charisma: 40, energy: 58, competence: 62, machine: 60 },
      sp: { partyId: "sp", name: "Akhilesh Yadav", charisma: 66, energy: 70, competence: 56, machine: 68 },
      bsp: { partyId: "bsp", name: "Mayawati", charisma: 64, energy: 68, competence: 54, machine: 76 },
      bjd: { partyId: "bjd", name: "Naveen Patnaik", charisma: 62, energy: 54, competence: 72, machine: 84 },
      ysr: { partyId: "ysr", name: "Jagan Mohan Reddy", charisma: 74, energy: 82, competence: 56, machine: 78 },
      aap: { partyId: "aap", name: "Arvind Kejriwal", charisma: 66, energy: 74, competence: 56, machine: 46 },
    },
    "2014": {
      nda: { partyId: "nda", name: "Narendra Modi", charisma: 90, energy: 92, competence: 68, machine: 90 },
      upa: { partyId: "upa", name: "Rahul Gandhi & Manmohan Singh", charisma: 52, energy: 60, competence: 52, machine: 58 },
      tmc: { partyId: "tmc", name: "Mamata Banerjee", charisma: 74, energy: 86, competence: 54, machine: 78 },
      left: { partyId: "left", name: "Prakash Karat", charisma: 38, energy: 56, competence: 60, machine: 66 },
      sp: { partyId: "sp", name: "Mulayam Singh Yadav", charisma: 62, energy: 62, competence: 58, machine: 70 },
      bsp: { partyId: "bsp", name: "Mayawati", charisma: 66, energy: 70, competence: 56, machine: 74 },
      bjd: { partyId: "bjd", name: "Naveen Patnaik", charisma: 62, energy: 56, competence: 72, machine: 82 },
      ysr: { partyId: "ysr", name: "Jagan Mohan Reddy", charisma: 70, energy: 78, competence: 52, machine: 68 },
      aiadmk: { partyId: "aiadmk", name: "J. Jayalalithaa", charisma: 76, energy: 66, competence: 60, machine: 82 },
      aap: { partyId: "aap", name: "Arvind Kejriwal", charisma: 76, energy: 90, competence: 58, machine: 48 },
    },
    "2009": {
      nda: { partyId: "nda", name: "L. K. Advani", charisma: 56, energy: 60, competence: 66, machine: 78 },
      upa: { partyId: "upa", name: "Manmohan Singh & Sonia Gandhi", charisma: 54, energy: 52, competence: 80, machine: 84 },
      left: { partyId: "left", name: "Prakash Karat", charisma: 40, energy: 58, competence: 62, machine: 72 },
      sp: { partyId: "sp", name: "Mulayam Singh Yadav", charisma: 66, energy: 66, competence: 60, machine: 76 },
      bsp: { partyId: "bsp", name: "Mayawati", charisma: 70, energy: 74, competence: 62, machine: 84 },
      bjd: { partyId: "bjd", name: "Naveen Patnaik", charisma: 62, energy: 58, competence: 70, machine: 80 },
      aiadmk: { partyId: "aiadmk", name: "J. Jayalalithaa", charisma: 74, energy: 68, competence: 60, machine: 76 },
    },
    "2004": {
      nda: { partyId: "nda", name: "Atal Bihari Vajpayee", charisma: 86, energy: 52, competence: 78, machine: 84 },
      upa: { partyId: "upa", name: "Sonia Gandhi", charisma: 66, energy: 76, competence: 56, machine: 74 },
      left: { partyId: "left", name: "Harkishan Singh Surjeet", charisma: 36, energy: 46, competence: 66, machine: 78 },
      sp: { partyId: "sp", name: "Mulayam Singh Yadav", charisma: 64, energy: 66, competence: 60, machine: 78 },
      bsp: { partyId: "bsp", name: "Mayawati", charisma: 62, energy: 70, competence: 56, machine: 76 },
    },
    "1999": {
      nda: { partyId: "nda", name: "Atal Bihari Vajpayee", charisma: 90, energy: 58, competence: 78, machine: 88 },
      upa: { partyId: "upa", name: "Sonia Gandhi", charisma: 56, energy: 66, competence: 40, machine: 62 },
      left: { partyId: "left", name: "Harkishan Singh Surjeet", charisma: 38, energy: 50, competence: 66, machine: 78 },
      sp: { partyId: "sp", name: "Mulayam Singh Yadav", charisma: 62, energy: 64, competence: 58, machine: 74 },
      bsp: { partyId: "bsp", name: "Kanshi Ram", charisma: 54, energy: 56, competence: 56, machine: 72 },
    },
  },

  // Generic events for the weekly random draw, plus player decision events.
  events: [
    { id: "inflation_print", headline: "A bad inflation print leads the evening bulletins, putting pressure on {party}", role: "leader", weight: 3, appeal: -0.03, momentum: -7 },
    { id: "onion_prices", headline: "Onion and vegetable prices jump again, and voters look to {party}", role: "challenger", weight: 3, appeal: 0.025, momentum: 6 },
    { id: "viral_speech", headline: "A rally speech goes viral across the messaging apps, and {party} owns the day", role: "any", weight: 3, appeal: 0.03, momentum: 8 },
    { id: "old_video", headline: "An old video of a candidate resurfaces, and {party} spends the day explaining it", role: "any", weight: 2, appeal: -0.03, momentum: -7 },
    { id: "seat_arithmetic", headline: "Seat arithmetic persuades smaller parties and local leaders to tilt toward {party}", role: "challenger", weight: 2, appeal: 0.025, momentum: 6 },
    { id: "interview_fumble", headline: "{party}'s leader fumbles a question on prices in a television interview", role: "any", weight: 2, appeal: -0.03, momentum: -6 },
    { id: "local_leaders", headline: "Influential local leaders announce their support for {party}", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "first_time_voters_in", headline: "A viral reel breaks for {party} among first-time voters", role: "challenger", weight: 2, appeal: 0.025, momentum: 8 },
    { id: "village_march", headline: "A long march through the villages wins {party} friendly local coverage", role: "any", weight: 2, appeal: 0.02, momentum: 5 },
    { id: "heatwave", headline: "A heatwave on polling days thins the afternoon queues, and {party}'s organisation keeps its voters coming", role: "any", weight: 2, appeal: 0.015, momentum: 4 },
    { id: "defection", headline: "A sitting MP crosses over to {party} on the eve of nominations", role: "any", weight: 2, appeal: 0.015, momentum: 5 },
    { id: "ec_notice", headline: "The Election Commission serves {party} a notice over a campaign speech", role: "any", weight: 2, appeal: -0.02, momentum: -5 },
    { id: "flood_response", headline: "Floods put the administration to the test, and {party} looks the part", role: "leader", weight: 2, appeal: 0.025, momentum: 6 },
    {
      id: "interview_offer",
      headline: "A national news channel offers {party} a long prime-time interview",
      role: "player",
      weight: 4,
      prompt: "The channel is not a friendly one, but the audience is enormous. How do you play it?",
      choices: [
        { id: "accept_hard", text: "Accept and take the hard questions", resultText: "You get through the rough patches and land a few lines that clip well. The overnight numbers move your way.", appeal: 0.03, momentum: 10, rivalAppeal: -0.015 },
        { id: "accept_friendly", text: "Give it to a friendlier channel instead", resultText: "A comfortable hour. Your supporters cheer and nobody else changes their mind.", appeal: 0.015, momentum: 4 },
        { id: "decline", text: "Decline and let the rally crowds speak", resultText: "You skip the studio. The opposition fills the silence and calls it running away.", appeal: -0.01, momentum: -4 },
      ],
    },
    {
      id: "seat_deal",
      headline: "Allies in a big state are haggling with {party} over who contests which seats",
      role: "player",
      weight: 3,
      prompt: "The deadline for nominations is Friday. What do you offer?",
      choices: [
        { id: "concede_seats", text: "Concede seats and keep the alliance whole", resultText: "The alliance holds, and your own workers grumble about the seats you gave up.", appeal: 0.02, momentum: 5 },
        { id: "hold_out", text: "Hold out for the seats you want", resultText: "You get most of what you asked for and a sulking ally.", appeal: 0.01, momentum: 2 },
        { id: "go_alone", text: "Walk away and contest everywhere", resultText: "A bold line that splits the vote. It also splits yours.", appeal: -0.01, momentum: -3, rivalAppeal: 0.01 },
      ],
    },
    {
      id: "manifesto_pledge",
      headline: "{party}'s manifesto committee is split on the big welfare pledge",
      role: "player",
      weight: 3,
      prompt: "The manifesto goes to print on Friday. Which way do you push?",
      choices: [
        { id: "bold", text: "Promise a large cash transfer or loan waiver", resultText: "The villages light up. Finance officials start sharpening pencils.", appeal: 0.035, momentum: 12 },
        { id: "cautious", text: "Keep to schemes that are already funded", resultText: "No spark, and no self-inflicted wounds.", appeal: 0.01, momentum: 2 },
        { id: "contrast", text: "Make it a contrast with the rival's record", resultText: "You define them more than yourself, and it lands.", appeal: 0.02, momentum: 6, rivalAppeal: -0.02 },
      ],
    },
  ],
};
attachElectionIssues(INDIA, IN_ELECTION_ISSUES);
