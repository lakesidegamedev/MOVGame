# Changelog

All notable changes to Margin of Victory are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The game has stayed at version 0.1.0 since it began, so the history below is grouped by month.
Once releases carry their own version numbers, each release gets its own heading.

Every pull request that changes the game, the apps, content or tooling adds its entry under
**Unreleased** in the same pull request. A release moves those entries under a new heading.

## [Unreleased]

No changes yet.

## 2026-10

### Added

- Release pricing: the base game (US 2024, US 2020 and the daily challenge) stays free, every
  other country is a $0.99 bundle (US historical, UK, Canada, Germany, France, Australia), and
  the Complete Collection is $3.99. The retired Global pack is no longer sold but still unlocks
  its elections for existing owners. Locked elections open an Unlock prompt with Buy and code
  redemption.
- Supporter+ and Supporter++ members receive the Complete Collection, labeled in the account
  view.
- iOS App Store readiness: a privacy manifest, account deletion from inside the app, a store
  screen that leads with bundles and offers Restore purchases.
- Packs bought on the web, iPhone or Android follow the same Lakeside account everywhere, and a
  refund removes the pack on every device.
- iPhone and Android: daily champions, dated daily boards, personal rankings, result sharing and
  a link to the next election that keeps your party, difficulty and event mode.
- iPhone and Android: settings, sound, hardware keyboard controls, campaign tutorials and
  scenario editors for every country.
- iPhone and Android: signed-in US campaigns sync autosaves and named saves to the cloud, with
  conflict handling that never overwrites newer work.
- Android: Ask opens inside the app with your current campaign, and every native campaign can
  be sent to Ask with the same context as the web.

### Changed

- iPhone interface pass across setup, the campaign library, leaderboards, saves, the tab bar,
  campaign charts, results, the store and the scenario editor: readable at large text sizes and
  on small phones, one clear main action per screen, saves show when they were last played,
  results explain why you won or lost before the state list, and election night has a map
  legend.

### Fixed

- The Ask sheet on iPhone recovers from a failed or blank page.
- Purchase history no longer keeps a stale answer after a rejected request.
- Cloud saves on iPhone and Android stay with the right account after switching accounts.

## 2026-09

### Added

- The game is now Margin of Victory (briefly Ballotline in August). Existing links, purchases
  and saves keep working.
- New product landing page with a Play free button, real campaign art and the full scope of the
  catalog.
- Campaign plan bonuses: four setup-and-payoff combos that reward planning your week in order.
  Previews and recaps show them.
- Native iPhone and Android apps built on a shared campaign engine that matches the web game,
  with all six countries, the seven-day action planner, scores, achievements, historical
  comparisons, the daily challenge, shared accounts, named saves, cloud saves, campaign replays,
  timeline reports, debate scorecards, undo and an election-night reveal with real seat counts.
- iPhone: a full electoral-vote tile map with a geographic toggle, a clearer week planner and a
  four-step setup with running mate and adviser effects spelled out.
- iPhone: Ask, the Lakeside question assistant, opens inside the app with your current
  campaign.
- Every election was free to play during the pre-release period.

### Changed

- France 2022: the National Rally side now has a winnable runoff campaign with a varied national
  plan, and setup explains the runoff clock and why national campaigning matters.
- Normal difficulty AI persuades a little less, so a scattered plan can still win sometimes
  while a focused one remains strongest.
- Campaign costs are reserved when you plan them, with available funds shown beside each
  planner.

### Fixed

- Campaigns now survive a refresh, going home and the browser back button in every country.
- Final electoral votes, popular vote, decisive margins and weekly recaps agree with each other.
- Results no longer credit the rival's actions to an idle player.
- Party names stay readable on dark setup cards on phones.
- Event decisions keep keyboard focus until you answer them.
- iPhone: the election picker no longer shows the wrong year's portrait or formats the year as
  "2,024", and the app includes all campaign content.
- Signing in could not be used to take over an account that only shared an email address.
- The game reaches its server correctly from every address it is served at.

## 2026-08

### Added

- Search the scenario catalog and filter campaigns.
- Margin of Victory is published under the PolyForm Noncommercial license.

### Changed

- Rebranded from Electioneer to Ballotline.

### Fixed

- Store links point to the live catalog.
- Scenarios that shared the same portrait now have their own art.

## 2026-07

### Added

- Canada, Germany, France and Australia join the US and UK, each with its own electoral system,
  real regional results and real-geography maps.
- The US historical pack grows to cover 1960 through 1996, and the UK pack covers 1951 and every
  election from 1964 through 2024. Canada 2021, Germany 2021, France 2017 and 2022, and
  Australia 2022 and 2025 join the global elections, along with five earlier elections across
  those countries.
- Every election has a named deck of real campaign events.
- Accounts, leaderboards that recheck every submitted score, achievements, campaign staff and
  endorsements.
- The Daily Challenge: one shared election and seed each day, a daily board, streaks and share
  text.
- Election Night: a broadcast-style results reveal with call waves, cliffhangers, upset markers
  and a skip button, followed by a results screen with seat math, coalitions and a swingometer.
- Campaign Editor: build custom candidates and scenarios for the US, UK and every other country,
  save them, and share them as files.
- A campaign timeline you can scrub during and after a game, and a "why you won or lost" report.
- Campaign length setting (Short, Standard, Long), with scheduled events scaled to match.
- Cross-device cloud saves for signed-in players.
- A first-launch tutorial, a settings panel, sound effects, keyboard shortcuts and loading
  screens.
- Covers from public-domain campaign art on the homepage and scenario pickers.
- Privacy policy and terms pages.
- Sign in with a Lakeside Games account, with packs and code redemption handled by the Lakeside
  store.

### Changed

- Named Electioneer.
- Pick a country first, then the election.
- The game became freemium: US 2024, US 2020 and the daily challenge free, the rest in packs.
- New look in the Lakeside Games style, and a calmer, more product-like landing page.
- Smarter AI that spends on persuasion first, targets by value and reaches for coalition
  partners in multiparty races. Underdogs get a better chance in UK and other country elections,
  so any year can be won.
- The UK parliament size follows the boundaries in force for each election.
- Player-facing text cleaned up for plain language.

### Fixed

- Phones no longer scroll sideways.
- Score checks use the correct parliament size for every election.

## 2026-06

### Added

- First playable campaign: the 2020 US presidential election, played week by week with a
  calibrated state-by-state vote model, polls, events and an AI opponent.
- More US elections: 2000, 2004, 2008, 2012, 2016 and 2024.
- UK general elections from 1979 through 2024, with multiparty seats, hung parliaments and
  coalition or confidence-and-supply governments.
- Selectable running mates, real candidate portraits and live demographics for each state.
- Historical events for each year, or a random mode with plausible events.
- A seven-day action planner, a live news ticker and a "Travel here" rally button.
- Debates scored head to head, with a winner and momentum swings.
- Difficulty that helps the player on Easy and Normal while Hard keeps the historical map.
- A campaign trends screen with polling and electoral votes by week and by state.
- An election-broadcast look, a three-step setup with a random seed, and a game guide.

### Changed

- Balance passes: contrast ads weakened, the AI stops flipping safe states, and opposition
  research is capped.

### Fixed

- Map and dashboard layout fixes on phones.
