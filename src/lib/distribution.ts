export type DistributionChannel = "web" | "desktop-direct" | "steam" | "ios" | "android";

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
}

const POLICIES: Record<DistributionChannel, DistributionPolicy> = {
  web: { channel: "web", externalStore: true, nativeStoreName: null, checkout: "window" },
  "desktop-direct": { channel: "desktop-direct", externalStore: true, nativeStoreName: null, checkout: "system-browser" },
  steam: { channel: "steam", externalStore: false, nativeStoreName: "Steam", checkout: null },
  ios: { channel: "ios", externalStore: false, nativeStoreName: "App Store", checkout: null },
  android: { channel: "android", externalStore: false, nativeStoreName: "Google Play", checkout: null },
};

export function distributionPolicy(value?: string): DistributionPolicy {
  const channel = value?.toLowerCase() as DistributionChannel | undefined;
  return channel && channel in POLICIES ? POLICIES[channel] : POLICIES.web;
}

export const DISTRIBUTION = distributionPolicy(import.meta.env.VITE_DISTRIBUTION_CHANNEL);
