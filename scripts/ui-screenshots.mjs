// Captures every main web game screen at phone, tablet and desktop sizes.
//
// Usage (with `npm run dev` already running):
//   node scripts/ui-screenshots.mjs <base-url> <output-dir> [phone,tablet,desktop] [screen-filter] [sections]
// sections: all, or a comma list of landing,setup,us,uk,de,countries,leaderboard
// "countries" captures library, setup, desk (geo and tile map), results and
// Store pack page for every registered country; SHOT_COUNTRIES=JP,IN limits it.
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
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`[${name}] ${id}${wide > 1 ? ` WARNING: page is ${wide}px wider than the viewport` : ""}`);
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
  // Mark every registered country's onboarding coach as seen.
  await page.evaluate(async () => {
    const { COUNTRY_MODULES } = await import("/src/content/countries/index.ts");
    for (const m of COUNTRY_MODULES) localStorage.setItem(`coach-done-${m.code.toLowerCase()}-v1`, "1");
  });
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

  // Overlays from the desk header. Clicks go through the DOM so a scrolled
  // tool rail on phones does not matter; each overlay closes from its own button.
  const closeOverlay = async () => {
    await page.evaluate(() => {
      const btn = document.querySelector('.overlay button[aria-label="Close"]')
        ?? [...document.querySelectorAll(".overlay button")].find((b) => b.textContent?.trim() === "Close");
      btn?.click();
    });
    await page.keyboard.press("Escape");
    await wait(300);
  };
  for (const [label, id] of [["Stats", "08-stats"], ["Guide", "09-guide"], ["Candidates", "10-candidates"], ["Settings", "11-settings"]]) {
    await step(id, async () => {
      const clicked = await page.evaluate((text) => {
        const btn = [...document.querySelectorAll(".desk-header button, .topbar button")]
          .find((b) => b.textContent?.trim() === text || b.getAttribute("aria-label") === text);
        btn?.click();
        return !!btn;
      }, label);
      if (!clicked) return;
      await wait(600);
      await shot(id);
      await closeOverlay();
    });
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

  if (want("countries")) {
  // Every country: library, setup (newest and oldest election), campaign desk
  // on both map views, results, and its Store pack page. Shots are named
  // c-<code>-<screen> so one country can be picked with the screen filter.
  const countries = await page.evaluate(async () => {
    const { COUNTRY_MODULES } = await import("/src/content/countries/index.ts");
    const { SCENARIO_REGISTRY } = await import("/src/content/scenarioRegistry.ts");
    return COUNTRY_MODULES.map((m) => {
      const rows = SCENARIO_REGISTRY.filter((s) => s.country === m.code).sort((a, b) => b.year - a.year);
      return {
        code: m.code, name: m.name, engine: m.engine, pack: m.pack.id,
        newest: rows[0].nativeId, oldest: rows[rows.length - 1].nativeId,
        party: m.engine === "country" ? m.bundle.playable[0] : m.engine === "uk" ? "lab" : "dem",
      };
    });
  });
  await unlockAll();
  const onlyCountries = (process.env.SHOT_COUNTRIES ?? "").split(",").filter(Boolean);
  const storeHook = { us: "gameStore", uk: "ukStore", country: "countryStore" };
  const viewFor = (c, extra = {}) => c.engine === "us" ? { kind: "us", ...extra } : c.engine === "uk" ? { kind: "uk", ...extra } : { kind: "country", countryId: c.code, ...extra };
  const pressToggle = (labels) => page.evaluate((labels) => {
    const b = [...document.querySelectorAll('[role="group"][aria-label="Map view"] button')].find((el) => labels.includes(el.textContent?.trim()));
    b?.click();
    return !!b;
  }, labels);
  for (const c of countries) {
    if (onlyCountries.length && !onlyCountries.includes(c.code)) continue;
    const id = (s) => `c-${c.code.toLowerCase()}-${s}`;
    await step(id("library"), async () => {
      await nav({ kind: "landing" });
      await page.goto(base);
      await page.waitForSelector(".landing");
      await unlockAll();
      const chip = page.locator(".library-countries button", { hasText: c.name }).first();
      await chip.scrollIntoViewIfNeeded();
      await chip.click();
      await page.evaluate(() => document.getElementById("election-library")?.scrollIntoView());
      await shot(id("library"));
    });
    await step(id("setup"), async () => {
      await page.evaluate(async () => {
        for (const [file, name] of [["gameStore", "useGameStore"], ["ukStore", "useUkStore"], ["countryStore", "useCountryStore"]]) {
          const mod = await import(`/src/store/${file}.ts`);
          mod[name].getState().unload?.();
        }
      });
      const key = c.engine === "us" ? "scenarioId" : "electionId";
      await nav(viewFor(c, { [key]: c.newest, setup: true }));
      await shot(id("setup-newest"), { full: true });
      if (c.oldest !== c.newest) {
        await nav({ kind: "landing" });
        await nav(viewFor(c, { [key]: c.oldest, setup: true }));
        await shot(id("setup-oldest"), { full: true });
      }
    });
    await step(id("desk"), async () => {
      await page.evaluate(async (c) => {
        if (c.engine === "us") {
          const { useGameStore } = await import("/src/store/gameStore.ts");
          useGameStore.getState().newGame({ scenario: c.newest, playerCandidate: c.party, seed: "ui-shots" });
        } else if (c.engine === "uk") {
          const { useUkStore } = await import("/src/store/ukStore.ts");
          useUkStore.getState().newGame(c.newest, c.party, "ui-shots");
        } else {
          const { useCountryStore } = await import("/src/store/countryStore.ts");
          useCountryStore.getState().newGame(c.code, c.newest, c.party, "ui-shots");
        }
      }, c);
      await nav({ kind: "landing" });
      await nav(viewFor(c));
      await advance(storeHook[c.engine], "g.turn >= 3");
      await clearOverlays();
      await pressToggle(["Geo", "Geographic"]);
      await shot(id("desk-geo"));
      await shot(id("desk-geo-full"), { full: true });
      await pressToggle(["Square", "EV tiles"]);
      await shot(id("desk-tile"));
    });
    await step(id("results"), async () => {
      await advance(storeHook[c.engine], "false", 40);
      await clearOverlays();
      await nav({ kind: "landing" });
      await nav(viewFor(c));
      await wait(2000);
      const skipBtn = page.locator("button", { hasText: /skip|results|continue/i }).first();
      if (await skipBtn.count()) await skipBtn.click().catch(() => {});
      await wait(1500);
      await shot(id("results"));
      await shot(id("results-full"), { full: true });
    });
    await step(id("store"), async () => {
      await nav({ kind: "landing" });
      await page.evaluate(async (packId) => {
        const { useStoreNav } = await import("/src/store/storeNav.ts");
        useStoreNav.getState().openStore({ packId });
      }, c.pack);
      await wait(800);
      await shot(id("store"));
      await page.evaluate(async () => {
        const { useStoreNav } = await import("/src/store/storeNav.ts");
        useStoreNav.getState().closeStore();
      });
    });
  }
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
