# Pricing and entitlement policy

## Release pricing

| Edition | Price | Included content |
| --- | ---: | --- |
| Base game, every platform | Free | US 2024, US 2020 and the daily challenge |
| Country bundle | $0.99 each | One per registered country: every paid election of that country |
| Complete Collection | $3.99 | Every country bundle, including scenarios added later |

Bundle ids are each country module's `pack.id` (`us-historical`, `uk-elections`,
`canada`, `germany` and so on) plus `complete`; `src/content/packs.ts` derives the
list, and the store shows each pack's elections. The retired `global` pack is no
longer sold; players who own it keep its fourteen original Canada, Germany, France
and Australia scenarios. Native store SKUs mirror the same ids and the same US
price tiers. Prices here are the bundled fallback; the platform catalog is
canonical.

These are one-time prices. There is no subscription because the game does not
yet deliver enough recurring value to justify one.

## The store screen

The Store opens from the landing page, the account menu, the setup and results
screens, and every locked election. It leads with the Complete Collection, shows one
tile per country pack, and has a page per pack listing its elections. Prices and the
"on sale" answer come from the Lakeside platform catalog; the bundled prices are only
a fallback for display. A pack the game ships before the platform lists it shows as
"coming soon" with no Buy button, and while the platform cannot be reached Buy is off
with a reason. A pack the player already has shows no price and no Buy.

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
