# Changelog

All notable changes to Margin of Victory are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Version 2.0.0 is the first numbered release. Until then the game stayed at version 0.1.0, so the
history before it is grouped by month. Each release from here on gets its own heading.

Every pull request that changes the game, the apps, content or tooling adds its entry under
**Unreleased** in the same pull request. A release moves those entries under a new heading.

## [Unreleased]

### Added

- Opening Margin of Victory from the Lakeside launcher can sign you in with the launcher's
  Lakeside account, so your packs and cloud saves are there without logging in again. The game
  finds your account by your Lakeside account, never by name. If you have never played with that
  Lakeside account, a new game account is made for it, and it needs no email address. If you are
  already logged in to a game account that is not linked yet, the launcher sign in links that one
  instead.
- The desktop app signs you in the same way when the Lakeside launcher starts it.
- After you pay in your browser, the Windows desktop app checks for the purchase the moment you
  come back to its window (taskbar, Alt+Tab or a click) and unlocks the pack within about a
  second. "I've paid, check now" and the timed check still work as before.
- You can delete your account on the web and desktop: select your username, then Your account,
  then Delete account, and type your username to confirm. It removes the game account with its
  cloud saves, scores and achievements, and signs you out. Packs you bought stay with your Lakeside
  Games account.
- Android: Account now has Delete account, like iPhone. It permanently removes your Margin of
  Victory account with its cloud saves, scores and achievements, after you confirm.

### Changed

- The privacy policy is rewritten for 2.0. It now covers purchases in every version of the game,
  the Lakeside account, cloud saves, daily scores, Ask and deleting your account, and states that
  the game uses no analytics and that error reporting is switched off. It also drops claims that
  were out of date.
- A small Lakeside Games mark at the left of the top bar links to lakesidegames.net, on the web
  and in the desktop app. In a campaign it sits at the start of the tools row on wide screens
  only, so it never sits among the game controls on phones.
- The footer links to the Lakeside store, your Lakeside account, the other Lakeside games and
  Lakeside support.
- The Store says who sells the packs: "Sold by Lakeside Games. Payments by Stripe. Refunds within
  14 days, no questions asked." It links to the full Lakeside store page for Margin of Victory.
- When Lakeside makes everything free for a while, the Store says "Everything is free to play
  while A House Divided is paused", shows every pack as open, and shows no prices or Buy buttons.
- Margin of Victory has a new web address: lakesidegames.net/games/margin-of-victory. The old
  /games/electioneer address keeps working and sends you to the new one. Saves, sign-in and
  purchases carry over.
- The Store looks like the Lakeside store: the same navy and orange, the same typeface and plain
  buttons. Pack names, descriptions and prices come live from the Lakeside store.
- Every Lakeside supporter tier includes every Margin of Victory pack and the Complete Collection.
  The Store and your account say "Included with any Lakeside supporter tier", the iPhone and
  Android apps show every pack as owned, and nothing offers a supporter a pack to buy.

### Fixed

- After a loss with a locked next election, the results screen now offers the same country's other
  free election first (United States 2020 after United States 2024) instead of a free election in
  another country, and names it with its year once: "2020 · Biden v. Trump", not "2020 2020".
- Campaign money below zero reads "-$8.1M" instead of "$-8.1M", on the web, in the desktop app,
  on iPhone and on Android, in every currency.
- Prices on the web and in the desktop app now come only from the Lakeside store, live. If the
  store is slow or cannot be reached, the game says "Price unavailable, try again" with a Try again
  button and Buy stays off, instead of showing a price it remembered. The landing page, the Store,
  the pricing card and the FAQ all follow this rule.
- Counts of elections, free elections and countries now read the same everywhere: 15 free
  elections, at least one in every country (two in the United States). The election library's
  "playable" count no longer includes today's Daily Challenge, which is open to everyone for one
  day only, so a country no longer shows one more playable election than it has free or owned.
- The iPhone setup screen now says at least one election in every country is free, instead of
  one.
- On iPhone, iPad and Android, "Continue with Apple" on the Lakeside sign-in page now opens Apple's
  sign-in instead of saying the page cannot be opened.
- After a test purchase on iPhone or Android, the Store says the pack is unlocked in the app
  instead of "Production ownership is unchanged".
- iPhone and Android: choosing Google on the sign-in page now stops with one line instead of a
  Google error page, because Google does not allow its sign-in inside an app. Sign in on the web at
  lakesidegames.net, or use Apple, Discord or A House Divided in the app. The same applies inside
  Ask.
