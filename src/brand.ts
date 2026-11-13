// Public identity for the game. Commerce, entitlement, database, and package
// identifiers intentionally remain `electioneer` for compatibility. The web
// address is /games/margin-of-victory/; the old /games/electioneer/ path
// redirects there. Nothing in the game depends on which path serves it.

export const BRAND = {
  name: "Margin of Victory",
  nameCaps: "MARGIN OF VICTORY",
  tagline: "Run the race. Rewrite history.",
  eyebrow: "RUN THE RACE",
  domain: "lakesidegames.net",
  url: "https://lakesidegames.net/games/margin-of-victory/",
  storeUrl: "https://lakesidegames.net/store/margin-of-victory",
  shareUrl: "lakesidegames.net/games/margin-of-victory",
  supportEmail: "support@lakesidegames.net",
  // Attribution line for footers/about.
  from: "From the maker of A House Divided",
} as const;

// Links back to the Lakeside Games site, shown in the header, the footer and the Store.
export const LAKESIDE_LINKS = {
  home: "https://lakesidegames.net",
  store: "https://lakesidegames.net/store",
  account: "https://lakesidegames.net/account",
  games: "https://lakesidegames.net/games",
  support: "https://lakesidegames.net/services/#support",
} as const;
