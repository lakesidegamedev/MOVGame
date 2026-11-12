#!/usr/bin/env node
// Drive a packaged desktop build through real clicks, for CI smoke tests.
//
//   node desktop-smoke.mjs <step> --cdp http://127.0.0.1:9222 --out <dir>
//   node desktop-smoke.mjs <step> --local http://tauri.localhost:4173/ --out <dir>
//
// --cdp attaches to the running app's WebView2 (Windows only: launch the app
// with WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222).
// The app under test is the shipped build; nothing in it knows it is being
// driven. --local opens a built web bundle in Chromium with a stand-in for the
// Tauri bridge, for working on this script without a Windows machine.
//
// Steps:
//   play      landing, Play free, setup wizard, Begin, end week one, clear the
//             week's modals, and check the desk shows a later week.
//   resume    landing must offer "Resume US campaign · Week N" (N >= 2); click
//             it and check the desk opens on that week.
//   paid      preview builds only: start an election that is paid elsewhere
//             and reach week two.
//   checkout  desktop-direct only: answer the game server with a signed-in,
//             linked test account (nothing reaches the real server), press Buy
//             on the US pack, check the opener plugin was asked to open the
//             Lakeside checkout URL, mark the pack owned, bring the window back
//             and check the Store unlocks it. No payment is made.
//   scope     the opener must refuse a URL outside its allow list.
//
// Every step writes <out>/<step>-*.png and prints one RESULT line as JSON.
// Exit code 0 means every assertion held.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(here, "../../../package.json"));
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const step = args[0];
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const cdp = opt("--cdp");
const local = opt("--local");
const out = resolve(opt("--out") ?? ".");
// Shell commands (run with pwsh on Windows, sh elsewhere) that send the app
// window away and bring it back, for the checkout step.
const blurCmd = opt("--blur-cmd");
const focusCmd = opt("--focus-cmd");
const runCmd = (cmd) => {
  try {
    execFileSync(process.platform === "win32" ? "pwsh" : "sh", process.platform === "win32" ? ["-NoProfile", "-Command", cmd] : ["-c", cmd], { stdio: "inherit", timeout: 30_000 });
  } catch (e) { log("command failed:", e.message); }
};
mkdirSync(out, { recursive: true });

const API = "https://sim.ahousedividedgame.com";
const CHECKOUT_PREFIX = "https://lakesidegames.net/account/checkout?game=electioneer&product=";
const BUY_PACK = "us-historical";
const COUNTRY_PACK_IDS = ["us-historical", "uk-elections", "canada", "germany", "france", "australia",
  "new-zealand", "brazil", "india", "spain", "ireland", "japan", "italy", "mexico"];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${step}]`, ...a);
const result = { step, ok: false, checks: {} };
const check = (name, value, detail) => {
  result.checks[name] = detail === undefined ? !!value : { ok: !!value, detail };
  log(`${value ? "PASS" : "FAIL"} ${name}${detail === undefined ? "" : `: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`}`);
  return !!value;
};

let browser;
let page;
if (cdp) {
  browser = await chromium.connectOverCDP(cdp, { timeout: 30_000 });
  const pages = browser.contexts().flatMap((c) => c.pages());
  page = pages.find((p) => /tauri\.localhost|^tauri:/.test(p.url())) ?? pages[0];
  if (!page) throw new Error("no page in the app's web view");
} else if (local) {
  // A profile directory keeps storage between steps, like the app's own data folder.
  browser = await chromium.launchPersistentContext(opt("--profile") ?? join(out, ".profile"), {
    args: ["--host-resolver-rules=MAP tauri.localhost 127.0.0.1"], viewport: { width: Number(opt("--width") ?? 1280), height: Number(opt("--height") ?? 800) },
  });
  page = browser.pages()[0] ?? await browser.newPage();
  // Stand-in for the Tauri bridge: records invoke calls, allows the same URLs
  // as src-tauri/capabilities/default.json.
  await page.addInitScript(() => {
    const allowed = [/^https:\/\/lakesidegames\.net\//, /^https:\/\/sim\.ahousedividedgame\.com\//];
    // Read-only invoke, the way Tauri's own bridge script defines it.
    window.__TAURI_INTERNALS__ = {};
    Object.defineProperty(window.__TAURI_INTERNALS__, "invoke", {
      value: async (cmd, a) => {
        if (cmd === "plugin:opener|open_url" && !allowed.some((r) => r.test(a?.url ?? ""))) throw new Error("not allowed by scope");
        return null;
      },
    });
  });
  await page.goto(local);
} else {
  console.error("Pass --cdp <url> or --local <url>");
  process.exit(2);
}
page.on("pageerror", (e) => log("pageerror:", e.message));
page.on("dialog", (d) => void d.accept());

let shotN = 0;
const shot = async (name) => {
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  const path = join(out, `${step}-${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path }).catch((e) => log("screenshot failed:", e.message));
  return path;
};
const text = () => page.evaluate(() => document.body.innerText);
const deskWeek = async () => (await text()).match(/Week of ([A-Z][a-z]+\.? \d+)/)?.[1] ?? null;

