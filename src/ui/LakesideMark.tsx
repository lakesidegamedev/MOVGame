import type { MouseEvent } from "react";
import { inDesktopShell, openExternal } from "@lib/externalLink";

export const LAKESIDE_URL = "https://lakesidegames.net/";

/**
 * The small Lakeside Games mark for the top bar, linking to the studio's site.
 * A plain link (keyboard reachable, new tab) on the web; in the desktop app the
 * page opens in the system browser so the game window stays put.
 */
export function LakesideMark({ className = "", label = true }: { className?: string; label?: boolean }) {
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!inDesktopShell()) return;
    e.preventDefault();
    void openExternal(LAKESIDE_URL);
  };
  return (
    <a
      className={`lakeside-mark${className ? ` ${className}` : ""}`}
      href={LAKESIDE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={open}
      aria-label="Lakeside Games website (opens in a new tab)"
      title="Lakeside Games"
    >
      <img src="lakeside-mark.svg" alt="" width={18} height={18} />
      {label && <span className="lakeside-mark-label">Lakeside Games</span>}
    </a>
  );
}
