#!/usr/bin/env node
// CI-only autoplay for desktop shells that cannot be driven from outside
// (macOS WKWebView has no remote debugging port).
//
//   node scripts/ci-autoplay.mjs inject <port>
//     Adds a script to dist/index.html that plays the free US campaign from the
//     landing page to week two, the same path as desktop-smoke.mjs's "play"
//     step, and reports each stage to http://127.0.0.1:<port>/. Run it after
//     the web build, before Tauri embeds dist. desktop-build.mjs --ci-autoplay
//     does this; such builds say "CI test build" and are never handed out.
//
//   node scripts/ci-autoplay.mjs listen <port> <report.jsonl> <seconds>
//     Writes every report to <report.jsonl>, one JSON object per line, and
//     exits 0 on {"stage":"done"} or 1 after <seconds>.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [mode, portText, ...rest] = process.argv.slice(2);
const port = Number(portText);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error("Usage: ci-autoplay.mjs inject <port> | listen <port> <report.jsonl> <seconds>");
  process.exit(2);
}

// Runs in the page. Plain script, no imports.
function autoplay(port) {
  const report = (stage, detail = {}) => {
    try {
      fetch(`http://127.0.0.1:${port}/`, { method: "POST", mode: "no-cors", body: JSON.stringify({ stage, at: Date.now(), ...detail }) });
    } catch { /* the listener reads silence as a failure */ }
  };
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const visible = (el) => !!el && el.offsetParent !== null;
  const find = (selector, re) => [...document.querySelectorAll(selector)].find((el) => visible(el) && (!re || re.test(el.textContent ?? "")));
  const until = async (what, get, ms = 30_000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const found = get();
      if (found) return found;
      await wait(250);
    }
    throw new Error(`timed out waiting for ${what}`);
  };
  const week = () => (document.body.innerText.match(/Week of ([A-Z][a-z]+\.? \d+)/) ?? [])[1] ?? null;
  const clearOverlays = async () => {
    for (let i = 0; i < 10; i++) {
      const button = find(".overlay button.choice:not(:disabled)") ?? find(".overlay button.primary:not(:disabled)");
      if (!button) return;
      button.click();
      await wait(700);
    }
  };
  (async () => {
    try {
      report("loaded", { url: location.href });
      await until("the landing page", () => find(".landing"), 45_000);
      await wait(1500);
      report("landing");
      (await until("Play free", () => find("button", /^\s*Play free\s*$/))).click();
      await wait(900);
      let began = null;
      for (let i = 0; i < 6 && !began; i++) {
        const next = await until("the setup wizard", () => find("button.su-next"));
        const label = next.textContent.trim();
        next.click();
        await wait(900);
        if (/^Begin/i.test(label)) began = label;
      }
      if (!began) throw new Error("setup wizard never offered Begin");
      report("began", { label: began });
      await until("the campaign desk", () => find("button.desk-endweek"));
      await wait(1500);
      const skip = find("button.coach-skip");
      if (skip) { skip.click(); await wait(500); }
      const before = week();
      const add = find("button.plan-add");
      if (add) { add.click(); await wait(400); }
      (await until("End week", () => find("button.desk-endweek:not(:disabled)"))).click();
      await wait(1500);
      await clearOverlays();
      await wait(1000);
      const after = week();
      report("week-two", { before, after, ok: !!before && !!after && before !== after });
      // Hold the desk on screen for the screenshot, then finish.
      await wait(8000);
      report("done");
    } catch (error) {
      report("error", { message: String(error?.message ?? error), text: document.body.innerText.slice(0, 600) });
      await wait(8000);
      report("done");
    }
  })();
}

if (mode === "inject") {
  const index = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "dist", "index.html");
  const html = readFileSync(index, "utf8");
  if (!html.includes("</body>")) throw new Error(`${index} has no </body>`);
  const script = `<script>/* CI test build: autoplay */(${autoplay.toString()})(${port});</script>`;
  writeFileSync(index, html.replace("</body>", `${script}</body>`));
  console.log(`CI autoplay added to ${index}, reporting to 127.0.0.1:${port}`);
} else if (mode === "listen") {
  const [file, secondsText] = rest;
  const seconds = Number(secondsText);
  if (!file || !(seconds > 0)) throw new Error("listen needs <report.jsonl> <seconds>");
  writeFileSync(file, "");
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; if (body.length > 20_000) req.destroy(); });
    req.on("end", () => {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      res.end();
      let entry;
      try { entry = JSON.parse(body); } catch { entry = { stage: "unreadable", body: body.slice(0, 200) }; }
      appendFileSync(file, `${JSON.stringify(entry)}\n`);
      console.log("report:", JSON.stringify(entry));
      if (entry.stage === "done") { server.close(); process.exit(0); }
    });
  });
  server.listen(port, "127.0.0.1", () => console.log(`listening on 127.0.0.1:${port} for ${seconds} s`));
  setTimeout(() => { console.log("no done report in time"); process.exit(1); }, seconds * 1000);
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(2);
}
