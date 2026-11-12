#!/usr/bin/env node
// Build the Tauri desktop shell for one distribution channel.
//
//   node scripts/desktop-build.mjs <channel> [--app-version X.Y.Z] [--ci-debug-port N] [tauri build args]
//
// --app-version overrides the version in tauri.conf.json. CI uses it to build
// an "older release" from the same commit for the upgrade test.
// --ci-debug-port opens WebView2's remote debugging port so the CI smoke test
// can drive the game (scripts/desktop-smoke.mjs). Builds made with it say
// "CI test build" in the window title and must never be handed out.
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
function takeFlag(name, pattern, example) {
  const at = extra.indexOf(name);
  if (at < 0) return null;
  const value = extra[at + 1];
  extra.splice(at, 2);
  if (!pattern.test(value ?? "")) {
    console.error(`${name} needs a value like ${example}`);
    process.exit(2);
  }
  return value;
}
const appVersion = takeFlag("--app-version", /^\d+\.\d+\.\d+$/, "1.9.0");
const debugPort = takeFlag("--ci-debug-port", /^\d{4,5}$/, "9222");

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
const base = JSON.parse(readFileSync(join(tauriDir, "tauri.conf.json"), "utf8"));
// Arrays are replaced, not merged, so a changed window list is written out whole.
let windows = null;
const editWindows = (edit) => { windows = (windows ?? base.app.windows).map((w) => ({ ...w, ...edit(w) })); };

let overlay = {};
if (channel === "steam") {
  configArgs.push("--config", join(tauriDir, "tauri.steam.conf.json"));
} else if (channel === "desktop-preview") {
  overlay = JSON.parse(readFileSync(join(tauriDir, "tauri.preview.conf.json"), "utf8"));
  editWindows(() => ({ title: `Margin of Victory PREVIEW ${commit()}, not for distribution` }));
}
if (debugPort) {
  // wry's own defaults are replaced by this setting, so they are repeated here.
  editWindows((w) => ({
    title: `${w.title} (CI test build)`,
    additionalBrowserArgs: `--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --remote-debugging-port=${debugPort}`,
  }));
}
if (windows) overlay.app = { ...overlay.app, windows };
if (Object.keys(overlay).length > 0) {
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${channel}.conf.json`);
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
