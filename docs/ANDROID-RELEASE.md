# Android release (Google Play)

Package name: `com.lakesidegames.electioneer`. The release bundle is built from
`apps/native` on `main` by the manual **Android release bundle** workflow, then
uploaded to the Play Console by hand. The workflow does not publish anything.

## Build the bundle

1. Merge the reviewed change after the web and native checks pass.
2. Run the workflow on `main` with the full commit as `reviewed_sha`. It rejects
   any other revision. Leave `signed` on for a Play upload.
3. The workflow runs the shared engine tests, builds
   `:androidApp:bundleRelease`, checks that the bundle holds the campaign
   content and a signature, and attaches `androidApp-release.aab` to the run
   for 14 days. Download it from the run page.
4. The version code is 2,000,000 plus the workflow run number, so every upload
   is higher than the last. The version name is `versionName` in
   `androidApp/build.gradle.kts`.

Local check without signing (any machine with the Android SDK):

```
cd apps/native
./gradlew :androidApp:bundleRelease --no-daemon --max-workers=2
```

The result is `androidApp/build/outputs/bundle/release/androidApp-release.aab`,
unsigned. Play rejects an unsigned bundle; this only proves the bundle builds.

## Repository secrets

Signing reads these Actions secrets. They are never checked in, and the
workflow fails with the missing names when a signed build is requested without
them.

| Secret | What it holds |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The upload keystore (`.jks`), base64 encoded on one line |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_ALIAS` | The key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | The key password |
| `MOV_SENTRY_DSN` | Optional. Crash reporting stays off when empty. Shared with the web and desktop builds (`docs/error-reporting.md`) |

Create the upload key once and keep the keystore backed up outside the repo:

```
keytool -genkeypair -v -keystore upload-keystore.jks -storetype JKS -keyalg RSA \
  -keysize 2048 -validity 10000 -alias upload
base64 -w0 upload-keystore.jks
```

Use Play App Signing (the default for new apps). Google keeps the real app
signing key; this upload key only proves the upload is yours, and it can be
reset through Play support if it is lost.

For a local signed build set `MOV_ANDROID_KEYSTORE_FILE` (a path),
`MOV_ANDROID_KEYSTORE_PASSWORD`, `MOV_ANDROID_KEY_ALIAS` and
`MOV_ANDROID_KEY_PASSWORD` in the shell. Without all four the release build is
unsigned.

## Store products

The apps read product ids from the shared account service, not from a table in
this repository. One non-consumable in-app product exists per pack, id
`com.lakesidegames.electioneer.` followed by the pack id with hyphens turned
into underscores (`new-zealand` is `...new_zealand`), plus `complete`. Play
Billing needs the app to be uploaded to a Play track before the products can be
bought in testing. See `apps/native/docs/billing.md`.
