# Store billing adapters

The native beta offers the complete catalog for free. Store channels hide the
Lakeside checkout, and the unconfigured platform SKU catalog cannot sell packs. This document
describes the adapters and configuration needed before native paid sales.

## The seam that already exists

`MOVGame/src/lib/distribution.ts`:

| Channel | externalStore | nativeStoreName |
| --- | --- | --- |
| web | true | — |
| desktop-direct | true | — |
| steam | false | Steam |
| ios | false | App Store |
| android | false | Google Play |

`externalStore: false` is why native builds render no Lakeside checkout. Each
native channel needs one adapter behind this policy — the rest of the game keeps
reading `unlocked: { scenarioIds, packIds }` and does not care where it came
from.

## How entitlements work today

- The game is a **consumer** of the Lakeside platform. `server/entitlements.ts`
  calls `GET /account/api/entitlements` for the signed-in identity, caches the
  result for 30 s and **fails soft to an empty list** — play is never blocked by
  the platform being unreachable or by a missing token.
- Activation codes are redeemed on the platform (`POST /account/api/redeem-code`)
  and are OR'd on top of platform purchases (`server/activation.ts`).
- The client holds the result in `src/store/authStore.ts` (`unlocked`), and pack
  → scenario gating lives in `src/content/scenarioRegistry.ts`.
- The current open beta makes the complete catalog playable for free on web,
  iOS and Android. The paid model below is planned release behavior. When paid
  gating is enabled, two starter scenarios and the daily challenge stay free.
- The platform store SKU catalog is empty. App Store Connect has no MOV IAP products
  as of 2026-10-01. The owner confirms the Play app still needs creating. The app cannot sell
  packs until actual products, mappings and validation are configured.

## Adapter surface (identical on all three stores)

```
listProducts()   -> [{ storeSku, packId, price, currency }]   mapped from one table in MOVGame
purchase(packId) -> transaction result
restore()        -> re-deliver every non-consumable the account owns
entitlements()   -> shared account packIds with a protected, expiring cache
```

Store specifics:

- **Google Play (android)** — non-consumable products; restore via
  `queryPurchasesAsync`; purchases must be acknowledged or Google auto-refunds
  them; real-time developer notifications (RTDN) carry refund/revocation.
- **StoreKit (ios)** — non-consumable IAPs; restore via
  `Transaction.currentEntitlements`; App Store Server Notifications carry refunds
  and revocations; must be exercised through StoreKit Testing and TestFlight.
- **Steam (desktop)** — the client is free and packs are DLC; ownership must be
  read from Steamworks, and **the Steamworks partner setup and DLC SKUs do not
  exist yet**, so Steam pack sales cannot launch until they do.

## Store purchases and existing account access

Keep two decisions separate: selling digital packs inside a native app and
recognizing content already bought on another platform.

- Native digital sales normally use StoreKit on iOS and Play Billing on Play,
  subject to documented storefront/program exceptions. The existing
  `externalStore: false` policy hides Lakeside checkout inside native builds.
- [Apple guideline 3.1.3(b)](https://developer.apple.com/app-store/review/guidelines/#multiplatform-services)
  allows access to previously acquired multiplatform content when the same
  items are also available as in-app purchases in the app. The old blanket
  prohibition on recognizing web-bought packs was incorrect.
- [Google's Payments FAQ](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en)
  explicitly allows consumption-only access to content bought elsewhere.
  Consumption-only apps offer no purchases inside the app. Apps offering
  native digital sales follow the separate Play Billing requirements.
- Existing-account access, receipt bridging, activation-code UI and regional
  purchase links need explicit release decisions. Store-scoped ownership is
  an architectural option, not a universal prohibition on shared ownership.

The current beta stays free. Future in-app pack sales require configured
store products and actual purchase/refund/restore verification. Desktop-direct
and web retain their Lakeside policy; Steam paid DLC needs partner setup.

## Shared Lakeside ownership

The owner selected shared ownership across web, iOS and Android on 2026-10-01.
Both adapters obtain a binding through authenticated MOV routes. StoreKit uses
appAccountToken and Play uses obfuscatedAccountId before checkout. The account
service verifies current provider status and projects production receipts into
its existing purchase ledger. Email and client-supplied owners cannot claim a
purchase. A restore on a different Lakeside account rejects the claim.

Shared ownership refresh runs before store queries. Existing web and other-store
rights remain available when the store service is unavailable or the SKU catalog
is empty. Store reconnect and restore redelivery do not gate that wallet read.

MOV routes are `/api/store/catalog` (public), `/api/store/binding`,
`/api/store/verify` and `/api/store/ownership` (authenticated). The dedicated
MOV_STORE_BRIDGE_TOKEN stays server-side. Apple signed JWS and Google purchase
tokens are sent to the platform for provider validation. StoreKit transactions
finish only after durable delivery; Google acknowledgement runs on the server
after the grant. Notifications and provider rechecks handle refunds and missed
notifications. Sandbox receipts never grant production ownership.

The SKU mappings (one per country pack plus the Complete Collection, 15 in all) are read from the
platform MOV_STORE_PRODUCTS configuration.
Neither native client invents product IDs or derives local rights from a receipt
before server delivery. Product names and regional prices come from the store.
Paid offerings stay disabled until both stores are configured and verified.

## What is tested without a device

- `iosApp/MOVGameiOSTests` (CI job "iOS StoreKit purchase tests", device tier)
  runs the real `StoreKitAdapter` on the simulator with Xcode StoreKit testing.
  `Products.storekit` lists all 15 products. A stand-in game server records
  what the app sends. The tests load every product with its price, buy a
  country pack and the Complete Collection, check that the signed transaction
  reaches `/api/store/verify` with the right product id and the binding's
  appAccountToken, that the right pack unlocks only after the server confirms,
  that a failed delivery leaves the transaction unfinished, and that Restore
  purchases delivers it.
- `server/__tests__/apple-transaction.test.ts` pushes a real-format signed
  transaction (ES256, three-certificate x5c chain) through `/api/store/verify`
  to a stub account service that checks it the way the real one does.
- Not provable without Apple: StoreKit testing transactions are signed by
  Xcode, not Apple, so the account service refuses them (Apple root pinning).
  Apple's sandbox needs a signed build and a sandbox Apple Account signed in on
  the device or simulator, which CI cannot do. The first purchase Apple
  verifies end to end is App Review's own sandbox purchase, unless someone buys
  on a TestFlight build first.

## Offline and refund behaviour

The shared NativeStoreWallet policy accepts fresh authenticated ownership
snapshots. Keychain and Android Keystore protect its serialized cache. It is
bound to the authenticated session and expires seven days after confirmation.
Offline reads do not renew that timestamp. Logout and account changes prevent
reuse of the previous wallet. A fresh server snapshot replaces the old set;
delayed responses cannot restore an already observed refund. Provider outages
retain only the current session's unexpired cache. The beta remains free.

Actual purchase, refund, restore, reinstall and offline exercises on both store
builds remain release gates. Unit fixtures and simulator flows do not prove a
configured provider transaction.

## Remaining configuration

Configure iOS and Android together: create the 15 pack products (14 countries and the Complete Collection),
map their real IDs, set platform validation credentials, then exercise actual
purchase, restore, refund, reinstall and offline behavior on both stores.
Existing StoreKit and Play Billing adapters and Actions build pipelines do not
replace those store exercises. Steam DLC additionally needs partner setup.
