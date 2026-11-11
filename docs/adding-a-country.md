# Adding a country (or an election)

Every country in Margin of Victory is one module file under `src/content/countries/`. The
module carries everything specific to that country: its campaign content (the `CountryBundle`),
map, registry rows, store pack, landing cover, daily challenge pairing, "play next" chain and
native guide entry. Every shared table derives from the ordered list in
`src/content/countries/index.ts`:

| Derived table | File | What it reads from the module |
|---|---|---|
| Scenario registry | `src/content/scenarioRegistry.ts` | `scenarios`, `pack.id`, `flag`, bundle election labels and years |
| Store packs | `src/content/packs.ts` | `pack` plus every paid row; Complete gets them all |
| Landing cards and covers | `src/content/covers.ts`, `src/ui/LandingPage.tsx`, `src/ui/ScenarioArt.tsx` | `name`, `blurb`, `cover`, `art` |
| Daily challenge | `src/lib/daily.ts` | `daily.pair`, `daily.names` |
| Play next | `src/content/nextScenario.ts` | `next.chain` / `next.map` |
| Server entitlements, catalog, score validation | `server/*` | the derived registry and packs |
| Native apps (Kotlin, Android, iOS) | `apps/native/scripts/export-content-bundles.ts` | the whole module, exported as data |

Adding a country never touches the shared files, the server, Kotlin, Swift or Compose. You write
one module file, generate its map, add two lines to `index.ts`, add a cover photo, rate its
difficulty and regenerate the native data.

New Zealand (`src/content/countries/newZealand.ts`) was built this way and is the reference to
copy. Germany is the other mixed-member proportional example; Canada and Australia are
first past the post and preferential; France is a two-round runoff; Mexico is a single-round
plurality presidency (`plurality: true`, section 5).

## Contents

