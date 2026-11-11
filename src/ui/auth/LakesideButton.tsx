import { lakesideLoginUrl } from "@lib/api";
import { DISTRIBUTION } from "@lib/distribution";
import { openExternal } from "@lib/externalLink";
import { BRAND } from "../../brand";

/** The packaged desktop window cannot be sent to Lakeside and brought back. */
const SIGN_IN_IN_WINDOW = DISTRIBUTION.checkout !== "system-browser";

// "Sign in with Lakeside Games" door. Always drives
// sim.ahousedividedgame.com/api/lakeside/login (which bounces through the
// lakeside-auth broker) and returns to the current page with a one-time code,
// so it works from both sim.* and the lakesidegames.net mount. In the desktop
// app there is no page to return to, so signing in is not offered there; an
// account that needs linking is linked once in the browser (`linkOnly`).
export function LakesideButton({ linkOnly = false }: { linkOnly?: boolean }) {
  if (!SIGN_IN_IN_WINDOW) {
    if (!linkOnly) return null;
    return (
      <button type="button" className="lakeside-btn" onClick={() => void openExternal(BRAND.url)}>
        <img src="lakeside-mark.svg" alt="" width={22} height={22} />
        <span>
          <strong>Link your Lakeside Games account</strong>
          <small>Opens the game site in your browser. Log in there with this account, then choose Sign in with Lakeside Games.</small>
        </span>
      </button>
    );
  }
  return (
    <a className="lakeside-btn" href={lakesideLoginUrl()}>
      <img src="lakeside-mark.svg" alt="" width={22} height={22} />
      <span>
        <strong>Sign in with Lakeside Games</strong>
        <small>Your Lakeside Games account, one click, no new password</small>
      </span>
    </a>
  );
}

/** Hairline "or" divider between the Lakeside door and the local form. */
export function AuthDivider() {
  if (!SIGN_IN_IN_WINDOW) return null;
  return (
    <div className="auth-divider" role="separator">
      <span>or use email</span>
    </div>
  );
}
