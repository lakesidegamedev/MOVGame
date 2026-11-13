# Desktop builds

The Tauri 2 desktop shell lives here. It wraps the web edition from this same checkout, so the simulation and interface are never forked.

## Status (November 2026)

Checked on GitHub Actions by `.github/workflows/desktop.yml` on every push to
`build/desktop*`. Last all-green run: 43299800492 on commit 23718c0. Run
43313314086 on commit 6b85f8e added the launcher sign-in check (passed) and a
2 second limit on the purchase pickup after the window comes back (failed,
see below; the limit is now a recorded note, not a check); Linux passed. How each test works is under "Smoke tests" below.

**Windows** (`windows-latest` runner, WebView2), verified by driving the
installed game with real clicks:

- The per-user NSIS installer installs silently (`/S`) with no administrator
  prompt, to `%LOCALAPPDATA%\Margin of Victory`, with a Start menu entry (a
  silent install also adds a desktop shortcut).
- A 1.9.0 build plays from the landing page through the setup wizard to the
  week two desk. Installing 2.0.0 over it upgrades in place (same folder,
  version 2.0.0 and publisher "Lakeside Games" in Apps & Features) and the
  landing page offers "Resume US
  campaign · Week 2", which opens that week.
- Buy in a `desktop-direct` build, signed in with a linked account, calls the
  opener plugin with
  `https://lakesidegames.net/account/checkout?game=electioneer&product=us-historical`
  and Windows opens that URL in Edge (the default browser on the runner). The
  Store says checkout is open in the browser. When the platform reports the
  pack as owned, the Store shows "United States unlocked" (3.3 seconds after
  the window came back in run 43299800492). The game server was mocked for
  this step; no payment is made.
- Bringing the game window back checks for the purchase at once on Windows.
  The shell subclasses the game window and, on `WM_ACTIVATE`, sends the page
  `mov-shell-focus`. In run 43332464583 the helper minimised the game window,
  then made it the foreground window again (`AttachThreadInput` plus
  `SetForegroundWindow`, the way a taskbar click or Alt+Tab does); the hook
  reported 2 activations and the Store showed "United States unlocked" 259 ms
  after the restore (800 ms after the first focus report). The smoke asserts
  that a focus report reaches the page and that the pickup lands within 2 s of
  it. Why earlier runs saw no focus at all: their helper restored
  `Process.MainWindowHandle`, which names a hidden window of the process while
  the game window is minimised, so the game window never came back to the
  front in CI (run 43330269865: `wasMinimised=False`, Edge still in front).
  WebView2 sends the page no `visibilitychange` on minimise or restore.
- Started the way the Lakeside launcher starts it, with a sign-in code in
  `LAKESIDE_HANDOFF_CODE`, the game redeems the code once and the player is
  signed in. The game server was faked for this step. Verified in run
  43313314086: one redeem call with the right code, the player signed in, the
  code absent from the address bar and web storage, and a second request for
  it answered with nothing.
- The opener plugin refuses URLs outside its allow list
  (`https://example.com/` is rejected with "Not allowed to open url").
- Uninstalling removes the program, the Apps & Features entry and the
  shortcuts, and keeps the saves (see "Where saves live"). Reinstalling brings
  the same campaign back.
- The preview installs next to the real game in its own folder, plays a paid
  election (2016) to week two, and keeps its own saves.

**Linux** (`ubuntu-latest`, under xvfb): the AppImage starts directly (FUSE is
present on the runner), shows the landing page, and a click on Play free opens
the setup wizard. The .deb installs with apt, puts `electioneer` on the PATH
and a "Margin of Victory" menu entry in place, runs, and removes cleanly.

**macOS** (`macos-latest`, Apple Silicon, macOS 26): the .app opens with its
window (1024 by 674 on the runner) and the landing page, and a CI autoplay
build plays the free US campaign to week two (runs 43330269865 and
43332464583: Sept 1 to Sept 8). See "Installing an
unsigned macOS build" for what a downloaded copy does.

Not covered: Intel Macs, Windows on ARM, a real payment, Lakeside sign-in and
account linking in the browser, offline startup, and Steam.

## Channels

The channel is selected by Vite mode, and each mode has a `.env.<mode>` file at
the repository root that sets `VITE_DISTRIBUTION_CHANNEL`.