- When the next election after your campaign is part of a pack you do not own, the results screen
  now also offers the next country's free election, so there is always something to play next
  without buying.
- The results report and the campaign timeline show United Kingdom and other countries' campaign
  cash in millions and in the country's currency ("£12.0M", not "£12" or "$12").
- In Brazil and France the desk's projected outcome says "Too close to call" when no one is past
  the winning line, instead of "Minority government" or "No majority".
- The United States setup screen no longer says "Locked years are part of the United States
  pack" when you own every year, and years you buy while the screen is open unlock straight away.
- The iPhone Store now describes the Complete Collection the way Android and the web do: every
  election in the game, with how many are already free, instead of only the paid ones.
- iPhone and Android keep everything you own when the Lakeside account holds a pack your version
  of the app does not know yet, such as a country added in a later update. The unknown pack is
  ignored until you update.
- Android now has a launcher icon.

## [2.0.0] - 2026-11-12

Margin of Victory 2.0 grows the game from six countries to fourteen, with 121 elections in all. It
adds New Zealand, India, Japan, Brazil, Ireland, Spain, Italy and Mexico, takes Canada, Australia,
Germany and France back to the 1980s and 1990s, and takes the United States back to 1932. Every
country now has one free election, and the new Store sells each country as a $0.99 pack or
everything as the $3.99 Complete Collection. Difficulty works the same way in every country, every
election has its own issues and its events happen in the weeks they really happened, and the web,
desktop, iPhone and Android versions all have a new interface.

### New countries and elections

- New Zealand: the 2017, 2020 and 2023 general elections under mixed-member proportional
  representation. Lead Labour, National, the Greens, ACT, NZ First or Te Pāti Māori across nine
  regions and the seven Māori electorates, from Jacindamania and the COVID election to Winston
  Peters back as kingmaker.
- India: the 2009, 2014, 2019 and 2024 Lok Sabha elections under first past the post. Lead the
  BJP-led NDA, the Congress-led UPA (the INDIA bloc in 2024), Trinamool, the Left, the Samajwadi
  Party, the BSP, the BJD, the YSRCP, the AIADMK or the AAP across fifteen regions that keep every
  state's real seat total, from the nuclear deal and Pulwama and Balakot to the 2024 result that
  left the BJP needing its allies.
- Japan: seven House of Representatives elections, 2009, 2012, 2014, 2017, 2021, 2024 and the
  February 2026 snap election, under parallel voting. Lead the LDP, the Democrats (DPJ and later
  the CDP), Komeito, Ishin, the Communists, Your Party, Hope, the DPP, Reiwa, Sanseito and others,
  and in 2026 the Centrist Reform Alliance, across eleven regional blocks that combine single-member
  and list seats. The stories run from the 2009 change of government and Abe's return to the Hope
  split, the 2024 slush fund election and Takaichi against Noda in the shortest campaign since the
  war. On 2026 days the daily challenge pairs the LDP with the CRA.
- Brazil: six presidential runoffs, 2002, 2006, 2010, 2014, 2018 and 2022. Lead the PT or its
  opponent across twelve regions, from Lula's first win and the mensalão to the stabbing in Juiz
  de Fora and the 2022 photo finish. The first round is already counted, so the voters of Marina
  Silva, Ciro Gomes and Simone Tebet are part of the opening map.
- Ireland: the 2011, 2016, 2020 and 2024 Dáil elections under the single transferable vote. Lead
  Fianna Fáil, Fine Gael, Sinn Féin, Labour, the Greens, the Social Democrats, PBP-Solidarity or
  Aontú across ten regions, with real first preference results and a large independent block you
  can court but not lead. Fianna Fáil and Fine Gael can govern together; neither will take Sinn
  Féin.
- Spain: the 2011, 2015, April 2019 and 2023 Congress of Deputies elections under proportional
  representation by province. Lead the PP, the PSOE, Podemos or Sumar, United Left, Citizens, Vox
  or UPyD across 14 regions with real results in every region. The Catalan, Basque, Galician and
  Canarian parties win seats of their own and decide close results, and a government needs 176
  seats at the investiture.
- Italy: the 2008, 2013, 2018 and 2022 Chamber of Deputies elections. Lead the centre-right, the
  centre-left, Five Star, the centrists or the radical left across fifteen regions plus a pool for
  Italians abroad. The electoral law changes between elections and each one says so: the 2008 and
  2013 majority bonus, the 2018 Rosatellum with a third of seats in single-member districts, and
  the 2022 chamber cut from 630 to 400 seats. Results are built from every constituency.