1. [Steps for a new country](#1-steps-for-a-new-country)
2. [Module template](#2-module-template)
3. [Getting the results data right](#3-getting-the-results-data-right)
4. [Map paths](#4-map-paths)
5. [Country rules: coalitions, government text, runoffs, goal line](#5-country-rules)
6. [Rating difficulty](#6-rating-difficulty)
7. [Regenerating native content and vectors](#7-regenerating-native-content-and-vectors)
8. [Checks that must pass](#8-checks-that-must-pass)
9. [Invariant checklist](#9-invariant-checklist)
10. [Adding an election to an existing country](#10-adding-an-election-to-an-existing-country)
11. [Rules that protect players](#11-rules-that-protect-players)

## 1. Steps for a new country

Run `npm ci` once in your worktree first.

1. **Pick the ids.** A two-letter upper-case country code (`NZ`), a pack id in kebab case
   (`new-zealand`), and short lower-case party ids (`lab`, `nat`). Scenario ids are generated as
   `<code lowercase>-<electionId>` (`nz-2023`). These ids are permanent once shipped.
2. **Write the module** at `src/content/countries/<camelCaseName>.ts` from the template in
   section 2. Content must be historically accurate (section 3).
3. **Generate the map** into `src/content/countries/paths/<code>.ts` (section 4).
4. **Register it** in `src/content/countries/index.ts`: one import line and one entry at the
   **end** of `COUNTRY_MODULES`. Never reorder or remove existing entries (section 11).
5. **Add a cover photo** at `public/images/covers/country-<code>.jpg` with an entry in
   `public/images/covers/ATTRIBUTION.json` (section 2, "Cover").
6. **Run the completeness suite** until it is green:
   `npx vitest run src/content/__tests__/country-completeness.test.ts`
7. **Rate difficulty** with the balance gauntlet (section 6).
8. **Regenerate native content and vectors** (section 7).
9. **Add a CHANGELOG entry** under `## [Unreleased]` → `### Added`, written for players, in the
   existing style.
10. **Run the full gate** (section 8) and commit. Stage explicit files only.

## 2. Module template

```ts
// <COUNTRY>: <n> <kind of> elections, one bundle.
//
// Explain the electoral system, how the regions were built, what the seat
// tables represent, and the real national result of each election (seats per
// party, chamber size, majority line). Cite how the numbers were derived.

import type { CountryBundle } from "@engine/countryGame";
import { countryModule } from "./types";
import { XX_MAP } from "./paths/xx";

export const COUNTRY_NAME: CountryBundle = {
  id: "XX",                      // the country code, same as the module code
  label: "Country Name",
  flag: "🇽🇽",
  currency: "$",
  unitName: "seat",              // "point" for a runoff
  unitNamePlural: "seats",
  goalText: "76 of 150 seats",   // the newest election's winning post
  defaultSeatElasticity: 1.0,    // 1.0 for proportional systems, about 2.6 for first past the post
  eventChance: 0.7,
  map: XX_MAP,

  system: {
    id: "XX",
    label: "Country Name",
    parties: [
      { id: "aaa", name: "Full Party Name", shortName: "Short", color: "#rrggbb" },
      // ...every party that appears in any election's results...
      { id: "oth", name: "Others (...)", shortName: "Other", color: "#9aa0a6" },
    ],
    allocation: { id: "regional_seats_curve", label: "Plain description of the system", unit: "seat" },
    majority: { total: 150, threshold: 76 },  // newest election; threshold = floor(total / 2) + 1
  },
  playable: ["aaa", "bbb"],      // parties a player may lead, in picker order
  abstaining: [],                // parties that win seats but never take them
  coalitions: { forbidden: [["aaa", "bbb"]], isolated: ["oth"] },  // section 5
  governmentText: { /* optional, section 5 */ },
  goalHint: "Reach {majority} of {total} seats. ...",              // optional, section 5

  issues: [
    { id: "cost_of_living", name: "Cost of living", blurb: "One plain sentence." },
  ],
  blocs: [
    // share: national fraction (normalised per region); turnoutPropensity 0..1;
    // tilt: per-party logit nudge relative to the region's baseline.
    { id: "young", name: "Young voters (18-29)", share: 0.2, turnoutPropensity: 0.6, tilt: { aaa: 0.3, bbb: -0.3 } },
  ],
  regions: [
    // seats: the newest election's pool; electorate: thousands of votes cast;
    // tile: a unique row/col for the tile cartogram; profile: bloc multipliers.
    { id: "R1", name: "Region One", abbr: "R1", seats: 20, electorate: 900, tile: { row: 0, col: 0 }, profile: { young: 1.2 } },
  ],

  elections: {
    "2025": {
      id: "2025",                // must equal the key
      year: 2025,
      label: "2025 · Leader v. Leader",
      tagline: "Two or three sentences that set the scene in plain language.",
      salience: { cost_of_living: 0.9 },   // keys are issue ids
      // majority / goalText only when this election's chamber differs from system.majority:
      // majority: { total: 151, threshold: 76 }, goalText: "76 of 151 seats",
      regions: {
        R1: { v: { aaa: 0.45, bbb: 0.40, oth: 0.15 }, s: { aaa: 11, bbb: 9 } },
      },
      events: [
        // At least 5. At least one scheduled beat (turn 0 to 5, fires that week).
        // `party` pins the target; {party} is replaced with its short name.
        { id: "unique_id", headline: "What happened, and how it hits {party}", role: "any", party: "aaa", weight: 3, appeal: -0.03, momentum: -8, turn: 0 },
      ],
    },
  },

  leaders: {
    "2025": {
      // Every playable party that stands in the election needs one. Traits 0-100.
      aaa: { partyId: "aaa", name: "Real Name", charisma: 60, energy: 60, competence: 60, machine: 60 },
    },
  },

  // Generic events for the weekly random draw, plus player decision events
  // (role "player" with a prompt and choices). Copy New Zealand's or Germany's.
  events: [],
};

export const COUNTRY_NAME_MODULE = countryModule(COUNTRY_NAME, {
  blurb: "One line for the landing page country card.",
  systemLabel: "A few words on the voting system, shown on the store tile",
  cover: "images/covers/country-xx.jpg",
  art: { a: "#0b1f3a", b: "#1d6b5c", glow: "rgba(236,240,245,0.2)" },  // scenario art colours
  scenarios: [
    // Newest first. One row per election in the bundle, no more, no fewer.
    // label defaults to the election's label; override only when they differ.
    { electionId: "2025", difficulty: "hard", description: "One or two sentences for the picker." },
  ],
  pack: { id: "country-name", name: "Country Name", description: "Plain description of the pack.", price: 99 },
  daily: { pair: ["aaa", "bbb"], names: { aaa: "the Short", bbb: "the Other" } },
  next: {
    chain: [
      // Chronological; wraps from the newest back to the oldest.
      { id: "2025", blurb: "Continue the timeline: ..." },
    ],
  },
  guide: { title: "Country Name", body: "How seats are won and who can govern with whom." },  // native guide, optional
});
```

Field notes:

- **Cover.** A real photograph from Wikimedia Commons under a free licence (CC0, public domain,
  CC BY, CC BY-SA). Fetch a 1280 px rendition, re-encode to at most 1000 px wide at JPEG
  quality 82 (`convert src.jpg -resize '1000x>' -strip -quality 82 country-xx.jpg`), and add an
  `ATTRIBUTION.json` entry with `file`, `commons`, `license`, `artist`, `note` and `sourceUrl`
  (copy the New Zealand entry). The completeness test refuses a country without one.
- **Daily pair.** Two big rivals that are playable in every one of the country's elections.
  Role ids are shared across countries for display names (`lab` is "Labour" in both the UK and
  New Zealand); if your id is already used with a different name, choose another id.
- **Playable parties.** A party is only offered in an election where it appears in that
  election's `v` or `s` tables, so one bundle can host elections with different party systems.
- **Player copy.** No em dashes or en dashes anywhere (labels use "2025 · A v. B"). Plain,
  specific sentences. No hype.

## 3. Getting the results data right

Every number must be real and internally consistent. The completeness suite enforces the
arithmetic; accuracy is on you.

- **`v` (vote share per region).** Real party vote shares, summing to about 1 (within 0.02).
  Fold minor parties into `oth`. Aggregate from official results by the smallest published unit
  (district, electorate, riding) into your regions, weighting each unit by votes cast.
- **`s` (seats per region).** Real seats, summing across regions to the election's chamber
  (`majority.total`). Each election's `s` tables define that election's region pools, so
  elections with different apportionments live in one bundle.
  - First past the post or preferential: the real seat winners in each region.
  - Proportional or mixed systems: there are no regional seat counts for list seats. Split the
    real national seat totals across regions in proportion to each party's regional votes
    (biproportional apportionment: rows sum to the region pools, columns to the national
    seats). Keep real electorate winners where they matter (New Zealand's Māori electorates).
    Germany and New Zealand document their method in their file headers.
- **Calibration.** With seat elasticity and these tables, neutral play reproduces each
  election's real seats within 2 per party. The completeness suite checks this for you.
- **Seat elasticity.** 1.0 for proportional representation. About 2.6 (the engine default) for
  first past the post; tune per region with `seatElasticity` only if the gauntlet shows a need.
- **Regions.** Aim for 7 to 12. Merge small administrative units, split one that dominates (New
  Zealand splits Auckland in three). Every region needs a map shape (section 4) and a unique
  tile.
- **Leaders, issues, blocs, events.** Real leaders per election, the campaign's real issues,
  voter blocs that explain the regional differences, and the campaign's real story beats in
  order, with scheduled `turn`s from 0 to 5.

## 4. Map paths

Maps are generated by `scripts/build_country_paths.cjs` from public GeoJSON (Natural Earth admin
level 1 is the usual source), with an equirectangular projection corrected by `cos(lat0)`,
Douglas-Peucker simplification, a 560 px wide viewBox, and paths that use only `M`, `L` and `Z`
(the native apps parse exactly those). Do not hand-edit generated files.

1. Download the source into a scratch directory, for example
   `curl -sSL -o /tmp/geo/ne10_admin1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson`
   (the 50 m file covers only a few countries; the 10 m file covers all of them).
2. Add a section for your country to the script, modelled on the `NZ` section: list the
   regions in `order`, group source features with `groupRegions` (shared borders are merged),
   split an oversized unit with `clipPolygons` and straight cut lines, set a `clip` box to drop
   far-flung islands, and add an `assertCountry` line with the expected ids and aspect range.
   Add your `[built, "xx.ts"]` pair to `files`.
3. Build only your country, leaving the others untouched:
   `node scripts/build_country_paths.cjs /tmp/geo --only=XX`
4. Look at it. Render the shapes to a PNG (for example write the paths into an SVG and run
   `rsvg-convert`) and check that every region is recognisable and labelled sensibly.

A region that is not a place (New Zealand's Māori electorates) can be drawn as an inset box in
empty sea; say so in the generated file's note.

## 5. Country rules

All country rules are data so that the web and Kotlin engines read the same thing. Functions in
a bundle are rejected by the native exporter.

- **`coalitions`** decides which pairs may govern together:
  - `none: true`: no coalitions at all (a runoff has one winner).
  - `isolated: [...]`: parties that partner nobody.
  - `forbidden: [[a, b], ...]`: pairs that never partner, in either order.
  - `onlyWith: { party: [...] }`: a party that may partner only the listed parties.
  - Absent: every pair is compatible.
- **`governmentText`**: one template per government kind (`majority`, `minority`,
  `coalition`, `confidence_supply`, `hung`). Placeholders: `{party}`, `{seats}`, `{parties}`
  (joined with " and "), `{lead}`, `{partner}`, `{largest}`. Each kind fills only its own keys:
  `majority` and `minority` take `{party}` and `{seats}`, `coalition` takes `{parties}` and
  `{seats}`, `confidence_supply` takes `{lead}`, `{partner}` and `{seats}`, `hung` takes
  `{largest}`. Missing kinds use the default text.
- **`runoff: true`**: presidential two-round framing (France): national broadcasts by default,
  "wins the presidency", runoff vote movement.
- **`plurality: true`**: single-round plurality (Mexico's presidency). The party with the most
  units wins outright: no threshold, no coalition step, never hung. Use it with
  `coalitions: { none: true }`, no `abstaining` parties and no `runoff`. Both engines read it
  through `majorityFor`, which adds `plurality: true` to the majority rule:
  - **Winner.** Most units. A tie on units goes to the higher national vote share; an exact tie
    on units and votes goes to the party that comes first in the result order (the order of
    the region tables). The government is always kind `majority`, so write a
    `governmentText.majority` template such as `"{party} wins the presidency with {seats} points."`.
  - **Score.** The unit margin is the lead over the strongest rival (+6 for first by six, -6 for
    second by six), not units minus the threshold. The server validates with the same rule.
  - **Screens.** The desk bar marks the lead needed ("to lead") instead of "51 to win", the
    results say "Wins presidency" with a "MOST VOTES WINS" line, and election night projects the
    winner once its lead beats every rival plus all units still out.
  - **`majority`.** Still required. Set `threshold` to the strict majority of `total` for
    reference; nothing uses it to decide the winner, and the completeness suite does not apply
    the strict-majority rule to plurality countries. Instead it checks that the real winner
    (most units in the tables) is unique, wins outright under neutral play and also leads the
    national vote, and that no goal or result copy mentions a majority.
  - **Results data.** Points follow votes. Split the 100 points nationally by valid votes first,
    then across regions (biproportional, as for proportional systems) so the national points
    order matches the real vote even in a near tie.
- **`goalHint`**: the native campaign coach's goal line, with `{majority}` and `{total}`.
- **Ids are free-form.** Party, bloc and region ids are plain lowercase strings. A new country
  can bring bloc ids no other country uses (New Zealand has `maori` and `pasifika`), parties that
  stand in only some of its elections, and parties with votes but no seats. Neither engine keeps
  a fixed list of them.
- **Event headlines** may contain `{party}` once. Only the first occurrence is filled.

## 6. Rating difficulty

Difficulty is measured, not guessed. It comes from the balance gauntlet's win rate for a focused
bot playing the historical underdog on normal difficulty (easy at 45% or more, medium at 20% or
more, otherwise hard; `GAUNTLET_THRESHOLDS` in `src/engine/balance/harness.ts`):

```
GAUNTLET_COUNTRIES=XX WRITE_REGISTRY=1 npx tsx scripts/balance-report.ts
```

This plays every playable party on every difficulty with three bots and 20 seeds per cell,
writes `docs/balance/report-<date>-xx.md`, merges your rows into
`docs/balance/suggested-labels.json` (other countries are untouched), and with `WRITE_REGISTRY=1`
patches the `difficulty` of any mismatched row in your module. Commit the report and the labels
file. The report also flags elections that are unwinnable on easy, a pushover on hard, or that
drift from history under passive play; fix the content if it flags yours. New Zealand took about
four minutes.

## 7. Regenerating native content and vectors

The native apps read exported JSON; nothing native is edited by hand. From the repository root:

```
npm run native:content
npx tsx apps/native/scripts/export-plan-vectors.ts
npx tsx apps/native/scripts/export-campaign-vectors.ts
npx tsx apps/native/scripts/export-save-vector.ts
npx tsx apps/native/scripts/export-debate-vectors.ts
npx tsx apps/native/scripts/export-replay-vectors.ts
npx tsx apps/native/scripts/export-ask-vectors.ts
npx tsx apps/native/scripts/export-reveal-vectors.ts
npx tsx apps/native/scripts/export-daily-percentiles.ts
npx tsx apps/native/scripts/export-editor-vectors.ts
npx tsx apps/native/scripts/export-plurality-vectors.ts
```

`native:content` writes `countries/<code>.json`, adds the map to `maps.json`, and adds the
country, its pack, daily pair and guide entry to `catalog.json`. The vector scripts pick up every
registered country automatically. Commit everything they change under
`apps/native/shared/src/commonMain/resources/bundles/` and
`apps/native/shared/src/commonTest/`.

If a rebase conflicts in any of those generated files, do not merge them by hand: take either
side, finish the rebase, rerun the commands above and commit the result.

## 8. Checks that must pass

Fast loop while authoring:

```
npx vitest run src/content/__tests__/country-completeness.test.ts src/content/__tests__/catalog-pins.test.ts
```

Before pushing (this is the CI `web` job in `.github/workflows/native.yml`):

```
npm test
npm run build
npx tsc --project tsconfig.server.json
npm run native:content -- --check
npx tsx apps/native/scripts/export-plan-vectors.ts --check
npx tsx apps/native/scripts/export-campaign-vectors.ts --check
npx tsx apps/native/scripts/export-save-vector.ts --check
npx tsx apps/native/scripts/export-debate-vectors.ts --check
npx tsx apps/native/scripts/export-replay-vectors.ts --check
npx tsx apps/native/scripts/export-ask-vectors.ts --check
npx tsx apps/native/scripts/export-reveal-vectors.ts --check
npx tsx apps/native/scripts/export-daily-percentiles.ts --check
npx tsx apps/native/scripts/export-editor-vectors.ts --check
npx tsx apps/native/scripts/export-plurality-vectors.ts --check
```

Native: `./gradlew :shared:jvmTest` (from `apps/native`, through the shared check queue on the
build host) runs the Kotlin calibration, every-election playthrough, daily parity and vector
tests against your new country without any Kotlin changes. `CountryRobustnessTest` also replays
every country with a party removed from one election, a seatless party, a region a party does not
contest and an extra voter bloc.

## 9. Invariant checklist

The completeness suite (`src/content/__tests__/country-completeness.test.ts`) checks every
registered country and election for:

- unique, well-formed country code and pack id; the bundle id equals the module code;
- plain copy: no em or en dashes in labels, descriptions, blurbs, pack copy, guide text,
  taglines or event headlines;
- a cover photo that exists and has an attribution entry; valid scenario art colours;
- a daily pair of two different parties, playable in every election, with display names that do
  not clash with another country's use of the same role id;
- exactly one registry row per election, each with a label (`2025 · ...`), year, difficulty,
  description, and its paid rows in the country's pack (and the Complete Collection);
- a play-next link from every election to a real election in the same country;
- every party, bloc, issue and region referenced anywhere exists (results, leaders, events,
  coalition rules, profiles, salience, campaign power);
- government text and goal hint placeholders are ones the engines fill for that kind, and no
  event headline uses `{party}` twice;
- every region has a map shape (M/L/Z only) and a unique tile; no stray shapes;
- per election: region seats sum to the chamber, the threshold is a strict majority (not
  checked for `plurality` countries), vote shares sum to about 1, no party wins seats with no
  votes, every region has results;
- plurality countries: no runoff, no coalitions, no abstaining parties, no effective threshold,
  a `governmentText.majority` template, no majority wording in goal or result copy, and under
  neutral play the real winner wins outright and leads the national vote;
- per election: salience, at least five story beats with a scheduled one, unique event ids,
  leaders for every playable party;
- neutral play reproduces the real seats within 2 per party;
- every playable party, on easy, normal and hard, plays to a result without throwing.

The pins test (`src/content/__tests__/catalog-pins.test.ts`) fails if a shipped scenario id,
pack id, pack membership or registry position changes.

The suite cannot check accuracy. Before you finish, check every number against the official
results and keep a note of your sources in the file header.

## 10. Adding an election to an existing country

1. Add the election to the bundle's `elections` (results, salience, events, and `majority` plus
   `goalText` if the chamber differs from `system.majority`), and its leaders to `leaders`. If it
   is now the newest election, update `system.majority` and `goalText` to it and give the older
   elections their own `majority` if they lack one.
2. Add new parties to `system.parties` (and `playable` if they can be led). Existing party ids
   never change.
3. Add a row to the module's `scenarios` in date order (newest first). The new scenario id is
   `<code>-<electionId>`; never change an existing row's id.
4. Add the election to `next.chain` in chronological position.
5. Rerun the completeness suite, the gauntlet for that country
   (`GAUNTLET_COUNTRIES=XX WRITE_REGISTRY=1 ...`), and the native regeneration in section 7.
6. Packs update themselves: the country pack and the Complete Collection include the new
   election. The retired Global pack does **not**: it is frozen at its original fourteen Canada,
   Germany, France and Australia elections, so Global owners need the country pack or Complete
   for anything added later. That is deliberate.
7. If the election is on the US or UK engine, its content goes where those engines keep it
   (`src/content/scenarios.ts`, `src/content/uk/`), and its registry row goes in
   `src/content/countries/us.ts` or `uk.ts`.

## 11. Rules that protect players

- **Never reorder or remove `COUNTRY_MODULES` entries or registry rows.** The daily challenge
  depends on the registry order: the first 49 rows are its frozen classic pool, and scenarios
  added later win a share of days through a second hash. Appending is safe: existing days keep
  their election unless a newcomer takes them.
- **Never change a shipped scenario id, pack id or party id.** Saves, purchases and leaderboard
  rows depend on them.
- **Prices and checkout belong to the platform.** Pack membership is the game's (derived from your
  module), but the price shown and the checkout come from the Lakeside accounts catalog, and the
  apps sell through App Store and Play products. A new pack needs those products created before
  it can be bought. Raise that with the lead; it is not done from this repository.
- **Generated files are regenerated, never hand-edited**: map paths, native bundles, vectors.
- **No per-country code** in the engines, the server, Kotlin, Swift or Compose. If a country
  seems to need some, express it as data in the bundle and teach both engines to read it, with
  tests on both sides proving they agree.
