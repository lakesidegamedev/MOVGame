// Captures every main web game screen at phone, tablet and desktop sizes.
//
// Usage (with `npm run dev` already running):
//   node scripts/ui-screenshots.mjs <base-url> <output-dir> [phone,tablet,desktop] [screen-filter] [sections]
// sections: all, or a comma list of landing,setup,us,uk,de,leaderboard
//
// Game state is driven through the dev server's own store modules, so the
// shots show real engine output (seeded) rather than mock data.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , base = "http://localhost:5173/", out = "shots", which = "phone,tablet,desktop", filter = "", sections = "all"] = process.argv;
const want = (name) => sections === "all" || sections.split(",").includes(name);

const VIEWPORTS = {
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};

const COACH_KEYS = ["coach-done-v1", "coach-done-uk-v1", "coach-done-de-v1", "coach-done-ca-v1", "coach-done-fr-v1", "coach-done-au-v1"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(name, opts) {
  const dir = join(out, name);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...opts, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  await context.addInitScript((keys) => {
    for (const k of keys) localStorage.setItem(k, "1");
  }, COACH_KEYS);
  const page = await context.newPage();
  page.on("dialog", (d) => void d.accept());
  page.on("pageerror", (e) => console.error(`[${name}] pageerror: ${e.message}`));

  // Waits for lazy chunks and loading spinners to finish (the host may be busy).
  const settle = async () => {
    await wait(400);
    await page.waitForFunction(() => !document.querySelector(".spinner") && !/Loading…/.test(document.body.innerText.slice(0, 400)), null, { timeout: 30000 }).catch(() => {});
    await wait(300);
  };
  const shot = async (id, { full = false } = {}) => {
    if (filter && !id.includes(filter)) return;
    await settle();
    await page.screenshot({ path: join(dir, `${id}.png`), fullPage: full });
    console.log(`[${name}] ${id}`);
  };
  const nav = async (view) => {
    await page.evaluate((v) => {
      window.history.pushState({ movView: v }, "", window.location.pathname);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, view);
    await settle();
  };
  const unlockAll = () => page.evaluate(async () => {
    const { useAuthStore } = await import("/src/store/authStore.ts");
    const { SCENARIO_REGISTRY } = await import("/src/content/scenarioRegistry.ts");
    useAuthStore.setState({ unlocked: { scenarioIds: SCENARIO_REGISTRY.map((s) => s.scenarioId), packIds: ["complete"] } });
  });
  // Clears any open choice modal, debate scorecard or recap through the UI.
  const clearOverlays = async () => {
    for (let i = 0; i < 8; i++) {
      const did = await page.evaluate(() => {
        const choice = document.querySelector(".overlay button.choice:not(:disabled)");
        if (choice) { choice.click(); return true; }
        const cont = document.querySelector(".overlay button.primary");
        if (cont) { cont.click(); return true; }
        return false;
      });
      if (!did) return;
      await wait(200);
    }
  };
  const step = async (label, fn) => {
    try { await fn(); } catch (e) { console.error(`[${name}] ${label} failed: ${e.message.split("\n")[0]}`); }
  };
  // Ends weeks through the store until `stop` (evaluated in the page) is true.
  const advance = async (store, until, maxTurns = 30) => {
    for (let i = 0; i < maxTurns; i++) {
      const status = await page.evaluate(async ({ store, until }) => {
        const mod = await import(`/src/store/${store}.ts`);
        const hook = Object.values(mod).find((v) => typeof v === "function" && "getState" in v);
        const s = hook.getState();
        const g = s.game;
        if (!g) return "nogame";
        if (new Function("g", "debateIds", `return (${until})`)(g, window.__debateIds ?? new Set())) return "done";
        if (g.phase === "result") return "result";
        const pending = store === "gameStore" ? g.pendingEvents.some((p) => p.forCandidate === g.playerCandidate) : !!g.pendingEvent;
        if (pending) return "pending";
        s.endTurn();
        return "ok";
      }, { store, until });
      if (status === "done" || status === "result" || status === "nogame") return status;
      await wait(250);
      if (status === "pending") await clearOverlays();
    }
    return "max";
  };

  await page.goto(base);
  await page.waitForSelector(".landing");
  await wait(800);
  if (want("landing")) {
    await shot("01-landing", { full: true });
    await shot("01-landing-top");
  }

  if (want("landing")) {
  // Library: the catalog, then one country, then a search.
  const search = page.locator('input[aria-label="Search election scenarios"]');
  const toLibrary = async () => {
    await search.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
  };
  await toLibrary();
  await shot("02-library");
  const usCard = page.locator("button", { hasText: "United States" }).first();
  if (await usCard.count()) {
    await usCard.click();
    await toLibrary();
    await shot("02-library-us");
  }
  await search.fill("1992");
  await wait(200);
  await shot("02-library-search");

  }

  if (want("setup")) {
  // Setup flows.
  await nav({ kind: "us", scenarioId: "2024", setup: true });
  await shot("03-setup-us", { full: true });
  await unlockAll();
  await nav({ kind: "uk", electionId: "2024", setup: true });
  await shot("03-setup-uk", { full: true });
  await nav({ kind: "country", countryId: "DE", electionId: "2025", setup: true });
  await shot("03-setup-de", { full: true });

  }

  if (want("us")) {
  // US campaign: first event, first debate, then the desk mid-game.
  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/store/gameStore.ts");
    useGameStore.getState().newGame({ scenario: "2024", playerCandidate: "dem", seed: "ui-shots" });
    const { HISTORICAL_EVENTS, GENERIC_DEBATES } = await import("/src/content/events.ts");
    const all = [...Object.values(HISTORICAL_EVENTS).flat(), ...GENERIC_DEBATES];
    window.__debateIds = new Set(all.filter((e) => e.isDebate).map((e) => e.id));
  });
  await nav({ kind: "us" });
  await step("event-us", async () => {
    if (await advance("gameStore", "g.pendingEvents.some((p) => p.forCandidate === g.playerCandidate && !debateIds.has(p.eventId))", 4) === "done") {
      await wait(500);
      await shot("06-event-us");
    }
  });
  await step("debate-us", async () => {
    if (await advance("gameStore", "g.pendingEvents.some((p) => p.forCandidate === g.playerCandidate && debateIds.has(p.eventId))") === "done") {
      await wait(500);
      await shot("07-debate-us");
      await page.locator(".overlay button.choice").first().click();
      await wait(600);
      await shot("07-debate-scorecard-us");
      await clearOverlays();
    }
  });
  await advance("gameStore", "g.turn >= 4");
  await clearOverlays();
  await shot("04-desk-us");
  await shot("04-desk-us-full", { full: true });
  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/store/gameStore.ts");
    useGameStore.getState().selectState("PA");
  });
  await shot("04-desk-us-state");
  await page.evaluate(async () => {
    const { useGameStore } = await import("/src/store/gameStore.ts");
    useGameStore.getState().selectState(null);
  });

  // Week recap through the real End Week button.
  await step("recap-us", async () => {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((el) => el.textContent?.includes("End Week") && !el.disabled);
      b?.click();
      return !!b;
    });
    if (clicked) {
      await wait(500);
      await shot("05-recap-us");
      await clearOverlays();
    }
  });

  // Overlays from the topbar.
  for (const [label, id] of [["Stats", "08-stats"], ["Guide", "09-guide"], ["Candidates", "10-candidates"]]) {
    const btn = page.locator(".desk-header button, .topbar button", { hasText: label }).first();
    if (await btn.count()) {
      await btn.click();
      await wait(600);
      await shot(id);
      await page.keyboard.press("Escape");
      await wait(200);
    }
  }
  const settings = page.locator('button[aria-label="Settings"]').first();
  if (await settings.count()) {
    await settings.click();
    await wait(500);
    await shot("11-settings");
    await page.keyboard.press("Escape");
  }
  for (const [modal, id] of [["login", "12-signin"], ["register", "12-register"]]) {
    await page.evaluate(async (m) => {
      const { useAuthStore } = await import("/src/store/authStore.ts");
      useAuthStore.getState().openModal(m);
    }, modal);
    await wait(600);
    await shot(id);
    await page.evaluate(async () => {
      const { useAuthStore } = await import("/src/store/authStore.ts");
      useAuthStore.getState().closeModal();
    });
  }

  // US election night and results.
  await advance("gameStore", "false", 40);
  await clearOverlays();
  await nav({ kind: "us" });
  await wait(2500);
  await shot("13-night-us");
  await wait(6000);
  await shot("13-night-us-late");
  const skip = page.locator("button", { hasText: /skip|results|continue/i }).first();
  if (await skip.count()) await skip.click().catch(() => {});
  await wait(1500);
  await shot("14-results-us");
  await shot("14-results-us-full", { full: true });

  }

  if (want("uk")) {
  // UK campaign desk, night, results.
  await page.evaluate(async () => {
    const { useUkStore } = await import("/src/store/ukStore.ts");
    useUkStore.getState().newGame("2024", "lab", "ui-shots");
  });
  await nav({ kind: "uk" });
  await step("event-uk", async () => {
    if (await advance("ukStore", "!!g.pendingEvent", 4) === "done") { await wait(500); await shot("06-event-uk"); }
  });
  await advance("ukStore", "g.turn >= 3");
  await clearOverlays();
  await shot("04-desk-uk");
  await shot("04-desk-uk-full", { full: true });
  await page.evaluate(async () => {
    const { useUkStore } = await import("/src/store/ukStore.ts");
    const g = useUkStore.getState().game;
    useUkStore.getState().selectRegion(g.regions?.[0]?.id ?? null);
  });
  await shot("04-desk-uk-region");
  await page.evaluate(async () => {
    const { useUkStore } = await import("/src/store/ukStore.ts");
    useUkStore.getState().selectRegion(null);
  });
  await step("recap-uk", async () => {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((el) => el.textContent?.includes("End Week") && !el.disabled);
      b?.click();
      return !!b;
    });
    if (clicked) {
      await wait(500);
      await shot("05-recap-uk");
      await clearOverlays();
    }
  });
  await advance("ukStore", "false", 40);
  await clearOverlays();
  await nav({ kind: "uk" });
  await wait(2500);
  await shot("13-night-uk");
  const ukSkip = page.locator("button", { hasText: /skip|results|continue/i }).first();
  if (await ukSkip.count()) await ukSkip.click().catch(() => {});
  await wait(1500);
  await shot("14-results-uk");
  await shot("14-results-uk-full", { full: true });

  }

  if (want("de")) {
  // Germany (country engine).
  await page.evaluate(async () => {
    const { useCountryStore } = await import("/src/store/countryStore.ts");
    useCountryStore.getState().newGame("DE", "2025", "spd", "ui-shots");
  });
  await nav({ kind: "country", countryId: "DE" });
  await step("event-de", async () => {
    if (await advance("countryStore", "!!g.pendingEvent", 4) === "done") { await wait(500); await shot("06-event-de"); }
  });
  await advance("countryStore", "g.turn >= 3");
  await clearOverlays();
  await shot("04-desk-de");
  await shot("04-desk-de-full", { full: true });
  await step("recap-de", async () => {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((el) => el.textContent?.includes("End Week") && !el.disabled);
      b?.click();
      return !!b;
    });
    if (clicked) {
      await wait(500);
      await shot("05-recap-de");
      await clearOverlays();
    }
  });
  await advance("countryStore", "false", 40);
  await clearOverlays();
  await nav({ kind: "country", countryId: "DE" });
  await wait(2500);
  await shot("13-night-de");
  const deSkip = page.locator("button", { hasText: /skip|results|continue/i }).first();
  if (await deSkip.count()) await deSkip.click().catch(() => {});
  await wait(1500);
  await shot("14-results-de");
  await shot("14-results-de-full", { full: true });

  }

  if (want("leaderboard")) {
  // Leaderboard, with a sample response so the table itself is captured
  // (the dev server has no campaign backend). Names are placeholders.
  await page.route("**/api/leaderboard?**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ entries: Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1, username: `Player ${i + 1}`, score: 940 - i * 37, evMargin: 120 - i * 14,
      popularVoteMargin: 4.2 - i * 0.6, turnsPlayed: 13, difficulty: ["hard", "normal", "easy"][i % 3], finishedAt: 0,
    })) }),
  }));
  // Leaderboard.
  await nav({ kind: "leaderboard" });
  await wait(1500);
  await shot("15-leaderboard", { full: true });

  }

  await browser.close();
}

for (const name of which.split(",")) {
  await run(name, VIEWPORTS[name]);
}
