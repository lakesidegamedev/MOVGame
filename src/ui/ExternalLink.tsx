import type { MouseEvent, ReactNode } from "react";
import { inDesktopShell, openExternal } from "@lib/externalLink";

/**
 * A plain link to another site (the Lakeside store, account, support). A new
 * tab on the web; in the desktop app it opens in the system browser so the
 * game window stays put.
 */
export function ExternalLink({ href, className, children, label }: {
  href: string;
  className?: string;
  children: ReactNode;
  /** Accessible name when the visible text is not enough. */
  label?: string;
}) {
  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!inDesktopShell()) return;
    e.preventDefault();
    void openExternal(href);
  };
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={open} aria-label={label}>
      {children}
    </a>
  );
}
