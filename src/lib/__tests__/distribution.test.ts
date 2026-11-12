import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DISTRIBUTION, distributionPolicy, previewBuild } from "../distribution";

describe("distributionPolicy", () => {
  it("allows Lakeside commerce on web and direct desktop builds", () => {
    expect(distributionPolicy("web").externalStore).toBe(true);
    expect(distributionPolicy("desktop-direct").externalStore).toBe(true);
  });

  it.each([
    ["steam", "Steam"],
    ["ios", "App Store"],
    ["android", "Google Play"],
  ])("keeps external checkout out of %s builds", (channel, store) => {
    expect(distributionPolicy(channel)).toMatchObject({
      externalStore: false,
      nativeStoreName: store,
    });
  });

  it("opens checkout in the system browser on direct desktop, in the window on the web, and nowhere else", () => {
    expect(distributionPolicy("desktop-direct").checkout).toBe("system-browser");
    expect(distributionPolicy("web").checkout).toBe("window");
    for (const channel of ["steam", "ios", "android"]) expect(distributionPolicy(channel).checkout).toBeNull();
  });

  it("fails safely to web for missing or unknown build values", () => {
    expect(distributionPolicy()).toEqual(distributionPolicy("web"));
    expect(distributionPolicy("unknown")).toEqual(distributionPolicy("web"));
  });
});

describe("preview channel", () => {
  const RELEASE_CHANNELS = ["web", "desktop-direct", "steam", "ios", "android"];
  const MODES = [undefined, "production", "development", "test", "desktop-direct", "steam", "ios", "android", "desktop-preview"];

  it("unlocks only when the Vite mode and the channel both say desktop-preview", () => {
    expect(previewBuild("desktop-preview", "desktop-preview")).toBe(true);
    expect(distributionPolicy("desktop-preview", "desktop-preview")).toMatchObject({ preview: true, checkout: null });
    for (const mode of MODES.filter((m) => m !== "desktop-preview")) {
      expect(previewBuild("desktop-preview", mode)).toBe(false);
      expect(distributionPolicy("desktop-preview", mode)).toEqual(distributionPolicy("web"));
    }
  });

  it("is never on for a release channel, whatever the mode", () => {
    for (const channel of [...RELEASE_CHANNELS, undefined, "unknown", "preview"]) {
      for (const mode of MODES) {
        expect(previewBuild(channel, mode)).toBe(false);
        expect(distributionPolicy(channel, mode).preview).toBe(false);
      }
    }
  });

  it("is off in the build the tests run under", () => {
    expect(DISTRIBUTION.preview).toBe(false);
  });

  it("is selected by no committed env file except the preview mode's own", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const files = readdirSync(root).filter((f) => f === ".env" || f.startsWith(".env."));
    expect(files).toContain(".env.desktop-preview");
    for (const file of files) {
      const text = readFileSync(join(root, file), "utf8");
      if (file === ".env.desktop-preview") {
        expect(text).toMatch(/^VITE_DISTRIBUTION_CHANNEL=desktop-preview$/m);
      } else {
        expect(text, file).not.toMatch(/desktop-preview/);
      }
    }
  });

  it("is built only by the preview Tauri config, which uses its own app identifier", () => {
    const tauri = resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/native/src-tauri");
    const read = (f: string) => JSON.parse(readFileSync(join(tauri, f), "utf8"));
    expect(read("tauri.conf.json").build.beforeBuildCommand).toBe("node scripts/fetch-web.mjs desktop-direct");
    expect(read("tauri.steam.conf.json").build.beforeBuildCommand).toBe("node scripts/fetch-web.mjs steam");
    const preview = read("tauri.preview.conf.json");
    expect(preview.build.beforeBuildCommand).toBe("node scripts/fetch-web.mjs desktop-preview");
    expect(preview.identifier).toBe(`${read("tauri.conf.json").identifier}.preview`);
  });
});