async function clickText(selector, re, timeout = 15_000) {
  const loc = page.locator(selector, { hasText: re }).locator("visible=true").first();
  await loc.waitFor({ state: "visible", timeout });
  await loc.click();
  await wait(700);
}

async function landing() {
  await page.locator(".landing").first().waitFor({ state: "visible", timeout: 45_000 });
  await wait(1500);
}

// From wherever the page is (the previous step may have left it on the desk),
// back to the landing page.
async function toLanding() {
  if (await page.locator(".landing").first().isVisible().catch(() => false)) return landing();
  const home = page.locator("button", { hasText: /^\s*Home\s*$/ }).locator("visible=true").first();
  if (await home.isVisible().catch(() => false)) await home.click();
  return landing();
}

async function clearOverlays() {
  for (let i = 0; i < 10; i++) {
    const did = await page.evaluate(() => {
      const visible = (el) => el && el.offsetParent !== null;
      const choice = [...document.querySelectorAll(".overlay button.choice:not(:disabled)")].find(visible);
      if (choice) { choice.click(); return "choice"; }
      const cont = [...document.querySelectorAll(".overlay button.primary:not(:disabled)")].find(visible);
      if (cont) { cont.click(); return "continue"; }
      return null;
    });
    if (!did) return;
    await wait(700);
  }
}

// From the setup screen's first page: walk the wizard and begin.
async function setupAndBegin() {
  for (let i = 0; i < 6; i++) {
    const next = page.locator("button.su-next").first();
    await next.waitFor({ state: "visible", timeout: 15_000 });
    const label = (await next.innerText()).trim();
    await next.click();
    await wait(900);
    if (/^Begin/i.test(label)) return label;
  }
  throw new Error("setup wizard never offered Begin");
}

// On the desk, week one: skip the tour, plan one action, end the week.
async function playOneWeek() {
  await page.locator("button.desk-endweek").first().waitFor({ state: "visible", timeout: 30_000 });
  const skip = page.locator("button.coach-skip").first();
  if (await skip.isVisible().catch(() => false)) { await skip.click(); await wait(500); }
  const before = await deskWeek();
  const add = page.locator("button.plan-add").first();
  if (await add.isVisible().catch(() => false)) { await add.click(); await wait(400); }
  await page.locator("button.desk-endweek:not(:disabled)").first().click();
  await wait(1500);
  await shot("week-review");
  await clearOverlays();
  await wait(800);
  const after = await deskWeek();
  return { before, after };
}

