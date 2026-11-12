// The Lakeside launcher opens the web game as <game url>#launcher_code=<code>.
// The code rides in the fragment so it never reaches a server log or a Referer
// header; the SPA reads it once, removes it from the address bar, and posts it
// to the server, which redeems it with the platform.
//
// The installed desktop app gets the same kind of code from the launcher in
// its environment (LAKESIDE_HANDOFF_CODE). The shell hands it to the page once
// (takeShellLauncherCode) and from there it takes the same path.

const KEY = "launcher_code";
const CODE_RE = /^[A-Za-z0-9_-]{16,128}$/;

export interface TakenLauncherCode {
  /** The code when the fragment carried a well-formed one, else null. */
  code: string | null;
  /** The fragment with launcher_code removed ("" when nothing is left). */
  hash: string;
  /** Whether the fragment carried launcher_code at all, valid or not. */
  present: boolean;
}

/** Pull launcher_code out of a location.hash value such as "#launcher_code=abc". */
export function takeLauncherCode(hash: string): TakenLauncherCode {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.includes(`${KEY}=`)) return { code: null, hash, present: false };
  const params = new URLSearchParams(raw);
  const value = params.get(KEY);
  params.delete(KEY);
  const rest = params.toString();
  return {
    code: value && CODE_RE.test(value) ? value : null,
    hash: rest ? `#${rest}` : "",
    present: true,
  };
}

/**
 * A code the desktop shell handed over (`raw` null when it had none), in the
 * same shape takeLauncherCode returns. `hash` passes through untouched.
 */
export function shellLauncherCode(raw: string | null, hash: string): TakenLauncherCode {
  if (raw === null) return { code: null, hash, present: false };
  const code = raw.trim();
  return { code: CODE_RE.test(code) ? code : null, hash, present: true };
}