| Channel | Build | Store | Scores | App identifier |
| --- | --- | --- | --- | --- |
| `desktop-direct` | `npm run desktop:build` | Lakeside checkout in the system browser | posted | `com.lakesidegames.electioneer` |
| `steam` | `npm run steam:build` | no Lakeside links or checkout | posted | `com.lakesidegames.electioneer` |
| `desktop-preview` | `npm run preview:build` | browsable, Buy disabled | never posted | `com.lakesidegames.electioneer.preview` |

The base Steam client is free, and Steam DLC ownership verification is not
implemented, so paid DLC must not launch until that adapter is complete.

### The preview channel

`desktop-preview` is an internal test build of unreleased content. It is for
testers, not players.

- Every election plays without a purchase, including packs that are not on
  sale anywhere yet. Nothing is asked of the game server to unlock them.
- The Store opens and shows every pack, but every Buy button is disabled with
  "Not available in the preview".
- No leaderboard score, daily result or achievement is sent. The results
  screens say so where the Post button would be, and `src/lib/api.ts` refuses
  those calls as well.
- The window title and a banner on the landing page read "Preview build, not
  for distribution" with the commit it was built from.
- It uses its own app identifier and product name ("Margin of Victory
  Preview"), so it installs next to a real install and keeps its saves in a
  separate app data folder. It never reads or writes a real install's saves.

The unlock needs two build inputs to agree: the Vite mode must be
`desktop-preview` and the channel variable must be `desktop-preview`. Either
one alone falls back to the web policy. `src/lib/__tests__/distribution.test.ts`
checks every release channel against every mode, checks that no committed env
file other than `.env.desktop-preview` names the preview channel, and checks
that only `tauri.preview.conf.json` builds it.

## Build on GitHub Actions

Workflow: **Desktop builds** (`.github/workflows/desktop.yml`).

- Push any commit to a branch named `build/desktop` (or `build/desktop-...`).
  That builds the preview channel on Windows, Linux and macOS and runs every
  smoke test.
- Or run it by hand from the Actions tab ("Run workflow") and pick the channel:
  `desktop-preview` (default), `desktop-direct` or `steam`. Untick "lifecycle"
  to skip the Windows install test.

Each job uploads its files as an artifact on the run page:

| Artifact | Contents |
| --- | --- |
| `mov-windows-<channel>` | `Margin of Victory[ Preview]_2.0.0_x64-setup.exe` (installer) and `margin-of-victory-<channel>-portable.exe` (runs without installing) |
| `mov-windows-smoke` | screenshots and `smoke/lifecycle.json`, one line per check |
| `mov-linux-<channel>` | `.AppImage` and `.deb` |
| `mov-linux-smoke` | screenshots, app logs and `linux-smoke.txt` |
| `mov-macos-<channel>` | `.app` (sealed with an ad-hoc signature, not Developer ID) in a .zip, and a .dmg |
| `mov-macos-smoke` | screenshots and `macos-smoke.txt` |

A Windows job takes about 15 minutes with the install test, macOS and Linux
about 8.

### Smoke tests

- **Windows** (`scripts/smoke-windows-lifecycle.ps1`): installs a 1.9.0
  `desktop-direct` build silently, plays it to week two, upgrades to the
  current version, resumes the save, presses Buy, checks the checkout URL
  reached the opener and Edge, checks the unlock after a minimise and restore,
  checks the unlock arrives within 2 seconds of the window coming back,
  checks the opener's allow list, starts the app the way the Lakeside
  launcher does and checks the sign-in, uninstalls, checks the
  saves are kept, reinstalls and resumes again, then installs the preview next
  to it and plays a paid election to week two. It also launches the tester
  artifact's portable .exe (`scripts/smoke-windows.ps1`).
- The clicks come from `scripts/desktop-smoke.mjs`, which drives the game over
  WebView2's remote debugging port with Playwright. WebView2 ignores the
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` variable for this app, because wry
  always passes its own browser arguments, so the install test uses CI test
  builds of the same commit made with
  `desktop-build.mjs --ci-debug-port 9222`. Those set `additionalBrowserArgs`
  (keeping wry's defaults), add "(CI test build)" to the window title and are
  never uploaded. The checkout step answers the game server's API with a
  signed-in, linked test account; nothing reaches the real server and nothing
  is paid. The launcher step runs `scripts/fake-api.mjs` on the runner,
  points the API host at it in the hosts file and trusts a throwaway
  certificate for it, then removes all three.
- `desktop-smoke.mjs --local <url>` runs the same steps against a built web
  bundle in Chromium, with a stand-in for the Tauri bridge, for working on the
  script without Windows.
- **Linux** (`scripts/smoke-linux.sh`): AppImage start, a click on Play free,
  .deb install, run and removal.
- **macOS** (`scripts/smoke-macos.sh`): opens the .app and checks its window,
  then opens a copy marked as downloaded and records what Gatekeeper does, for
  the sealed bundle and for the bundle as Tauri leaves it.
  Then a CI autoplay build of the same commit (`desktop-build.mjs
  --ci-autoplay`, never uploaded; WKWebView has no debugging port to drive it
  from outside) plays the free US campaign from the landing page to week two by
  itself and reports each stage to a local listener
  (`scripts/ci-autoplay.mjs`, `scripts/smoke-macos-play.sh`); the desk is
  screenshotted at week two (`smoke/play/macos-week-two.png`).

### Where saves live

Saves, settings and the signed-in session are web storage inside the app's
webview data folder, keyed by the app identifier, not by the install folder:

| OS | Real game | Preview |
| --- | --- | --- |
| Windows | `%LOCALAPPDATA%\com.lakesidegames.electioneer\EBWebView` | `%LOCALAPPDATA%\com.lakesidegames.electioneer.preview\EBWebView` |
| Linux | `~/.local/share/com.lakesidegames.electioneer` | `~/.local/share/com.lakesidegames.electioneer.preview` |
| macOS | `~/Library/WebKit/com.lakesidegames.electioneer` (WKWebView's usual place; not checked in CI) | `~/Library/WebKit/com.lakesidegames.electioneer.preview` |

- Upgrading never touches them. The installer writes the program folder only.
- Uninstalling on Windows keeps them unless the player ticks "Delete the
  application data" in the uninstaller (unticked by default; a silent
  uninstall never deletes them). Removing the .deb keeps them too. So a
  reinstall picks the campaign back up.
- To start completely fresh, delete the folder above after uninstalling.

## Installing an unsigned Windows build

Windows builds are not code signed yet, so Windows warns before running them.
This is what a tester sees:

1. GitHub delivers the artifact as a .zip. Right-click it, choose
   **Extract All**, and open the extracted folder.
2. The browser may say the file "isn't commonly downloaded". In Edge, open the
   downloads list, choose **...** next to the file, then **Keep**, then
   **Show more** and **Keep anyway**.
3. Double-click the setup .exe (or the portable .exe). A blue window titled
   **"Windows protected your PC"** says Microsoft Defender SmartScreen
   prevented an unrecognized app from starting. Only a **Don't run** button is
   shown at first.
4. Click the **More info** link. It shows the file name and
   **Publisher: Unknown publisher**, and a **Run anyway** button appears.
   Click **Run anyway**.
5. The installer installs for the current user only and does not ask for an
   administrator password. It adds a Start menu entry. If WebView2 is missing
   (rare on Windows 10 and 11), it downloads it first.

The portable .exe needs no install. It still keeps its saves in the app data
folder for its identifier, so the portable and installed copies of the same
channel share saves.

Once installed, the game itself should not warn on later launches, because
the installer writes it locally and it carries no download mark (not checked
in CI: runners do not run SmartScreen prompts). Each new downloaded installer
warns again until builds are signed.

## Installing an unsigned macOS build

macOS builds have an ad-hoc signature only (no Apple Developer ID, not
notarised). Tauri signs just the binary; the workflow seals the whole bundle
with `codesign --force --deep --sign -` before packaging. That matters: on
macOS 26, a downloaded copy of the bundle as Tauri leaves it is reported as
**"is damaged and can't be opened. You should move it to the Trash."**, with
no way past it. The sealed bundle gets the normal unsigned-app path instead.
What a tester sees:

1. Open the .dmg and drag the app to Applications (or unzip the .zip).
2. Double-click it. A dialog says **"Margin of Victory Preview" Not Opened:
   Apple could not verify it is free of malware**, with **Move to Trash** and
   **Done**. Click **Done**.
3. Open **System Settings**, **Privacy & Security**, scroll to Security, and
   click **Open Anyway** next to the message about the app. Confirm with an
   administrator password or Touch ID, then click **Open** once more.
4. From then on it opens normally.

Alternatively, in Terminal: `xattr -dr com.apple.quarantine "/Applications/Margin of Victory Preview.app"`.

The builds are Apple Silicon only. Intel Macs need a universal build.

## Build locally

```text
npm ci --prefix ../..
npm ci
npm run fetch:web          # check the local web source path
npm run tauri:dev          # dev shell against the root web source

npm run desktop:build      # desktop-direct, every bundle format for this OS
npm run steam:build        # Steam channel
npm run preview:build      # internal preview channel
```

Arguments after `--` go to `tauri build`, for example
`npm run preview:build -- --bundles nsis`.

Platform prerequisites are the standard Tauri 2 ones. On Linux (Debian/Ubuntu):
`libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`,
`libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`.
Windows needs the MSVC build tools plus WebView2; macOS needs the Xcode command
line tools. Use the workflow for Windows and macOS packages rather than a
cross-build.

## Checkout and sign in

Lakeside checkout and account pages open in the system browser, not in the game
window. The shell registers the Tauri opener plugin (`src-tauri/src/lib.rs`) and
`src-tauri/capabilities/default.json` allows it to open only `lakesidegames.net` and
`sim.ahousedividedgame.com` URLs. The web code calls it through
`src/lib/externalLink.ts`. After Buy the game checks for the purchase every 4 to 12
seconds for ten minutes, and again when the window comes back (see
`src/store/storeFlow.ts` and `src/ui/store/StoreScreen.tsx`). On Windows the
page gets no `focus` or `visibilitychange` when the window is restored, so the
shell forwards Tauri's `WindowEvent::Focused(true)` to the page as a
`mov-shell-focus` event on `window`, and the Store treats it like `focus`. On
Windows the shell also sends that event on every `WM_ACTIVATE` of the game
window (see "Smoke tests"), so coming back from the browser checks at once. Sign in with Lakeside Games is not offered in
the desktop window, because the return trip cannot reach it; an account that needs
linking is linked once in the browser.

The checked-in master icon is `public/brand/margin-of-victory-icon.png`; the
Tauri-generated sizes for every platform live in `src-tauri/icons/`.

## Started by the Lakeside launcher

The launcher starts an installed game that opts in with `LAKESIDE_LAUNCHER=1`,
`LAKESIDE_LAUNCHER_VERSION` and, when the player is signed in to the launcher,
a single-use `LAKESIDE_HANDOFF_CODE` in its environment. This is how it starts
Corporate Warfare. The shell reads the code at startup and removes it from its
own environment straight away, so the browser it opens for checkout never
inherits it. The page asks for it once with the `take_launcher_code` command
(`src/lib/desktopShell.ts`); a second call returns nothing. From there it takes
the same path as the web game's `#launcher_code=`: the game server redeems it
(`POST /api/lakeside/launcher-exchange`) and the player is signed in. A code in
the wrong shape shows "The launcher could not sign you in" without a server
call. The code is never logged, put in the address bar or stored.

For the launcher to start this app, its catalog needs a native entry for
Margin of Victory with the desktop executable and `handoffClientId` set to
`margin-of-victory`, the client id the game server redeems with.

## Code signing: what it would unblock

Every desktop build is unsigned. This section lists what works today, what a
Windows code signing certificate and Apple Developer ID notarisation would
change, and the steps each takes.

### Works today without any certificate

- Windows: install, upgrade in place, uninstall and reinstall through the NSIS
  installer, per user, with no administrator prompt; saves survive all of them.
  Checkout opens in the system browser and the purchase is picked up when the
  player returns. All verified in CI (see Status).
- Windows: a downloaded setup .exe shows SmartScreen once ("Windows protected
  your PC", "Publisher: Unknown publisher"). More info, then Run anyway, gets
  past it. Apps & Features lists the publisher as "Lakeside Games"
  (`bundle.publisher`), but only as text the installer writes, not a
  verified name.
- Linux: AppImage and .deb need no signing.
- Steam: Steam does not require Authenticode, and games installed by Steam do
  not get the download warning.
- macOS: a build made on the Mac itself opens normally. A downloaded copy is
  blocked by Gatekeeper until the tester allows it in System Settings (see
  "Installing an unsigned macOS build").

### What a Windows code signing certificate unblocks

1. The SmartScreen and file Properties dialogs name Lakeside Games as the
   verified publisher instead of "Unknown publisher".
2. SmartScreen warnings stop once the signed files build reputation from
   downloads. They do not stop on day one: since 2024 Microsoft treats EV and
   OV certificates the same for reputation, and a new certificate starts with
   little. Azure Artifact Signing builds reputation the same way.
3. Players with Smart App Control on (some fresh Windows 11 installs) can run
   the game at all. Smart App Control blocks unsigned, unknown apps and has no
   "Run anyway".
4. Fewer antivirus and company-policy blocks on an unsigned installer that
   downloads WebView2.
5. A public "Download for Windows" button becomes reasonable. Until then,
   direct Windows downloads are for testers.

It does not unblock the store or checkout (they work now), Steam (works
unsigned), or automatic updates (Tauri's updater uses its own free signing
key, separate from code signing, and is not set up yet).

### Steps for Windows signing

Option A, Azure Artifact Signing (formerly Trusted Signing). Recommended if
Lakeside Games qualifies.

1. An Azure subscription with billing, and an Artifact Signing account. It
   bills monthly from the moment the account exists; check the current price
   on Microsoft's pricing page.
2. Identity validation in the Azure portal. Public-trust certificates are
   available to organisations in the US, Canada, the EU and the UK, and to
   individual developers in the US and Canada. Organisation validation needs
   the business's registration details.
3. A certificate profile, plus a service principal or GitHub federated
   identity with the signer role.
4. GitHub secrets for that identity. In `desktop.yml`, a
   `bundle.windows.signCommand` overlay that calls Microsoft's signing client,
   so Tauri signs the game .exe and the installer.
5. `signtool verify /pa` on both files in the workflow, and one install on a
   clean PC to see the publisher name.

Option B, an OV certificate from a public CA (DigiCert, Sectigo, SSL.com,
Certum). Organisation validation takes days to weeks and the fee is yearly.
Since 2023 the private key must live in hardware or a cloud HSM, so CI needs
the CA's cloud signing service. Then steps 4 and 5 above. EV certificates cost
more and no longer skip SmartScreen.

Option C, the Microsoft Store (MSIX). The Store signs the package and shows no
SmartScreen warning, but it needs an MSIX package, Store review, and its own
purchase path like iOS and Android. A bigger job than A or B.

### What Apple Developer ID and notarisation unblock

1. A downloaded .dmg opens after the normal "downloaded from the internet"
   question, instead of being blocked. Without it, a tester has to go to
   System Settings, Privacy & Security, Open Anyway, and confirm with an
   administrator password. Recent macOS versions removed the old Control-click
   bypass.
2. A public "Download for Mac" button.
3. Automatic updates on Mac later on.

The Mac App Store is a separate route with its own signing and review.

### Steps for macOS signing and notarisation

1. The existing Apple Developer Program membership covers it; no new fee. The
   Account Holder creates a "Developer ID Application" certificate (only the
   Account Holder can).
2. Export it as a .p12, and create an App Store Connect API key for
   notarisation.
3. GitHub secrets: `APPLE_CERTIFICATE` (the .p12, base64),
   `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_API_ISSUER`,
   `APPLE_API_KEY` and the key file. With these set, `tauri build` signs,
   notarises and staples.
4. In `desktop.yml`, drop the ad-hoc `codesign --sign -` step (the Developer ID
   signature replaces it) and build the `app` and `dmg` bundles. The macOS
   smoke test's downloaded-copy check must then say
   "accepted, source=Notarized Developer ID".
5. Decide on Intel support at the same time: `--target universal-apple-darwin`
   builds one app for both.

## Remaining release work

- Windows code signing and macOS notarisation (above). Until then, direct
  downloads are for testers.
- A native Margin of Victory entry in the Lakeside launcher catalog (see
  "Started by the Lakeside launcher"). Until then the launcher opens the web
  game.
- A second launch while the app is already open starts a second window; there
  is no single-instance handling yet.
- Lakeside sign-in and account linking from the desktop app, end to end in a
  real browser.
- A real purchase on a `desktop-direct` build (CI covers everything up to the
  browser opening the payment page, and the unlock afterwards).
- Offline startup, Intel Macs and Windows on ARM.
- Implement and test Steam DLC ownership before selling packs on Steam.
- Bump the desktop version (`tauri.conf.json`, `Cargo.toml`, `package.json`) with every release; it is 2.0.0 for the 2.0 release.
