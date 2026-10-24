# iOS UI/UX loop

Standing scorecard for the Margin of Victory iOS client (`apps/native/iosApp`).
One screen or flow per iteration, one PR per iteration, no score without a
rendered artifact.

- **Run owner:** Keir (agent). Merges are owner-only (`MERGE_MODE=owner`).
- **Iterations:** 8. **Focus:** all screens.
- **Canonical remote:** `lakesidegamedev/MOVGame`; `Egg3901/MOVGame` URLs
  redirect to it.
- **Started:** 2026-10-24, from `main` @ `db2b18c` ("feat(ios): App Store
  submission readiness (#79)").
- **Baseline artifacts:** run
  [37372831909](https://github.com/Egg3901/MOVGame/actions/runs/37372831909)
  (`native.yml`, `db2b18c`). Its `ios`, `ios-layouts` and `ios27` jobs are
  green; the run is marked failed only because the Android job was cancelled.
  Artifacts: `ios-simulator-launch` (32 app captures + `boot.png`) and
  `ios-layout-flows` (iPhone SE 3 / iPad, large text, 6 screens each). The most
  recent fully green run is
  [37095766263](https://github.com/Egg3901/MOVGame/actions/runs/37095766263)
  (`6d343dd4`); it reproduces the same leaderboard defect.

## Method and limits

- Reviewed every default-size capture and the 16 large-text small-phone/iPad
  captures in the two artifacts above, then read the SwiftUI source to locate
  each defect.
- Local Linux checks pass on the audit commit:
  `test-ios-screen-ready.py` (5 tests), `test-ios-simulator-control.py` (7
  tests), `verify-ios-metadata.py`, `py_compile` of both smoke scripts,
  `git diff --check`.
- This box has no Xcode, simulator or Swift toolchain. No VoiceOver, haptics,
  real-device or performance check was performed. Rendering evidence is CI
  only.
- Captures are single states, not flows: the smoke harness waits, screenshots
  once, and never scrolls. Anything described as "clipped" is what the PNG
  shows at rest; it may be reachable by scrolling.

## Screen inventory

32 app captures (the loop prompt describes 34; the script captures 32). `boot.png`
is the simulator home screen and is not an app screen.

| Capture | Screen / route | State in the capture | States that exist but are not captured |
| --- | --- | --- | --- |
| `launch` | Home (`HomeView`) | Fresh install, no saved campaign, daily unplayed | Continue campaign, daily played/streak |
| `setup` | Setup step 1/4 (`SetupView`) | 2024, no side chosen, Next disabled | Steps 2 ticket, 3 war room, 4 briefing; selected side |
| `setup-2016` | Setup step 1/4 | 2016 election | same |
| `library` | Campaign library (`NativeCampaignLibrary`) | US, 2024, signed out | World branch (party/difficulty/seed), locked pack paywall |
| `daily` | Daily challenge via library | France 2017 preset, daily seed | Already played today, streak |
| `campaign` | Campaign desk, map (`GameView`) | Week 1, map tab | Plan tab, event sheet, recap alert, tutorial coach |
| `plan` | Campaign desk, plan (`GameView` + `ActionPlannerView`) | Advertising defaults, 0 queued | Disabled add (cash/slots/day cap), queued cards |
| `results` | Results (`ResultsView`) | Campaign over, signed out | Daily score posting, signed-in rank, tied election |
| `reveal` | Election night (`NativeElectionNightView`) | Wave 6/6, still playing | Mid-playback, instant/reduce-motion |
| `analysis` | Campaign analysis (`CampaignAnalysisView`) | Week 1, one region | Empty replay, later weeks |
| `replay` | Replay + report (`CampaignAnalysisView(timeline:)`) | Week 3 | Finished campaign, empty |
| `saves` | Saved campaigns (`CampaignSavesView`) | Signed out, 1 named + 3 autosaves | Cloud list, conflict choice, delete/rename dialogs, import/export errors |
| `account` | Account and saves (`AccountView`) | Signed out | Register, busy, error, signed in, linked, delete confirmation |
| `store` | Store (`StoreView`) | Signed out, no products loaded | Loading, products, owned, purchase pending, restore |
| `settings` | Settings (`NativeSettingsView`) | Defaults | Reduce motion on, hotkeys off |
| `guide` | How to play (`CampaignGuideView`) | Top of guide | Scrolled sections |
| `editor` | Scenario editor (`NativeEditorView`) | Draft section | Library list, create/import, delete confirmation, iPad form sheet |
| `champions` | Leaderboards (`AccountBoardsView`) | Empty, signed out | Entries, error, daily board, loading |
| `lakeside-login` | Lakeside sign-in web sheet (`NativeLakesideLoginView`) | Auth page loaded | Success callback, failure notice |
| `world-uk` | World campaign (`NativeWorldCampaign`) | Week 1 UK | Plan, event, recap |
| `world-ca` | World campaign | Week 1 Canada | same |
| `world-de` | World campaign | Week 1 Germany | same |
| `world-fr` | World campaign | Week 1 France | same |
| `world-au` | World campaign | Week 1 Australia | same |
| `world-results` | World campaign | Germany over | Score posting, custom campaign |
| `ask` | Ask web sheet (`AskContentView`) | Ready, signed out | Answering, quota |
| `ask-de` | Ask with Germany snapshot | Generic Ask page | Campaign-grounded page |
| `ask-login` | Embedded Lakeside Accounts | Sign-in form | Success, error |
| `ask-offline` | Ask error | Offline | — |
| `ask-blank` | Ask error | Empty document | — |
| `ask-retry` | Ask recovery | Post-retry page | — |
| `ask-stalled` | Ask error | Stalled load | — |

## Scores

Overall 1–5 per screen on the rubric (clarity, hierarchy, legibility,
accessibility, states, consistency, small-phone/iPad fit, feedback, trust,
craft). "Weakest" names the dimension that holds the score down.

| Screen | Score | Weakest dimension | Why |
| --- | --- | --- | --- |
| `launch` | 4 | states | Strong hero and primary action; no signed-in/continue state shown in baseline |
| `setup` | 4 | legibility | Clear flow; disabled action is explicit and 9.2:1, and compact AX shows the election and both sides. One card hint still truncates. |
| `library` | 4 | small phone / iPad fit | Election label wraps cleanly and the CTA stays above the tab bar at every size; iPad still has a single full-width column |
| `daily` | 2 | trust | Raw internal seed `daily-2026-10-05` is editable on the launch screen; no daily-specific framing |
| `campaign` | 3 | clarity | Good desk card, but Undo is unstyled text and the map is cut by the tab bar |
| `plan` | 3 | hierarchy | Dense but logical; sticky CTA leaves a clipped sliver of a queued card |
| `results` | 3 | hierarchy | Outcome lands, but the long state list and achievements compete below the fold |
| `reveal` | 3 | hierarchy | Map is 240 pt with no labels; bars have no endpoint values |
| `analysis` | 2 | hierarchy | Duplicate title; 180 pt chart canvas for one data point, two charts fill the screen |
| `replay` | 2 | hierarchy | Same chart problem, plus duplicate title |
| `saves` | 3 | trust | Names, weeks and second-level timestamps distinguish the rows; actions are still text links |
| `account` | 3 | trust | Clear form, but the Lakeside sign-in opens another game's branded page |
| `store` | 2 | states | Empty page; "Sign in to buy" with no products or price state |
| `settings` | 3 | hierarchy | Readable Form; volume value sits below its slider, system green toggles |
| `guide` | 3 | consistency | Readable cards; duplicate "How to play" title and eyebrow |
| `editor` | 2 | hierarchy | Four same-weight blue text buttons; iPad sheet clips at the bottom |
| `champions` | 4 | layout | Full-width empty card and a loading row; the narrow centred strip is gone |
| `lakeside-login` | 1 | trust | Shows "A House Divided", "Welcome back" and PostHog cookie consent inside MOV |
| `world-uk` | 3 | consistency | Legible standings; map cut by the tab bar |
| `world-ca` | 3 | consistency | same |
| `world-de` | 3 | small phone / iPad fit | "1 seats" grammar; map cut; AX rows wrap and only one row fits |
| `world-fr` | 3 | consistency | same |
| `world-au` | 3 | consistency | same |
| `world-results` | 3 | hierarchy | Outcome card works; map cut and no colour legend |
| `ask` | 3 | consistency | Clean external page; white CTA and marketing tone break the in-app surface |
| `ask-de` | 2 | states | Shows the generic page, not the campaign-grounded state the capture name implies |
| `ask-login` | 2 | consistency | Light web sign-in inside a dark native sheet |
| `ask-offline` | 4 | — | Clear, specific error + retry |
| `ask-blank` | 4 | — | Clear, specific error + retry |
| `ask-retry` | 2 | polish | "Ask recovered" as unstyled top-left text on an empty page (recovery fixture) |
| `ask-stalled` | 4 | — | Clear, specific error + retry |

Baseline mean: **2.7** (31 distinct screens; `setup-2016` is a second state of `setup`). No screen is unusable at default size.

## Defects

### P0 — none

No unreadable/unreachable-at-default-size screen, crash, or unguarded
destructive action was found. Delete account and delete save both have
confirmations (`MiscViews.swift:163-168`, `NativeSaveViews.swift:166-173`).

### P1

1. **`lakeside-login` shows another game's identity.** The sign-in sheet opens
   `https://sim.ahousedividedgame.com/api/lakeside/login`, which renders "A
   House Divided", "Welcome back / Sign in to continue your political career"
   and a PostHog cookie banner. Evidence: `lakeside-login.png` in run
   37372831909. Source:
   `apps/native/shared/src/commonMain/kotlin/com/lakesidegames/electioneer/engine/NativeAccountProgress.kt:73-78`
   (`startUrl` and the AHD host allowlist). This is outside UI scope
   (`shared/**` is read-only); it needs an owner/backend decision before any
   client fix.
2. ~~**`champions` empty state collapses to a narrow column.**~~ **Closed in
   iteration 3.** The content stack expands to full width, the empty state is a
   card with a next step, and a loading row covers the nil table. Evidence:
   `champions.png`, `small-phone/champions.png` and `tablet/champions.png` in
   run 40078561917.
3. ~~**`saves` autosaves are indistinguishable.**~~ **Closed in iteration 4.**
   Each local and cloud row now shows its `updatedAt` to the second; the
   checkpoint and autosave names, weeks and times separate the rows. Evidence:
   `saves.png` in run 40084847111.
4. ~~**Tab bar labels clip at accessibility sizes.**~~ **Closed in iteration 5.**
   The label no longer has a fixed 17 pt height, the tab grows to 64 pt at
   accessibility sizes, and the label scales instead of truncating. Evidence:
   `small-phone/setup.png` and `small-phone/library.png` in run 40088823403.
5. ~~**`library` clips the election label at AX size.**~~ **Closed in iteration 2.**
   The election and party pickers are menu rows whose labels wrap; the launch
   action is a bottom inset above the tab bar. Evidence: `small-phone/library.png`
   in run 40075241534.
6. **`daily` exposes the raw seed.** The launch screen for the daily shows
   `daily-2026-10-05` in a bordered, editable-looking text field with no
   label, above "Launch campaign". Evidence: `daily.png`. Source:
   `NativeCampaignViews.swift:93`, `:137`.
7. ~~**`setup` disabled primary action is unreadable.**~~ **Closed in iteration 1.**
   The action now names its blocker and uses muted text on the card surface
   (9.2:1); coral returns when enabled. Evidence: `setup.png` in run
   40072128974.
8. ~~**`setup` collapses at AX/SE.**~~ **Closed in iteration 1.** On compact
   width at accessibility sizes the page title and four-step indicator are
   replaced by a compact "STEP 1 OF 4 · ELECTION" line; the election name and
   both side cards are visible without scrolling. Evidence:
   `small-phone/setup.png` in run 40072128974.

### P2

1. **Duplicate titles.** Sheet navigation title plus an in-content title on
   analysis (`NativeAnalysisViews.swift:14`), replay (same), saves
   (`NativeSaveViews.swift:95`), leaderboards
   (`NativeResultJourneyViews.swift:50`) and guide (`ContentView.swift:506`).
2. **`analysis` / `replay` charts waste the screen.** A fixed 180 pt canvas
   with five gridlines and no axis labels renders a single dot at week 1; two
   such cards fill a phone. Source: `NativeAnalysisViews.swift:60-80`.
3. **Maps are cut at rest.** The 300 pt world map and the US tile map end
   under the tab bar, so the bottom row of states/regions is half-visible.
   Evidence: `campaign.png`, `world-*.png`, `world-results.png`. Source:
   `NativeCampaignViews.swift:68`, `:216`; `TileMapView.swift:31-45`.
4. **`reveal` map is small and unlabelled.** A 240 pt canvas in a 350 pt-wide
   area leaves dead space; states have no EV labels and the progress bars have
   no endpoint values. Source: `NativeRevealViews.swift:31-33`, `:37`, `:83`.
5. **`plan` clips a queued card.** A sliver of the next card shows between the
   sticky "Add to day" bar and the tab bar. Source:
   `GameView.swift:252-263`.
6. **Undo has no affordance.** It is a default-style grey text button under
   the header on the campaign desk and a grey text button in world campaigns.
   Source: `GameView.swift:96`; `NativeCampaignViews.swift:205`.
7. **The menu is a 12-item action sheet.** Continue, analysis, replay, new,
   library, store, editor, settings, guide, Ask, leaderboards, account,
   credits all have equal weight. Source: `ContentView.swift:335-353`.
8. **`store` is an empty page.** Signed out it shows "Sign in to buy" and
   nothing else; signed in with no products it says bundles are not on sale.
   Source: `MiscViews.swift:16-56`.
9. **`library` does not use iPad width.** A single 20 pt-padded column and a
   full-width CTA on a 1206 pt-wide tablet; 49 elections are reachable only
   through one menu. Evidence: `tablet/library.png`. Source:
   `NativeCampaignViews.swift:96-147`.
10. **iPad form sheets clip content.** Editor, settings and saves open as
    form sheets whose content is cut at the sheet edge with no visible scroll
    indicator. Evidence: `tablet/editor.png`, `tablet/settings.png`,
    `tablet/saves.png`. Source: `ContentView.swift:362-385` (no
    presentation sizing), `NativeEditorView.swift:57`.
11. **`editor` has no hierarchy.** "Save scenario", "Export JSON", "Play
    casual campaign" and "My scenarios" are four same-weight blue buttons in
    one section. Source: `NativeEditorView.swift:144-148`.
12. **`results` prioritises the wrong list.** 50+ state rows sit between the
    score and "What decided it"; achievements are cut by the tab bar in the
    capture. Source: `ResultsView.swift:68-106`.
13. **`settings` volume label is separated from its control.** The slider and
    "Volume: 60%" sit on separate Form rows; toggles use system green instead
    of the orange accent. Source: `NativeSettingsViews.swift:44-45`.
14. **`ask` breaks the native surface.** The page is an external web view with
    a white "Sign in with your game account" button and a marketing hero;
    `ask-login` embeds a light Lakeside Accounts form inside the dark sheet.
    Source: external `ask.lakesidegames.net`; `ContentView.swift:270-305`.

### P3

1. **Pluralisation.** "1 seats", "0 seats", "1 points" in world standings;
   `NativeCampaignViews.swift:173`.
2. **`daily` uses the library chrome.** "CAMPAIGN LIBRARY / Choose your
   election" on a daily challenge, with a "Launch campaign" button.
3. **Undo label differs** between "Undo" (US) and "Undo week" (world).
4. **`ask-retry`** renders "Ask recovered" as unstyled body text at the top of
   an empty page (recovery fixture, not a product surface).
5. **Dates and seeds are developer-shaped** (`daily-2026-10-05`,
   `2026-10-05` in the daily header).
6. **No image-credits capture** even though the menu exposes that sheet.
7. **`setup` card hint truncates at compact AX.** "Play this side" renders as
   "Play this si…" in the small-phone capture; allow two lines when the compact
   card has room. `SetupView.swift:381`.

## Decision request — Lakeside sign-in branding

The sign-in sheet is functionally correct but branded for another game. The
account API is also hosted there (`apps/native/iosApp/MiscViews.swift:248`,
`:298`, `:447`), so this is a platform surface, not a stray URL.

Options, cheapest first:

- **A. Brand the broker per game.** Pass a game/brand parameter from
  `NativeLakesideLogin.startUrl()` and have the broker render the MOV mark and
  name. Needs a web/auth-service change; no shared-contract change.
- **B. Use a MOV-branded auth host.** Point `startUrl`/`isCallback` at
  `accounts.lakesidegames.net` (or a MOV subdomain) with the same one-time
  code contract. Needs a backend endpoint plus a `shared/**` change and the
  iOS/Android allowlists.
- **C. UI stopgap.** Hide "Sign in with Lakeside Games" in MOV until the door
  is branded and keep email/password. This loses the one-click flow but removes
  the cross-brand surprise immediately.
- **D. Explain it.** Keep the shared broker and add "You'll sign in with your
  Lakeside Games account" above the sheet. Cheapest, but the AHD logo and
  PostHog banner remain.

Recommendation: **A**, with **C** as the stopgap if the broker change cannot
land before the next TestFlight. This loop cannot implement A or B because
`shared/**` is read-only.

## Coverage gaps

- `native.yml` captures 32 screens, not the 34 the loop prompt describes. No
  capture for `credits`, setup steps 2-4, the event dialog, the week recap, or
  a signed-in account.
- `ios-layouts` now runs `setup,library,saves,settings,editor,world-de,champions`.
  The core loop (`campaign`, `plan`, `results`, `reveal`) is still **not**
  exercised at AX size or on iPad.
- The harness never scrolls, so "below the fold" is invisible in evidence.
  Every iteration that changes layout should capture the same screen at
  default size, AX/small phone, and iPad.

## Loop log

| Iter | Screen | Change | Score | Evidence |
| --- | --- | --- | --- | --- |
| 0 | all | Audit only; no code changes | 2.7 baseline | run 37372831909, artifacts `ios-simulator-launch` + `ios-layout-flows` |
| 1 | `setup` | Compact AX header, explicit disabled action, whole party labels | 3 → 4 | run 40072128974 (`setup.png`, `small-phone/setup.png`, `tablet/setup.png`) |
| 2 | `library` | Wrapping election/party rows, pinned launch action | 3 → 4 | run 40075241534 (`library.png`, `daily.png`, `small-phone/library.png`, `tablet/library.png`) |
| 3 | `champions` | Full-width empty card, loading row, duplicate title removed | 2 → 4 | run 40078561917 (`champions.png`, `small-phone/champions.png`, `tablet/champions.png`) |
| 4 | `saves` | Second-level timestamps on local and cloud saves | 2 → 3 | run 40084847111 (`saves.png`, `small-phone/saves.png`, `tablet/saves.png`) |
| 5 | app chrome | Tab labels legible at AX; tab grows to 64 pt | no screen delta (P1 #4) | run 40088823403 (`small-phone/setup.png`, `small-phone/library.png`) |

## Next three moves

1. **Iteration 6 — `analysis`/`replay` charts:** compact trend cards with a
   latest-value headline instead of a 180 pt single-point canvas.
2. **Iteration 7 — `results`:** put the score and "what decided it" above the
   long state list.
3. **Iteration 8 — `store`:** give the signed-out store a clear next step and
   stop it reading as an empty page.

`lakeside-login` is the highest-trust defect but is blocked on a product
decision (auth host/branding lives in `shared/**` and the auth service).