try {
  if (step === "play") {
    await toLanding();
    await shot("landing");
    await clickText("button", /^\s*Play free\s*$/);
    await shot("setup");
    const begin = await setupAndBegin();
    check("began", true, begin);
    await wait(1500);
    await shot("week-one");
    const { before, after } = await playOneWeek();
    await shot("week-two");
    check("week two reached", before && after && before !== after, `${before} -> ${after}`);
    // Let the autosave reach IndexedDB and localStorage before anyone closes the window.
    await wait(2500);
    const saved = await page.evaluate(() => localStorage.getItem("campaign-us-session-autosave") !== null);
    check("autosave written", saved);
  } else if (step === "resume") {
    await toLanding();
    await shot("landing");
    const body = await text();
    const m = body.match(/Resume US campaign · Week (\d+)/);
    check("resume offered", m && Number(m[1]) >= 2, m ? m[0] : "no Resume button on the landing page");
    const dbSaves = await page.evaluate(() => new Promise((res) => {
      const req = indexedDB.open("campaign-2020");
      req.onerror = () => res(-1);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction("saves", "readonly");
          const c = tx.objectStore("saves").count();
          c.onsuccess = () => res(c.result);
          c.onerror = () => res(-1);
        } catch { res(-1); }
      };
    }));
    check("IndexedDB saves", dbSaves >= 1, `${dbSaves} save(s) in campaign-2020`);
    if (m) {
      await clickText("button", /^Resume US campaign/);
      await page.locator("button.desk-endweek").first().waitFor({ state: "visible", timeout: 30_000 });
      await wait(1500);
      await clearOverlays();
      const week = await deskWeek();
      await shot("resumed-desk");
      check("resumed on a later week", week && !/Sept? 1$/.test(week), week);
    }
  } else if (step === "paid") {
    await toLanding();
    await clickText("button", /^\s*Play free\s*$/);
    // 2016 is in the paid US pack everywhere but the preview.
    await clickText("button.election-tile", /2016/);
    await shot("setup-2016");
    const locked = await page.locator("button.election-tile.locked").count();
    check("no locked elections in the preview", locked === 0, `${locked} locked tiles`);
    const begin = await setupAndBegin();
    check("began a paid election", /2016/.test(begin), begin);
    await wait(1500);
    const { before, after } = await playOneWeek();
    await shot("week-two");
    check("week two reached", before && after && before !== after, `${before} -> ${after}`);
  } else if (step === "checkout") {
    const state = { owned: false, refreshAt: [], api: [] };
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
    const user = { id: "smoke-user", username: "smoke", email: "smoke@example.invalid", ahdLinked: true };
    const unlocked = () => ({ scenarioIds: [], packIds: state.owned ? [BUY_PACK] : [] });
    await page.route(`${API}/**`, async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      state.api.push(`${req.method()} ${path}`);
      const json = (status, body) => route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (path === "/api/auth/me") return json(200, { user, unlocked: unlocked() });
      if (path === "/api/catalog") {
        return json(200, {
          source: "platform",
          products: [...COUNTRY_PACK_IDS.map((id) => ({ id, name: id, priceCents: 99, scenarios: [], listed: true })),
            { id: "complete", name: "Complete Collection", priceCents: 399, scenarios: [], listed: true }],
        });
      }
      if (path === "/api/auth/entitlements/refresh") { state.refreshAt.push(Date.now()); return json(200, { verified: true, unlocked: unlocked() }); }
      if (path === "/api/my-entitlements") {
        return json(200, { verified: true, purchases: state.owned ? [{ packId: BUY_PACK, packName: "United States", scenarioId: null, provider: "stripe", amountCents: 99, currency: "usd", status: "paid", createdAt: Date.now() }] : [] });
      }
      return json(404, { error: "not in smoke mock" });
    });
    await page.evaluate((u) => {
      localStorage.setItem("campaign_token", "smoke-token");
      localStorage.setItem("campaign_user", JSON.stringify(u));
    }, user);
    // Reload so the app reads the session, starting from the landing page
    // rather than whatever screen the last step left in the history entry.
    await page.evaluate(() => window.history.replaceState({ movView: { kind: "landing" } }, "", "/"));
    await page.reload();
    await toLanding();
    // Wrap the bridge so the call and its outcome are recorded, then hand it on.
    // Tauri may define invoke as read-only; then the bridge object is replaced
    // by one that inherits everything else from it.
    const wrapMode = await page.evaluate(() => {
      const t = window.__TAURI_INTERNALS__;
      window.__smokeInvokes = [];
      if (!t) return "no bridge";
      const real = t.invoke.bind(t);
      const wrapped = (cmd, a, o) => {
        const rec = { cmd, args: a, at: Date.now(), outcome: "pending" };
        if (String(cmd).startsWith("plugin:opener")) window.__smokeInvokes.push(rec);
        const p = real(cmd, a, o);
        Promise.resolve(p).then(() => { rec.outcome = "resolved"; }, (e) => { rec.outcome = `rejected: ${e?.message ?? e}`; });
        return p;
      };
      try { t.invoke = wrapped; } catch { /* read-only */ }
      if (window.__TAURI_INTERNALS__.invoke === wrapped) return "assigned";
      try {
        const shim = Object.create(t);
        Object.defineProperty(shim, "invoke", { value: wrapped });
        window.__TAURI_INTERNALS__ = shim;
      } catch { /* fall through */ }
      return window.__TAURI_INTERNALS__.invoke === wrapped ? "replaced" : "not wrapped";
    });
    log("bridge wrap:", wrapMode);
    // Second witness: the IPC request itself (Windows sends it to http://ipc.localhost).
    const ipcRequests = [];
    page.on("requestfinished", async (r) => {
      if (!/ipc\.localhost|^ipc:/.test(r.url())) return;
      const res = await r.response().catch(() => null);
      ipcRequests.push({ url: decodeURIComponent(r.url()), body: r.postData() ?? "", status: res?.status() ?? null });
    });

    await clickText("button", /^Store$/);
    await wait(1500);
    await shot("store");
    await clickText(".store-overlay button, .store-overlay [role=button]", /United States/);
    await wait(1000);
    await shot("us-pack");
    const hint = (await text()).includes("Checkout opens in your browser, and this window keeps your place.");
    check("signed-in linked hint shown", hint);
    await page.locator(".store-overlay button.primary:not(:disabled)", { hasText: /^Buy/ }).first().click();
    await wait(2500);
    await shot("checkout-open");
    const invokes = await page.evaluate(() => window.__smokeInvokes ?? []);
    const call = invokes.find((c) => c.cmd === "plugin:opener|open_url");
    const ipc = ipcRequests.find((r) => /plugin:opener\|open_url/.test(r.url));
    const expected = `${CHECKOUT_PREFIX}${BUY_PACK}`;
    const calledWith = call?.args?.url ?? (ipc ? (() => { try { return JSON.parse(ipc.body).url; } catch { return ipc.body; } })() : null);
    check("opener called with checkout URL", calledWith === expected, calledWith ?? `no opener call (bridge ${wrapMode}, ipc ${JSON.stringify(ipcRequests)})`);
    const outcome = call?.outcome ?? (ipc ? `ipc status ${ipc.status}` : "none");
    check("opener call succeeded", outcome === "resolved" || (ipc && ipc.status === 200), outcome);
    check("banner says checkout is open", (await text()).includes("Checkout is open in your browser"));
    log("ipc requests:", JSON.stringify(ipcRequests));
    writeFileSync(join(out, "checkout-opened-url.txt"), `${calledWith ?? ""}\n`);

    // The player leaves for the browser (the window is minimised), pays, and
    // comes back. Timed checks are at least 4 s apart (DESKTOP_WATCH), so a
    // check less than 3.5 s after the one before it comes from the window
    // coming back, not from the timer.
    if (blurCmd) runCmd(blurCmd);
    const seen = state.refreshAt.length;
    const until = Date.now() + 20_000;
    while (state.refreshAt.length === seen && Date.now() < until) await wait(100);
    state.owned = true;
    const focusAt = Date.now();
    if (focusCmd) runCmd(focusCmd);
    else await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const restoredAt = Date.now();
    let unlockedAt = null;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if ((await text()).includes("United States unlocked")) { unlockedAt = Date.now(); break; }
      await wait(250);
    }
    await shot("unlocked");
    const checks = state.refreshAt.map((t) => t - focusAt);
    const early = state.refreshAt.some((t, i) => t >= focusAt && i > 0 && t - state.refreshAt[i - 1] < 3_500);
    check("purchase picked up", unlockedAt !== null, unlockedAt ? `${unlockedAt - restoredAt} ms after the window came back` : "no unlock within 30 s");
    result.focus = {
      windowCommands: !!focusCmd,
      restoreTookMs: restoredAt - focusAt,
      checksRelativeToRestoreStartMs: checks,
      unlockedAfterRestoreMs: unlockedAt ? unlockedAt - restoredAt : null,
      pickedUpByWindowReturn: early,
    };
    log("focus timing:", JSON.stringify(result.focus));
    result.api = state.api;
    // Leave no test session behind in the app's storage.
    await page.evaluate(() => { localStorage.removeItem("campaign_token"); localStorage.removeItem("campaign_user"); });
  } else if (step === "scope") {
    const outcome = await page.evaluate(async () => {
      const t = window.__TAURI_INTERNALS__;
      if (!t) return "no bridge";
      try { await t.invoke("plugin:opener|open_url", { url: "https://example.com/" }); return "resolved"; }
      catch (e) { return `rejected: ${e?.message ?? e}`; }
    });
    check("opener refuses a URL outside the allow list", outcome.startsWith("rejected"), outcome);
  } else {
    throw new Error(`unknown step ${step}`);
  }
  result.ok = Object.values(result.checks).every((c) => (typeof c === "object" ? c.ok : c));
} catch (e) {
  result.error = e.message;
  log("ERROR", e.stack ?? e.message);
  await shot("error");
}
console.log(`RESULT ${JSON.stringify(result)}`);
writeFileSync(join(out, `${step}-result.json`), JSON.stringify(result, null, 2));
// With --cdp, exit without browser.close(): the app keeps running and the
// caller closes it the way a player would.
if (!cdp) await browser.close();
process.exit(result.ok ? 0 : 1);
