# Margin of Victory on the App Store

The iPhone and iPad app uses bundle ID `com.lakesidegames.electioneer` and Apple ID `6817094138`. Marketing version is `2.0`. Use the existing app record. The public release candidate starts with the iOS menus, week planner and election night work.

- [App Store Connect record](https://appstoreconnect.apple.com/apps/6817094138/distribution)
- [Last confirmed internal TestFlight upload at kickoff](https://github.com/lakesidegamedev/MOVGame/actions/runs/43515589098)
- [App Store Connect version requirements](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)
- [Apple screenshot sizes](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

## Listing draft

- **Name** Margin of Victory
- **Subtitle** Election Strategy Simulator
- **Primary category** Games, Strategy
- **Keywords** election,campaign,politics,strategy,history,vote,simulation,president,parliament,electoral
- **Marketing URL** https://lakesidegames.net/games/margin-of-victory/
- **Privacy policy URL** https://lakesidegames.net/games/margin-of-victory/?legal=privacy
- **Support URL** https://lakesidegames.net/services/#support

### Description

Run a campaign in a historical election. Pick a side, choose where to spend your time and money, and see how your decisions change the result.

Plan your week with rallies, advertising, fundraising, and field operations. Watch the map for races worth contesting, respond to campaign events, and adjust your strategy when the polls move.

Follow election night as results come in. In U.S. races, open county returns for a closer view of the simulated count. Compare your final result with history, or take on the daily challenge.

Play as a guest or sign in with a Lakeside account to sync saves and take part in leaderboards.

### Review notes draft

Margin of Victory is a single-player election strategy game. From Home, tap Browse elections, select a free election, choose a side, and start a campaign. Open the week planner to queue a move and end the week. Repeat through election night. County returns are available in U.S. campaigns. State totals are calculated by the game. County returns are modeled using 2025 U.S. Census geography and population.

Guest gameplay works without an account. Account, cloud saves, daily leaderboards and restoring purchases are under Menu. The Delete account control is on the account screen after sign-in. Provide the reviewer with working demo credentials in the private App Review fields and verify them on the signed candidate.

At kickoff on 2026-11-18 the public game catalog advertised 16 Apple SKU mappings and native locking was off. Check product status in App Store Connect and the live configuration again on the candidate. Explain the actual launch StoreKit and Lakeside free-access configuration here before review. If paid packs are available, list the submitted products and how to find and restore them. If a timed free-access window applies, provide its actual end date and verify the screen agrees.

## Candidate and device pass

1. Run the Native and web workflow with the iOS and App Store screenshot options for the candidate commit. Review the small iPhone, iPad and iOS 27 output. Select the iPhone Dynamic Island medium and 13-inch iPad screenshot sets from `ios-app-store-screenshots`.
2. After the reviewed commit is on `main`, run **iOS TestFlight and App Store** with its full SHA and select `app-store` distribution. In App Store Connect confirm the build number, processing status and eligibility for the public version. Install that exact build on an iPhone and iPad.
3. Run a fresh guest campaign and resume it after force-closing. Open Menu and its Saved campaigns, Lakeside account, and Settings destinations. At large text sizes, confirm buttons and any long labels remain usable. Verify touch and VoiceOver focus.
4. In the U.S. planner, fill day 1, add a different action on day 7, remove an action, and verify the queue after reopening the app. Repeat for a non-U.S. election and check that ending the final week opens election night.
5. On U.S. election night, check that the Eastern clock advances, an early state reports before the West Coast, pause and speed work, and Pennsylvania county returns update without leaving the sheet. Check that Show all clears the remaining tally and that full results match the desk total. Run a UK and a multiparty election as well.
6. In TestFlight, verify Apple sign-in, account deletion, cloud save and the production-like StoreKit path for the intended launch setup. Record the device, OS, build and evidence for each flow. Validate refunds and restore when paid packs are enabled.
7. Check the version draft, rating questionnaire, privacy disclosures, review contact, demo account and product status in App Store Connect. Use the privacy policy and the actual candidate's data flows for the responses. A release owner confirms territories, price and manual release timing before submission for review.

## Election data

The U.S. clock uses the latest statewide poll closures from the [2024 poll closing table](https://www.thegreenpapers.com/G24/closing.phtml?format=ec) as a template for all U.S. scenarios. The UK starts from [its 10 PM close](https://www.electoralcommission.org.uk/voting-and-elections/how-elections-work/how-votes-are-counted). Other countries currently use a simulated local clock.

County names and boundaries come from the [2025 U.S. Census cartographic boundary files](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.2025.html). The model uses [2025 U.S. Census population estimates](https://www.census.gov/data/datasets/time-series/demo/popest/2020s-counties-total.html) for weights. The two-party share for each simulated county is derived from its state result. Rebuild the bundled data with `scripts/export-ios-counties.py`.