- Mexico: the presidential elections of 2000, 2006, 2012, 2018 and 2024. Lead the PAN, the
  PRD/Morena left, the PRI or Movimiento Ciudadano across eleven regions, from Fox ending 71
  years of PRI rule and the 0.58 point race of 2006 to #YoSoy132 and Sheinbaum's landslide. Mexico
  elects its president in one round: the most votes win, with no share to reach, so the goal bar
  shows the lead you need and your margin is your lead over the runner-up. The same rule works in
  the apps.
- Every new campaign has its own real story beats, and the guide gains a Voting Systems tab that
  explains each of the game's ten systems once, with the countries that use it. The app guide
  gains entries for Canada, Australia, regional parties and free elections.
- Germany goes back to 1990: seven earlier Bundestag elections, 2013, 2009, 2005, 2002, 1998, 1994
  and 1990, each with its own chamber size, from 603 to 672 seats. Lead the FDP or the AfD in 2013
  with real votes and no seats, fight for the PDS's survival in 1994 and 2002, or take the first
  all-German election after unification, when the East and West had separate thresholds.
- France goes back to 1981: five earlier presidential runoffs, 2007, 2002, 1995, 1988 and 1981.
  Play Chirac against Jean-Marie Le Pen in 2002 after Jospin was eliminated in round one, Mitterrand's
  first win against Giscard, cohabitation in 1988, Chirac's third try in 1995 and Sarkozy against
  Royal in 2007. The first round is already counted.
- Canada goes back to 1984: the 2011, 2008, 2006, 2004, 2000, 1993, 1988 and 1984 elections. Lead
  the Progressive Conservatives or the merged Conservatives, the Liberals, the NDP, the Bloc or, in
  1993 and 2000, Reform and the Canadian Alliance, with each year's real chamber (282 to 308 seats)
  and provincial results, from the 1984 patronage row and the 1988 free trade debate to the Bloc and
  Reform breakthrough, the Harper minorities and the 2011 orange wave.
- Australia goes back to 1996: the 2016, 2013, 2010, 2007, 2004, 2001, 1998 and 1996 elections,
  with real state results in chambers of 148 and 150 seats. The stories run from "never, ever" a
  GST and the Tampa to WorkChoices, the 2010 hung parliament and the 2016 Mediscare.
- United States: seven elections from 1932 to 1956. Play Roosevelt's four campaigns against
  Hoover, Landon, Willkie and Dewey, Truman's whistle-stop upset with the Democrats split three
  ways, and Stevenson against Eisenhower twice, from the Bonus Army and Social Security to the
  Checkers speech and Suez. Each uses that year's Electoral College of 48 states and 531 votes,
  266 to win, and every United States election now uses its own Electoral College: the majority,
  the vote bar, election night, results, score, achievements and charts follow that year's total
  instead of always 270 of 538, and states that cast no electoral votes that year are left off the
  map.
- The daily challenge includes the new countries on a fair share of days. Every day that was
  already assigned keeps its election, and past leaderboards keep showing what was played.

### Free elections and the Store

