# Error reporting

Margin of Victory reports errors to Sentry. Errors only: no performance
tracing, no session replays, no session pings on launch, and no personal data
(`sendDefaultPii` is off; Android reports also drop the SDK's install id).

## One setting

Every build reads the same value:

| Build | Where it is read | Filled by |
| --- | --- | --- |
| Web game | `VITE_SENTRY_DSN` (`src/lib/errorReporting.ts`) | `web-deploy.yml` |
| Desktop (direct, preview, Steam) | `VITE_SENTRY_DSN`, baked into the web bundle | `desktop.yml` |
| Android app | `MOV_SENTRY_DSN` (`MovApp`) | `android-release.yml` |
| iOS app | not reported yet (no crash SDK in the app) | |

All three workflows take it from one GitHub Actions secret, `MOV_SENTRY_DSN`.
The committed `.env.*` files leave `VITE_SENTRY_DSN` empty. When the secret is
absent or empty, nothing is ever sent, which is also how local builds, tests
and forks behave.

## Environment and release

Each event carries:

- `environment`: `production` for the web game, otherwise the build's channel:
  `desktop-direct`, `desktop-preview`, `steam`, `ios`, `android`.
- `release`: the app version plus the short commit, for example
  `2.0.0+e8fe5ee`.

## Sending a test error

Once the secret is set and a build has shipped, open the game with
`#sentry-test` at the end of the address, for example
`https://lakesidegames.net/games/electioneer/#sentry-test`.

The page sends one error named `Sentry test error (<environment> <release>)`,
removes the hash from the address so a reload does not send another, and
logs the event id to the browser console. Nothing happens in a build without
a DSN. Desktop builds run the same code but have no address bar, so confirm
delivery from the web game.

On Android, a test crash comes from a release build made with
`MOV_SENTRY_DSN` set (see `apps/native/docs/release-checklist.md`).
