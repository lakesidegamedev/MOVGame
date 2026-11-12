// The packaged desktop app (Tauri, apps/native/src-tauri) and what it tells the
// page. Tauri exposes its IPC on window.__TAURI_INTERNALS__; in a plain browser
// none of this exists and every helper here is a no-op.

export interface TauriInternals {
  invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
}

export function tauriInternals(): TauriInternals | null {
  if (typeof window === "undefined") return null;
  const internals = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;
  return internals && typeof internals.invoke === "function" ? internals : null;
}

/** True inside the packaged desktop shell. */
export function inDesktopShell(): boolean {
  return tauriInternals() !== null;
}

/**
 * Dispatched on window by the desktop shell whenever the game window gains
 * focus. WebView2 on Windows does not always pass window focus on to the page,
 * so code that reacts to the player coming back listens for this too.
 * Kept in step with SHELL_FOCUS_SCRIPT in apps/native/src-tauri/src/lib.rs.
 */
export const SHELL_FOCUS_EVENT = "mov-shell-focus";

/**
 * The launcher sign-in code the desktop app was started with
 * (LAKESIDE_HANDOFF_CODE), handed over once: a string when the launcher passed
 * one (possibly malformed, the caller checks), null otherwise, including in a
 * browser and in shells too old to know the command.
 */
export async function takeShellLauncherCode(): Promise<string | null> {
  const tauri = tauriInternals();
  if (!tauri) return null;
  try {
    const code = await tauri.invoke("take_launcher_code");
    return typeof code === "string" ? code : null;
  } catch {
    return null;
  }
}
