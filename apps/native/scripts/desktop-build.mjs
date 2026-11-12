#!/usr/bin/env node
// Build the Tauri desktop shell for one distribution channel.
//
//   node scripts/desktop-build.mjs <desktop-direct|steam|desktop-preview> [--app-version X.Y.Z] [tauri build args]
//
// --app-version overrides the version in tauri.conf.json. CI uses it to build
// an "older release" from the same commit for the upgrade test.
// desktop-direct uses tauri.conf.json as is. steam adds tauri.steam.conf.json.
// desktop-preview writes a config overlay with its own identifier (so its saves
// live apart from a real install) and a window title that names the commit.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tauriDir = join(root, "src-tauri");
const channel = process.argv[2];
const extra = process.argv.slice(3);
let appVersion = null;
const versionAt = extra.indexOf("--app-version");
if (versionAt >= 0) {
  appVersion = extra[versionAt + 1];
  extra.splice(versionAt, 2);
  if (!/^\d+\.\d+\.\d+$/.test(appVersion ?? "")) {
    console.error("--app-version needs a version like 1.9.0");
    process.exit(2);
  }
}

const CHANNELS = ["desktop-direct", "steam", "desktop-preview"];
if (!CHANNELS.includes(channel)) {
  console.error(`Usage: desktop-build.mjs <${CHANNELS.join("|")}> [tauri build args]`);
  process.exit(2);
}

function commit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root }).toString().trim();
  } catch {
    return "unknown";
  }
}

const configArgs = [];
const outDir = join(tauriDir, "target");
if (channel === "steam") {
  configArgs.push("--config", join(tauriDir, "tauri.steam.conf.json"));
} else if (channel === "desktop-preview") {
  const base = JSON.parse(readFileSync(join(tauriDir, "tauri.conf.json"), "utf8"));
  const overlay = JSON.parse(readFileSync(join(tauriDir, "tauri.preview.conf.json"), "utf8"));
  // Arrays are replaced, not merged, so the whole window list is written out.
  overlay.app = {
    ...overlay.app,
    windows: base.app.windows.map((w) => ({
      ...w,
      title: `Margin of Victory PREVIEW ${commit()}, not for distribution`,
    })),
  };
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "desktop-preview.conf.json");
  writeFileSync(out, JSON.stringify(overlay, null, 2));
  configArgs.push("--config", out);
}

if (appVersion) {
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "desktop-version.conf.json");
  writeFileSync(out, JSON.stringify({ version: appVersion }, null, 2));
  configArgs.push("--config", out);
}

const cli = join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");
if (!existsSync(cli)) {
  console.error("Tauri CLI missing: run npm ci in apps/native first");
  process.exit(1);
}
const result = spawnSync(process.execPath, [cli, "build", ...configArgs, ...extra], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
