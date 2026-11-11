# Changelog

All notable changes to Margin of Victory are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The game has stayed at version 0.1.0 since it began, so the history below is grouped by month.
Once releases carry their own version numbers, each release gets its own heading.

Every pull request that changes the game, the apps, content or tooling adds its entry under
**Unreleased** in the same pull request. A release moves those entries under a new heading.

## [Unreleased]

### Added

- Brazil: six presidential runoffs, 2002, 2006, 2010, 2014, 2018 and 2022, as a $0.99 pack (also in
  the Complete Collection). Lead the PT or its opponent across twelve regions, from São Paulo and
  Minas Gerais on their own to the Northeast and the Amazon, with each campaign's real story
  beats, from Lula's first win and the mensalão to the stabbing in Juiz de Fora and the 2022
  photo finish. The first round is already counted, so the voters of Marina Silva, Ciro Gomes
  and Simone Tebet are part of the opening map.
- Spain: the 2011, 2015, April 2019 and 2023 Congress of Deputies elections under proportional
  representation by province, as a $0.99 pack (also in the Complete Collection). Lead the PP,
  the PSOE, Podemos or Sumar, United Left, Citizens, Vox or UPyD across 14 regions, from the
  Basque Country to the Canary Islands, with real results in every region. The Catalan, Basque,
  Galician and Canarian parties win seats of their own and decide close results. Each campaign
  has its real story beats, from the crash election and the end of two-party Spain to Vox's
  breakthrough and the summer 2023 deadlock, and a government needs 176 seats at the investiture.
- New Zealand: the 2017, 2020 and 2023 general elections under mixed-member proportional
  representation, as a $0.99 pack (also in the Complete Collection). Lead Labour, National, the
  Greens, ACT, NZ First or Te Pāti Māori across nine regions and the seven Māori electorates,
  with each campaign's real story beats, from Jacindamania and the COVID election to Winston
  Peters back as kingmaker.
- India: the 2009, 2014, 2019 and 2024 Lok Sabha elections under first past the post, as a $0.99
  pack (also in the Complete Collection). Lead the BJP-led NDA, the Congress-led UPA (the INDIA
  bloc in 2024), Trinamool, the Left, the Samajwadi Party, the BSP, the BJD, the YSRCP, the AIADMK
  or the AAP across fifteen regions that keep every state's real seat total. Each campaign has
  its real beats, from the nuclear deal and the farm loan waiver to Pulwama and Balakot, NYAY and
  the 2024 result that left the BJP needing its allies, and the results are built from
  constituency counts.
- Ireland: the 2011, 2016, 2020 and 2024 Dáil elections under the single transferable vote, as a
  $0.99 pack (also in the Complete Collection). Lead Fianna Fáil, Fine Gael, Sinn Féin, Labour,
  the Greens, the Social Democrats, PBP-Solidarity or Aontú across ten regions, with real first
  preference results by region, a large independent block you can court but not lead, and each
  campaign's real story beats, from the Troika landslide and the water charge election to Sinn
  Féin's surge and the 2024 giveaway budget. Fianna Fáil and Fine Gael can govern together;
  neither will take Sinn Féin.
- Japan: six House of Representatives elections, 2009, 2012, 2014, 2017, 2021 and 2024, as a
  $0.99 pack (also in the Complete Collection). Lead the LDP, the Democrats (DPJ and later the
  CDP), Komeito, Ishin, the Communists, Your Party, Hope, the DPP, Reiwa and others across the
  eleven regional blocks. Parallel voting means a party keeps the districts it wins, so every
  region combines its single-member seats with its list seats. Each campaign has its real story
  beats, from the 2009 change of government and Abe's return to the Hope split and the 2024
  slush fund election.
- A Store screen. It opens from the landing page, the account menu, the setup and results
  screens, and every locked election. It leads with the Complete Collection and says exactly
  what it contains and, if you already own some packs, which ones it would add. Every country
  has a tile with its photo, election count, years, voting system and price, and a page that
  lists its elections with difficulty and tags so you can jump straight into one. The free base
  game shows as yours, and packs you already have (through the Complete Collection, the old
  Global pack or a Supporter membership) show as owned with the reason and never show a price.
- Buying keeps your place. Buy takes you through Lakeside sign in if needed and Lakeside
  checkout, brings you back to the Store, and names what you unlocked with a button to play it.
  If the payment is slow to show up the Store says so calmly and has a Refresh button. A
  cancelled checkout says nothing was charged. If the Lakeside store cannot be reached you can
  still browse and Buy is paused with a reason. A pack that is in the game but not on sale yet
  says Coming soon.
- Your account now lists what you own and how you got it (purchase, code, Supporter membership
  or the old Global pack), with a Refresh button next to your purchase history. Code
  redemption stays in your account and in the Store.
- Desktop: checkout and account linking open in your browser, and the game window stays where
  it is. The Store picks your purchase up as soon as you come back to the window.

### Changed

- Countries are now self-contained add-ons inside the game. Each country carries its own
  elections, store pack, daily challenge sides and "play next" links, and the web game, the
  iPhone app and the Android app all list countries and packs from that one source. Nothing
  changes for players: every election, pack, save and leaderboard entry keeps its id.
- The Complete Collection automatically includes every paid election of every country, including
  countries added later. The retired Global pack keeps exactly the fourteen Canada, Germany,
  France and Australia elections it always had.
- The daily challenge now includes newly added countries on a fair share of days. Every day that
  was already assigned to one of the original elections keeps it, and past leaderboards keep
  showing the election that was played that day.
- The web and desktop game has one consistent look: a shared set of colors, type sizes,
  spacing, buttons, cards, tabs, tables and modals on every screen, with numbers in aligned
  figures instead of a typewriter font.
- The campaign desk works the same way in the US, UK and every other country: race and week
  on the left, the live seat or electoral vote bar, your resources, and Undo and End Week
  always in view. On phones Undo and End Week sit in a bar at the bottom of the screen.
- The map fills the desk and stays fully on screen. Map tiles and regions can be selected with
  the keyboard.
- The election library groups every election by country, with search, a country rail, and
  filters for owned or locked, difficulty and era. It grows with new countries on its own.
- Setup screens list elections as compact tiles with difficulty and lock state, and parties
  as cards with their colors.
- Results show the verdict, map and standings beside your next election, score and
  post-mortem on wide screens. Election night uses larger maps.
- Modals close from the same button everywhere and open as bottom sheets on phones.
- The Unlock prompt on a locked election is now the Store, opened on the right pack with the
  Complete Collection beside it. The Redeem option in the menu now opens a code-only dialog.
- Account and menu text no longer quotes prices; the Store shows the current ones.

### Fixed

- Parties with very dark colors, such as the CDU/CSU in Germany, are now readable on maps,
  seat bars, standings and setup cards.
- Small text and party-colored names now meet contrast guidelines on the dark panels.
- Desktop apps now reach the game's servers (they were calling their own address).
- Purchases made on another Lakeside app no longer stop the Store from loading what you own
  when that app sells a pack this version does not have yet.
- A pack the web store cannot sell yet shows as "Coming soon" instead of a Buy button.
- "Play next" after a result now runs through every election of the country in order, so it no
  longer skips Canada 2015 and 2019, Germany 2017, Australia 2019 or the US elections before 2000.

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
