// The game stores (US, UK, multiparty country) carry their engines and
// content, so the landing shell never imports them. Each store registers
// itself here when its module first loads; the shell can then unload or
// inspect a game in memory without pulling a store into the first download.
// A store that never loaded has no game to unload.

export type SessionKind = "us" | "uk" | "country";

interface SessionStore {
  getState(): { game: unknown; unload(): void };
}

const stores: Partial<Record<SessionKind, SessionStore>> = {};

export function registerSession(kind: SessionKind, store: SessionStore): void {
  stores[kind] = store;
}

/** Drop the in-memory game of one engine path, if its store has loaded. */
export function unloadSession(kind: SessionKind): void {
  stores[kind]?.getState().unload();
}

/** The in-memory game of one engine path, or null when its store never loaded. */
export function sessionGame<T>(kind: SessionKind): T | null {
  return (stores[kind]?.getState().game as T | null | undefined) ?? null;
}
