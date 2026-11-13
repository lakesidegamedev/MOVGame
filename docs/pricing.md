# Pricing and entitlement policy

## Release pricing

| Edition | Price | Included content |
| --- | ---: | --- |
| Base game, every platform | Free | At least one election in every country (two in the US) and the daily challenge |
| Country bundle | $0.99 each | One per registered country: every paid election of that country |
| Complete Collection | $3.99 | Every country bundle, including scenarios added later |

The prices in this table are the planned list prices, for reference only. The
game holds no prices of its own (the `price` field was removed from the pack
data), and the code never shows a number from this file.

Bundle ids are each country module's `pack.id` (`us-historical`, `uk-elections`,
`canada`, `germany` and so on) plus `complete`; `src/content/packs.ts` derives the
list, and the store shows each pack's elections. The retired `global` pack is no
longer sold; players who own it keep its fourteen original Canada, Germany, France
and Australia scenarios. Native store SKUs mirror the same ids and the same US
price tiers.

These are one-time prices. There is no subscription because the game does not
yet deliver enough recurring value to justify one.

## The store screen

The Store opens from the landing page, the account menu, the setup and results
screens, and every locked election. It leads with the Complete Collection, shows one
tile per country pack, and has a page per pack listing its elections. Prices and the
"on sale" answer come from the Lakeside platform catalog and nowhere else. A pack the
game ships before the platform lists it shows as "coming soon" with no Buy button. A pack
the player already has shows no price and no Buy.

### A price is shown only when it is live

- Web and desktop show a price only when `/api/catalog` answered with
  `source: "platform"` in this session. The answer is kept in memory for a minute and
  is never written to localStorage or IndexedDB.
- While the catalog is loading the store says "Checking the price…". When it cannot be
  reached, answers with anything but the platform's own prices, or takes longer than
  eight seconds, every price slot reads "Price unavailable, try again", Buy is disabled,
  and a Try again button asks again. Copy that names prices (landing page hero, pricing
  card, FAQ) drops the number in that state.
- The server's `/api/catalog` returns `source: "unavailable"` with `priceCents: null` on
  every product when the platform cannot be reached, sends `Cache-Control: no-store`
  for it, and does not cache the failure. A pack the platform answer leaves out, or
  prices with an unusable value, also has `priceCents: null` and is not listed.
- The iPhone and Android apps show only the App Store or Google Play product's own
  price (`displayPrice`, `formattedPrice`). With no product loaded they show no price.
- The amount a player pays on the web is set by the Stripe price attached to the
  product on the Lakeside platform, never by the number the game displays.

## Counts

Every count on the landing page, the store and the guide comes from
`src/content/facts.ts`, which reads the scenario registry. The web build also
publishes them as `catalog-facts.json` next to `index.html`
(`/games/margin-of-victory/catalog-facts.json`) for the Lakeside store. Definitions:

- **free**: playable by anyone at any time with no purchase. Every country has at
  least one; the US has two. The Daily Challenge is separate and never counted.
- **paid**: every other election, unlocked by its country pack or the Complete
  Collection.
- **playable** (election library): free elections plus the ones the player owns.
- **a pack's elections**: every election of its countries, free ones included,
  shown as "24 elections, 2 free".

## Platform rules

- Web and direct desktop builds may use the Lakeside checkout and existing
  `electioneer` entitlements.
- Steam builds are free and sell scenario packs as DLC. They never show
  Lakeside checkout.
- iOS builds are free and sell packs as App Store non-consumable IAPs with
  restoration.
- Google Play builds are free and sell packs as non-consumable Play products
  with restoration.
- A signed-in player may use an existing Lakeside entitlement on another
  platform only where store policy permits and the equivalent content is also
  available through that platform's required purchase system.
- Product IDs, save formats, database keys, and the live URL remain
  `electioneer` for compatibility.

## Launch sequence

1. Keep the open beta free while native clients and analytics are validated.
2. Launch the free direct desktop client with Lakeside pack purchases.
3. Launch free mobile clients after native pack billing and restore tests pass.
4. Launch the free Steam client after pack DLC ownership is wired.
5. Run a bounded web paywall cohort before enabling it for every visitor.
6. Revisit pricing from conversion, refund, retention, and support data.

Store fees, taxes, and regional pricing mean gross price is not net revenue.
The business target must be measured from settled proceeds.
