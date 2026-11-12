import { create } from "zustand";
import { localProvider } from "@persistence/local";
import { remoteProvider } from "@persistence/remote";
import type { SaveMeta } from "@persistence/types";

// The US save list, for the landing page's resume buttons. It lives outside
// gameStore so the landing page can list saves without loading the US engine
// and content.

// Merge local and remote save lists by id, newest updatedAt wins, sorted newest
// first. Local-only and remote-only ids both survive; a shared id keeps whichever
// side was touched last, so a save made on another device shows up here.
export function mergeSaveMetas(local: SaveMeta[], remote: SaveMeta[]): SaveMeta[] {
  const byId = new Map<string, SaveMeta>();
  for (const m of [...local, ...remote]) {
    const prev = byId.get(m.id);
    if (!prev || m.updatedAt > prev.updatedAt) byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

interface SavesStore {
  saves: SaveMeta[];
  refresh: () => Promise<SaveMeta[]>;
}

export const useSavesStore = create<SavesStore>((set) => ({
  saves: [],
  refresh: async () => {
    // Local-first: Dexie is the source of truth and always works offline. When
    // signed in, fold in any cloud saves.
    const local = await localProvider.list();
    const remote = await remoteProvider.list(); // [] when logged out or offline
    const saves = mergeSaveMetas(local, remote);
    set({ saves });
    return saves;
  },
}));
