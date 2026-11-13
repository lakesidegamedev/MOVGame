// Pictures of the Store panel from a production build, for review of Store
// changes. Prices, names and descriptions come from the live Lakeside catalog
// (fetched once here); the player's account is stood in for, so every state
// can be shown: signed out, a supporter, and the free access switch.
//
// Usage (with `npx vite preview --port 4173` serving dist/):
//   node scripts/store-panel-shots.mjs http://localhost:4173/ <output-dir>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , base = "http://localhost:4173/", out = "store-shots"] = process.argv;
mkdirSync(out, { recursive: true });

// The live catalog, as the game server would pass it on. Down means "unavailable", never a made-up price.
let catalog = { source: "unavailable", products: [] };
try {
  const res = await fetch("https://sim.ahousedividedgame.com/api/catalog", { signal: AbortSignal.timeout(15000) });
  if (res.ok) catalog = await res.json();
} catch (error) {
  console.error(`live catalog unavailable: ${error.message}`);
}
console.log(`catalog source: ${catalog.source}, ${catalog.products?.length ?? 0} products`);
const packIds = (catalog.products ?? []).map((p) => p.id).filter((id) => id !== "global");

const user = { id: "shots", username: "campaigner", email: "shots@example.com", ahdLinked: true };
const grant = (provider) => packIds.map((packId) => ({
  packId, packName: null, scenarioId: null, provider, amountCents: null, currency: null, status: "paid", createdAt: Date.UTC(2026, 10, 1),
}));
const STATES = {
  "signed-out": null,
  supporter: { unlocked: ["complete"], purchases: grant("supporter").filter((p) => p.packId === "complete") },
  "free-access": { unlocked: packIds, purchases: grant("free-access") },
};

const SHOTS = [
  ["store-desktop", "signed-out", { width: 1440, height: 1500 }, "?store"],
  ["store-phone", "signed-out", { width: 390, height: 1700 }, "?store"],
  ["pack-desktop", "signed-out", { width: 1440, height: 1300 }, "?store=canada"],
  ["store-supporter-desktop", "supporter", { width: 1440, height: 1100 }, "?store"],
  ["store-free-access-desktop", "free-access", { width: 1440, height: 1100 }, "?store"],
];

const browser = await chromium.launch();
try {
  for (const [name, stateName, viewport, query] of SHOTS) {
    const state = STATES[stateName];
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    if (state) {
      await context.addInitScript((u) => {
        localStorage.setItem("campaign_token", "shots-token");
        localStorage.setItem("campaign_user", JSON.stringify(u));
      }, user);
    }
    await context.route("**/api/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (path.endsWith("/api/catalog")) return json(catalog);
      if (path.endsWith("/api/auth/me") && state) {
        const scenarioIds = [];
        return json({ user, unlocked: { packIds: state.unlocked, scenarioIds } });
      }
      if (path.endsWith("/api/my-entitlements") && state) return json({ verified: true, purchases: state.purchases });
      if (path.endsWith("/api/auth/entitlements/refresh") && state) return json({ verified: true, unlocked: { packIds: state.unlocked, scenarioIds: [] } });
      if (path.endsWith("/api/daily")) return json({ date: "2026-11-13", scenarioId: "us-2016", seed: "shots", role: "dem", board: [] });
      return json({}, 404);
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.error(`[${name}] pageerror: ${e.message}`));
    await page.goto(base + query, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector(".store-overlay", { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(out, `after-${name}.jpg`), type: "jpeg", quality: 82 });
    console.log(`after-${name}.jpg`);
    await context.close();
  }
} finally {
  await browser.close();
}