- Every country now has a free election, playable without an account: the newest election of each
  country (France's 2022 runoff rather than the speculative 2027 one), plus the 2024 and 2020 United
  States races as before. That makes 15 free elections out of 121. A free election stays free when
  newer ones arrive, and the Store marks it as "Free" on each pack page. Nobody loses anything:
  owners of a pack or the retired Global pack keep every election they had.
- Each country is a $0.99 pack holding its other elections, and the Complete Collection ($3.99)
  includes every paid election of every country, including countries added later. The retired
  Global pack keeps exactly the fourteen Canada, Germany, France and Australia elections it always
  had, so owners need the country pack or the Complete Collection for the elections added in 2.0.
- A Store screen opens from the landing page, the account menu, the setup and results screens and
  every locked election. It leads with the Complete Collection, says what it contains and, if you
  own some packs, which ones it would add. Every country has a tile with its photo, election count,
  years, voting system and price, and a page that lists its elections with difficulty and tags. The
  free base game shows as yours, and packs you already have (through the Complete Collection, the
  old Global pack or a Supporter membership) show as owned with the reason and never show a price.
  The Unlock prompt on a locked election opens the Store on the right pack, and Redeem in the menu
  opens a code-only dialog.
- Buying keeps your place. Buy takes you through Lakeside sign in if needed and Lakeside checkout,
  brings you back to the Store, and names what you unlocked with a button to play it. If the
  payment is slow to show up the Store says so and has a Refresh button, and a cancelled checkout
  says nothing was charged. If the Lakeside store cannot be reached you can still browse and Buy is
  paused with a reason. A pack that is in the game but not on sale yet says Coming soon.
- Your account lists what you own and how you got it (purchase, code, Supporter membership or the
  old Global pack), with a Refresh button next to your purchase history. Account and menu text no
  longer quotes prices; the Store shows the current ones.
- Android locks paid elections you do not own, like iPhone and the web, but only once Google Play
  can sell that election's pack. A locked election shows a lock and Unlock in the library, the
  briefing and the United States setup, and Unlock opens its pack in the Store.
- iPhone follows the same rule: a paid election locks only once the App Store can sell that
  election's own pack, so a new country pack that is not on sale there yet stays playable. Free
  elections, the daily challenge and anything you own through your Lakeside account, Google Play,
  the App Store, the Complete Collection, the Global pack or the Supporter perk always open, and
  elections unlocked with a code open on iPhone even when the account is not linked to Lakeside.
- Desktop: checkout and account linking open in your browser and the game window stays where it
  is. The Store picks your purchase up as soon as you come back to the window.

### Gameplay and difficulty

- Difficulty means the same thing in every country. Normal gives you a stronger campaign than your
  rivals (your campaigning lands harder, plus one extra action and a little more money each week),
  so a well-run campaign can win a close election from either side while a historical landslide
  stays out of reach. Easy gives a head start sized to the race: almost nothing in a near-tie, a
  big lift in a landslide, always leaving the last stretch to you. Hard makes your campaigning land
  a little lighter, and outside the United States only your main rival campaigns harder, so smaller
  parties no longer split your rival's vote for you and make Hard easier than Normal. Every
  election's difficulty rating was measured again, and US 1996 (Clinton v. Dole) and the UK's
  October 1974 election move from hard to medium.
- Platform, Debate Prep and Issue Pivot reach the whole country for free, so repeating them all
  week was stronger than any other plan. The second one in a week now has half the effect, the
  third a quarter, and so on.
- Every election has its own issues, named the way people talked about them that year: the
  Depression and relief in 1932, the war in Europe in 1940, Korea and communism in 1952, the miners'
  strike in February 1974, the cost of unity in Germany in 1990, free trade in Canada in 1988, and
  so on through all 121 elections. The issue pickers, the salience panels, the Ask handoff and the
  apps all use the election's own list, and an ad, event or pivot cannot raise an issue the
  election did not have. Custom US races use the issues of the nearest earlier election, and
  Pandemic Mode adds a pandemic issue to any year. Saved campaigns keep loading.
- Regional parties play as regional parties: Canada's Bloc Québécois, India's state parties
  (Trinamool, the Samajwadi Party, the BJD, the YSRCP and the AIADMK) and Spain's Catalan and Basque
  parties (ERC, CiU and its successors Democràcia i Llibertat and Junts, the PNV, and Amaiur and EH
  Bildu, each with its real lead candidate) are playable in every election they stood in. The setup
  shows where they stand and why they cannot win a majority, the results score them against their
  real seat count, and generic campaign events no longer target them with headlines written for
  national parties. Two new Spanish story beats cover the Catalan lists of 2015 and the PNV's
  record before April 2019.
- Presidency points in France, Brazil and Mexico now follow the vote. Before, points barely moved
  until a region swung hard, so a candidate could win the runoff vote 53 to 47 and still lose on
  points. Points are now the national vote split, and the map shows each region's share.
- A rival's contrast broadcast or dossier against you was strengthened by your own difficulty
  bonus, and yours against them weakened by theirs. Attacks now use the attacker's setting.
- On Easy, a party that stands in only part of a country no longer appears on the ballot in
  regions where it never stood, and the Easy head start applies only where your party is running.
- A general campaign event, such as a gaffe, a newspaper endorsement or a debate win, now runs at
  most once a campaign in every country, so the same headline never comes round twice (a debate win
  could fire in week 1 and again in week 2). Decision events such as a debate invitation can still
  return, and Mexico's campaigns draw from four more generic events.
- "Play next" after a result runs through every election of the country in order, so it no longer
  skips Canada 2015 and 2019, Germany 2017, Australia 2019 or the United States elections before
  2000.

### Interface on web, desktop, iPhone and Android

- The web and desktop game has one consistent look: shared colors, type sizes, spacing, buttons,
  cards, tabs, tables and modals on every screen, with numbers in aligned figures instead of a
  typewriter font. Modals close from the same button everywhere and open as bottom sheets on
  phones.
- The campaign desk works the same way in the United States, the United Kingdom and every other
  country: race and week on the left, the live seat or electoral vote bar, your resources, and Undo
  and End Week always in view, pinned to the bottom of the screen on phones. The map fills the desk
  and stays fully on screen, and its tiles and regions can be selected with the keyboard.
- The election library groups every election by country, with search, a country rail, and filters
  for owned or locked, difficulty and era. It shows a one-line summary for every country. Setup
  screens list elections as compact tiles with difficulty and lock state, and parties as cards with
  their colors.
- Results show the verdict, map and standings beside your next election, score and post-mortem on
  wide screens. Election night uses larger maps.
- The web game's first page loads about three quarters less code: about 490 kB instead of 1.9 MB
  (160 kB instead of 590 kB compressed). Each country's maps, parties and campaign events load when
  you open one of its elections, so a New Zealand campaign downloads New Zealand's content and no
  other country's. Opening an election, resuming a save or starting the daily challenge shows a
  short loading spinner the first time.
- Country flags show as flags on Windows, in the desktop app and in every browser. The game carries
  a 4 KB flag font for its 14 countries; before, Windows drew two boxed letters (US, GB, DE).
- Geographic maps show every region's name at phone and desktop sizes. Small or crowded regions
  are labelled in the sea next to them (Prince Edward Island and Nova Scotia, Auckland, Kerala and
  Bengal, the three Dublin regions, central Japan, Veneto and Apulia, Espírito Santo and Rio, the
  centre of Mexico), a region's name is always placed before any neighbour's seat count, and
  labels stay inside the map. Japan's blocks and a few other regions use short labels ("Hok",
  "N Kan", "Kinki"); the full name is still on hover and in the region panel. Ireland's map draws
  Northern Ireland as neutral land outside the game, and Italy's Abroad box and New Zealand's Māori
  seats box have a dashed frame so they read as boxes standing for voters rather than places.
