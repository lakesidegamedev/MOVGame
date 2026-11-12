export type DistributionChannel = "web" | "desktop-direct" | "steam" | "ios" | "android" | "desktop-preview";

export interface DistributionPolicy {
  channel: DistributionChannel;
  externalStore: boolean;
  nativeStoreName: string | null;
  /**
   * Where Lakeside checkout and sign-in pages open. "window" navigates the game
   * window (the page comes back with a result in the URL). "system-browser"
   * opens the user's browser and leaves the game window alone, because a
   * packaged desktop window cannot be sent away and brought back. null when the
   * channel never shows Lakeside checkout.
   */
  checkout: "window" | "system-browser" | null;
  /**
   * Internal test build of an unreleased version: every election is playable
   * without a purchase, Buy is off, and no score reaches a public leaderboard.
   * Only true when previewBuild() agrees; see below.
   */
  preview: boolean;
}

const POLICIES: Record<DistributionChannel, DistributionPolicy> = {
  web: { channel: "web", externalStore: true, nativeStoreName: null, checkout: "window", preview: false },
  "desktop-direct": { channel: "desktop-direct", externalStore: true, nativeStoreName: null, checkout: "system-browser", preview: false },
  steam: { channel: "steam", externalStore: false, nativeStoreName: "Steam", checkout: null, preview: false },
  ios: { channel: "ios", externalStore: false, nativeStoreName: "App Store", checkout: null, preview: false },
  android: { channel: "android", externalStore: false, nativeStoreName: "Google Play", checkout: null, preview: false },
  "desktop-preview": { channel: "desktop-preview", externalStore: true, nativeStoreName: null, checkout: null, preview: true },
};

export const PREVIEW_CHANNEL = "desktop-preview";

/**
 * The preview unlock needs two independent build inputs to agree: the Vite
 * mode (`--mode desktop-preview`, set only by the preview desktop build) and
 * the channel variable that mode's env file sets. A stray channel variable on
 * a web, desktop-direct or Steam build, or a preview env file loaded by some
 * other mode, both fall back to the web policy.
 */
export function previewBuild(channel: string | undefined, mode: string | undefined): boolean {
  return channel?.toLowerCase() === PREVIEW_CHANNEL && mode === PREVIEW_CHANNEL;
}

export function distributionPolicy(value?: string, mode?: string): DistributionPolicy {
  const channel = value?.toLowerCase() as DistributionChannel | undefined;
  if (channel === PREVIEW_CHANNEL && !previewBuild(value, mode)) return POLICIES.web;
  return channel && channel in POLICIES ? POLICIES[channel] : POLICIES.web;
}

export const DISTRIBUTION = distributionPolicy(import.meta.env.VITE_DISTRIBUTION_CHANNEL, import.meta.env.MODE);

/** Short commit the build was made from (set in vite.config.ts). */
export const BUILD_COMMIT: string = import.meta.env.VITE_RELEASE ?? "unknown";

/** Shown where a score would be posted, in the preview build. */
export const PREVIEW_SCORE_NOTE = "Preview build: scores are not posted to the leaderboards";
