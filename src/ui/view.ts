// Where the app currently is: the landing scenario browser, one of the game
// shells (US / UK / a generic country), or the leaderboard. The optional
// initialSeed/initialParty prefill the setup screens (Daily Challenge).
// `setup` marks a fresh setup screen: no autosave is restored on load.
export type View =
  | { kind: "landing" }
  | { kind: "us"; scenarioId?: string; initialSeed?: string; initialParty?: string; setup?: boolean }
  | { kind: "uk"; electionId?: string; initialSeed?: string; initialParty?: string; setup?: boolean }
  | { kind: "country"; countryId: string; electionId?: string; initialSeed?: string; initialParty?: string; setup?: boolean }
  | { kind: "leaderboard" }
  | { kind: "legal"; tab?: "privacy" | "terms" };
