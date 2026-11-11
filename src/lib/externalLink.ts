// Open a page in the user's own browser.
//
// The packaged desktop app (Tauri) cannot send its game window to a payment
// page and bring it back, so Lakeside checkout opens in the system browser and
// the game picks the purchase up when the player returns. Tauri exposes its IPC
// on window.__TAURI_INTERNALS__; the opener plugin registers the
// `plugin:opener|open_url` command (see apps/native/src-tauri). In a plain
// browser the same call is a new tab.

interface TauriInternals {
  invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
}

function tauriInternals(): TauriInternals | null {
  if (typeof window === "undefined") return null;
  const internals = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;
  return internals && typeof internals.invoke === "function" ? internals : null;
}

/** True inside the packaged desktop shell. */
export function inDesktopShell(): boolean {
  return tauriInternals() !== null;
}

/**
 * Open `url` outside the game window. Resolves true when the browser was asked
 * to open it, false when nothing could be launched (the caller then shows the
 * link so the player can open it by hand).
 */
export async function openExternal(url: string): Promise<boolean> {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const tauri = tauriInternals();
  if (tauri) {
    try {
      await tauri.invoke("plugin:opener|open_url", { url: parsed.toString() });
      return true;
    } catch {
      return false;
    }
  }
  if (typeof window === "undefined") return false;
  // No "noopener" feature: it makes window.open return null even on success, so
  // a blocked popup would be indistinguishable. Detach the opener by hand.
  const opened = window.open(parsed.toString(), "_blank");
  if (!opened) return false;
  try { opened.opener = null; } catch { /* cross-origin already */ }
  return true;
}