- Parties with very dark colors, such as the CDU/CSU in Germany, are readable on maps, seat bars,
  standings and setup cards, and small text meets contrast guidelines on the dark panels. Seat bars
  only print a party's name when it fits its slice, and the majority marker no longer cuts through
  party names.
- The results gauge says which way a seat or point margin goes ("37 behind", "12 short", "5 over"),
  "Why you lost" says "5.1 points behind" rather than "-5.1 points against", and the campaign
  timeline's closest contests read "behind by 3.2".
- iPhone and iPad: the campaign library lists all 14 countries and 121 elections by country, with
  search, Free and Owned filters, challenge and era filters, and a briefing for each election that
  says how it is won before you pick a side. Every party list, including India's nine sides and
  Spain's regional parties, fits on a small phone and with large text, and at large text sizes the
  United States campaign desk no longer cuts off your cash and the election name.
- iPhone and iPad: the store lists every pack from the catalog with the Complete Collection first,
  says what you own and why, marks each country's free elections, shows the App Store price when a
  pack is on sale and "Coming soon" when it is not, and keeps Restore purchases.
- iPhone and iPad: the rules read correctly for every election. Mexico says most points wins, the
  United States shows that year's electoral college on setup, the desk and results, states that
  cast no electoral votes have no tile, election night names the real candidates and parties, and
  a regional party is told where it stands and is measured against its real seat count. Setup
  describes the new difficulty ladder under the Easy, Normal and Hard picker, and the week planner
  lists that election's own issues, so a 1932 campaign argues over the Depression and never over
  COVID.
- Android: a full interface pass. The app uses the same colors, type sizes, spacing and party color
  rules as the web game, so dark party colors stay readable and every screen has one clear main
  action. The campaign desk shows a seat bar with the majority line, a standings table, a tappable
  map with a matching region list, and End week pinned to the bottom of the screen. Long party
  lists, such as India's ten playable sides, are picked from a full list instead of a dropdown.
