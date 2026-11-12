#!/usr/bin/env node
// A stand-in for the game server, for the desktop launcher smoke test.
//
//   node fake-api.mjs --pfx <file> --passphrase <p> --port 443 --code <fake code> --log <file> [--ttl 600]
//   node fake-api.mjs --key <pem> --cert <pem> --port 8443 --code <fake code> --log <file>
//
// The smoke test points the game's API host at this server (hosts file on the
// Windows runner, --host-rules in Chromium locally) and starts the desktop app
// with LAKESIDE_HANDOFF_CODE set to the fake code. It answers the launcher
// redeem call the way the real server does: 200 with a session for the
// expected code, 401 for any other. Every request is appended to --log as one
// JSON line; the code itself is never written, only whether it matched.
// It exits by itself after --ttl seconds so a broken run never leaves it behind.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:https";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const port = Number(opt("--port") ?? 443);
const code = opt("--code") ?? "";
const logFile = opt("--log") ?? "fake-api.log";
const ttl = Number(opt("--ttl") ?? 600);
const tls = opt("--pfx")
  ? { pfx: readFileSync(opt("--pfx")), passphrase: opt("--passphrase") ?? "" }
  : { key: readFileSync(opt("--key")), cert: readFileSync(opt("--cert")) };

const SMOKE_USER = { id: "launcher-smoke", username: "launcher-smoke", email: "", ahdLinked: true };
const TOKEN = "launcher-smoke-token";
const unlocked = { scenarioIds: [], packIds: [] };
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
};

writeFileSync(logFile, "");
const record = (entry) => appendFileSync(logFile, `${JSON.stringify({ at: Date.now(), ...entry })}\n`);

const server = createServer(tls, (req, res) => {
  const path = new URL(req.url ?? "/", "https://fake.invalid").pathname;
  const send = (status, body) => {
    res.writeHead(status, { ...cors, "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > 16_384) req.destroy(); });
  req.on("end", () => {
    if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }
    const entry = { method: req.method, path };
    if (path === "/healthz") { send(200, { ok: true }); return; }
    if (req.method === "POST" && path === "/api/lakeside/launcher-exchange") {
      let sent = null;
      try { sent = JSON.parse(raw).code; } catch { /* not JSON */ }
      entry.codeMatches = typeof sent === "string" && sent === code;
      record(entry);
      if (entry.codeMatches) send(200, { token: TOKEN, user: SMOKE_USER, unlocked });
      else send(401, { error: "launcher sign in expired" });
      return;
    }
    entry.authorized = req.headers.authorization === `Bearer ${TOKEN}`;
    record(entry);
    if (path === "/api/auth/me") {
      if (entry.authorized) send(200, { user: SMOKE_USER, unlocked });
      else send(401, { error: "not signed in" });
      return;
    }
    send(404, { error: "not in the launcher smoke mock" });
  });
});

server.listen(port, "127.0.0.1", () => console.log(`fake api listening on 127.0.0.1:${port}`));
setTimeout(() => { console.log("fake api ttl reached"); process.exit(0); }, ttl * 1000).unref();
