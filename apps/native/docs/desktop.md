# Desktop builds

The Tauri 2 desktop shell lives here. It wraps the web edition from this same checkout, so the simulation and interface are never forked.

## Status (November 2026)

Verified on GitHub Actions by `.github/workflows/desktop.yml`, preview
channel, with the committed `Cargo.lock` unchanged (opener plugin included):

- **Windows** (`windows-latest`): NSIS installer and the raw app .exe are
  built. A smoke step launches the .exe, finds its window by title, and
  screenshots the desktop: the landing page renders in WebView2.
- **Linux** (`ubuntu-latest`): AppImage and .deb are built. The same smoke runs
  under xvfb: the window appears with its title and the landing page renders.
- **macOS** (`macos-latest`, Apple Silicon): the unsigned .app is built and
  packaged as a .zip and a .dmg. It is not launched in CI.

Not verified yet: installing, upgrading and uninstalling through the
installers, checkout opening in the system browser on a real desktop, starting
the macOS build at all, and Intel Macs.

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
  That builds the preview channel on Windows, Linux and macOS.
- Or run it by hand from the Actions tab ("Run workflow") and pick the channel:
  `desktop-preview` (default), `desktop-direct` or `steam`.

Each job uploads its files as an artifact on the run page:

| Artifact | Contents |
| --- | --- |
| `mov-windows-<channel>` | `Margin of Victory[ Preview]_2.0.0_x64-setup.exe` (installer) and `margin-of-victory-<channel>-portable.exe` (runs without installing) |
| `mov-windows-smoke` | screenshot of the launched app |
| `mov-linux-<channel>` | `.AppImage` and `.deb` |
| `mov-linux-smoke` | screenshot under xvfb and the app's console output |
| `mov-macos-<channel>` | unsigned `.app` in a .zip, and a .dmg |

A Windows build takes about five minutes from a cold cache.

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

Known on Windows: country flags show as two-letter codes ("US", "GB"),
because Windows has no colour flag emoji. The web game shows the same in any
Windows browser.

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
`src/lib/externalLink.ts`, and the game picks a purchase up when the window regains
focus (see `src/store/storeFlow.ts`). Sign in with Lakeside Games is not offered in
the desktop window, because the return trip cannot reach it; an account that needs
linking is linked once in the browser.

The checked-in master icon is `public/brand/margin-of-victory-icon.png`; the
Tauri-generated sizes for every platform live in `src-tauri/icons/`.

## Remaining release work

- Code signing for Windows (an EV or OV certificate, or Azure Trusted Signing)
  so SmartScreen stops warning. Until then, direct downloads are for testers.
- Sign and notarize macOS builds (Developer ID certificate and an Apple
  notarization step in the workflow).
- Test a `desktop-direct` build end to end: Buy opens the browser, the purchase
  shows up when the window regains focus, and sign in works.
- Verify install, upgrade, uninstall, save retention and offline startup on
  every supported desktop OS.
- Implement and test Steam DLC ownership before selling packs on Steam.
- Bump the desktop version (`tauri.conf.json`, `Cargo.toml`, `package.json`) with every release; it is 2.0.0 for the 2.0 release.