- Android: the campaign library groups every country and its elections, with search and filters
  for free and owned elections, difficulty and era, and each election opens a briefing with the
  party picker, difficulty and seed. The Store lists every pack with the Complete Collection first,
  what you own and why, the Google Play price when a pack is on sale and "Coming soon" when it is
  not, with no Buy button for a pack you cannot buy yet. Results, election night, saved
  campaigns, leaderboards, settings and the account screen use the new layout, with numbers in
  aligned columns and larger touch targets.
- The button that leaves a campaign says "Home" in every country, and on phones the setup screen's
  back and start buttons no longer wrap awkwardly with long party names.

### Accuracy fixes

- Scheduled campaign events land in the week they really happened. Across all 14 countries, dozens
  of story beats moved to the right part of their campaign: the 1996 Hartford debate and Chico
  fall, the 2004 CBS memos, the 2012 and 2000 debates, the 2020 Trump diagnosis, the 1968 bombing
  halt, the 2016 Brexit vote in Australia, the 2019 Triells in Germany and the 2019 debates in
  Spain, among others. Events that belong to an earlier round or year were reworded or replaced:
  France 2012 no longer opens its runoff with the Toulouse killings, Germany 2017 no longer treats
  Gauland's election-night remark as a closing pitch, Mexico 2024 opens Gálvez's campaign where it
  began, and the 2024 US race places the July Butler shooting as the backdrop it was.
- Several headlines were corrected to match the record: New Zealand 2020's Green School apology was
  James Shaw's own, Australia 2025's Cyclone Alfred moved the election call rather than forcing a
  budget, the 2024 US tagline says sixty-four days to find 270, and Ireland 2024's Sinn Féin headline
  says the manifesto promised a review of RTÉ's news coverage, not an investigation.
- A history check across the new countries and the older Canada, Australia, Germany, France and US
  elections confirmed every national seat total and chamber size against published results. A few
  regional vote shares in Canada, Australia and the US were corrected, and France's 1981 and 1988
  runoff regions use the official results instead of modelled shares. Story beats that were
  misdated, misattributed or could not be sourced were corrected or replaced (the German Greens'
  1990 leaders, the 1993 Campbell line in Canada, the 1944 US campaign's Pearl Harbor wording), and
  unverifiable quotes were removed.
- 1960 has its real 537 electoral votes and 269 to win: the District of Columbia no longer votes
  (its first presidential election was 1964), and Maine and Nebraska carry their 1960 votes of 5 and
  6.
- COVID no longer turns up before 2020 and Germany's older elections no longer show issues from
  2025. Issue descriptions shared by every election of a country no longer describe only the
  newest one: Germany 1990 no longer mentions the war in Ukraine, the UK no longer offers "Brexit"
  in 1951, and Canada, Australia, France, Italy, Spain, Ireland and New Zealand read correctly in
  every year they cover.
- Store and landing copy matches every election in each pack: the United States pack says 24 races
  from 1932 to 2024, Canada says 282 to 343 seats and Australia 148 to 151. The landing page, FAQ,
  pricing and page description count countries, elections and voting systems from the game itself,
  so they no longer say "6 countries, 6 voting systems", and the FAQ quotes the current prices.
  Mexico's left is named "PRD/Morena left".
- The Complete Collection's page and card, on the web and on Android, count every election in the
  game and say how many are already free, instead of counting only the paid ones. Android's country
  packs also count their free election, as the web does.

### Fixed

- A custom race built on Canada, Germany or any other country in the campaign editor opens its
  campaign after Save and play. Before, the game showed that country's setup screen instead.
- Desktop apps reach the game's servers (they were calling their own address).
- Purchases made on another Lakeside app no longer stop the Store from loading what you own when
  that app sells a pack this version does not have yet.
- A pack the web store cannot sell yet shows as "Coming soon" instead of a Buy button.
- Store: the country pack tiles show their cover photo, flag and country name again (they had
  collapsed to text only). The free base game lists one election per cell, so the two free US
  elections no longer stretch a row, and on phones each free election is one line with its flag,
  difficulty and Play. The Complete Collection figures stay on one row on phones.
- Landing page: the opening paragraph no longer says "across 14 countries" twice, and the country
  bundle cards line up their prices and buttons.
- After a hung parliament the results headline is colored by the party it names, not by yours.
- The France-only "six planning weeks" note no longer shows on Brazil's setup screen.
- Every country appears in the library's country filter on wide screens instead of running off the
  edge.
- The results card's next-election map is visible for parties with dark colors, and the campaign
  summary shows each country's own currency.

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
