import * as Sentry from "@sentry/browser";
import type { DistributionChannel } from "./distribution";

// Error reporting (Sentry). Errors only: no performance spans, no replays, no
// personal data. One build-time setting, VITE_SENTRY_DSN, shared by the web,
// desktop and app builds; CI fills it from the MOV_SENTRY_DSN secret. Empty or
// absent means nothing is ever sent (local dev, tests, forks).

/** Hash that sends one test error from a live build. See docs/error-reporting.md. */
export const SENTRY_TEST_HASH = "#sentry-test";

/** Sentry environment for a build: the web game is "production", every other build is named after its channel. */
export function sentryEnvironment(channel: DistributionChannel): string {
  return channel === "web" ? "production" : channel;
}

/** Release name: app version plus the commit it was built from, for example "2.0.0+e8fe5ee". */
export function sentryRelease(version: string | undefined, commit: string | undefined): string {
  return `${version || "0.0.0"}+${commit || "unknown"}`;
}

export function reportingEnabled(dsn: string | undefined): dsn is string {
  return typeof dsn === "string" && dsn.trim().length > 0;
}

/**
 * Start Sentry when the build has a DSN. Returns whether it started. When the
 * page was opened with #sentry-test, sends one test error and removes the hash
 * so a reload does not send another.
 */
export function initErrorReporting(opts: {
  dsn: string | undefined;
  channel: DistributionChannel;
  version: string | undefined;
  commit: string | undefined;
}): boolean {
  if (!reportingEnabled(opts.dsn)) return false;
  const environment = sentryEnvironment(opts.channel);
  const release = sentryRelease(opts.version, opts.commit);
  Sentry.init({
    dsn: opts.dsn.trim(),
    environment,
    release,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  if (typeof window !== "undefined" && window.location.hash === SENTRY_TEST_HASH) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    const id = Sentry.captureException(new Error(`Sentry test error (${environment} ${release})`));
    console.info(`Sentry test error sent: ${id}`);
  }
  return true;
}
