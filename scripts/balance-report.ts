// ─────────────────────────────────────────────────────────────────────────
// BALANCE GAUNTLET REPORT — runs the FULL scenario × side × difficulty × bot
// matrix and writes docs/balance/report-<date>.md (plus a stdout summary).
//
//   npx tsx scripts/balance-report.ts            # full matrix, 20 seeds/cell
//   GAUNTLET_SEEDS=10 npx tsx scripts/balance-report.ts
//   GAUNTLET_COUNTRIES=NZ npx tsx scripts/balance-report.ts   # one country
//
// A country-filtered run writes report-<date>-<codes>.md and merges its rows
// into suggested-labels.json, leaving every other scenario's label alone.
// WRITE_REGISTRY=1 patches the difficulty on each mismatched row in its
// country module (src/content/countries/*.ts).
//
// The report is the design record behind the registry's difficulty labels:
// it flags threshold breaches and lists label mismatches (measured focused-
// bot underdog win rate vs the authored easy/medium/hard label).
// ─────────────────────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runGauntlet,
  scenarioBaseline,
  suggestedLabel,
  easiestDifficultyFor,
  hardestDifficultyFor,
  defaultDifficultyFor,
  GAUNTLET_THRESHOLDS,
  type GauntletRow,
} from "@engine/balance/harness";
import { SCENARIO_REGISTRY as FULL_REGISTRY } from "@content/scenarioRegistry";

const SEEDS = Number(process.env.GAUNTLET_SEEDS ?? 20);
// Optional country filter, e.g. GAUNTLET_COUNTRIES=NZ or NZ,CA.
const ONLY_COUNTRIES = (process.env.GAUNTLET_COUNTRIES ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
// Optional scenario filter, e.g. GAUNTLET_SCENARIOS=us-1956,us-1952: measures
// only new elections and merges their labels like a country-filtered run.
const ONLY_SCENARIOS = (process.env.GAUNTLET_SCENARIOS ?? "").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
const FILTERED = ONLY_COUNTRIES.length > 0 || ONLY_SCENARIOS.length > 0;
const SCENARIO_REGISTRY = FULL_REGISTRY
  .filter((m) => !ONLY_COUNTRIES.length || ONLY_COUNTRIES.includes(m.country))
  .filter((m) => !ONLY_SCENARIOS.length || ONLY_SCENARIOS.includes(m.scenarioId));
if (SCENARIO_REGISTRY.length === 0) throw new Error(`No scenarios for GAUNTLET_COUNTRIES=${ONLY_COUNTRIES.join(",")} GAUNTLET_SCENARIOS=${ONLY_SCENARIOS.join(",")}`);
// WRITE_REGISTRY=1 rewrites difficulty fields in scenarioRegistry.ts from the
// measured suggested labels (keeps the picker honest after a gauntlet run).
const WRITE_REGISTRY = process.env.WRITE_REGISTRY === "1";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const num = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));

console.log(`Balance gauntlet: ${FILTERED ? [...ONLY_COUNTRIES, ...ONLY_SCENARIOS].join(", ") : "full matrix"}, ${SEEDS} seeds/cell…`);
const t0 = Date.now();
let lastTick = 0;
const rows = runGauntlet({
  scenarios: SCENARIO_REGISTRY.map((m) => m.scenarioId),
  seedsPerCell: SEEDS,
  onProgress: (done, total) => {
    const tick = Math.floor((done / total) * 20);
    if (tick > lastTick) {
      lastTick = tick;
      process.stdout.write(`  ${pct(done / total)} (${done}/${total} games, ${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  },
});
const elapsed = (Date.now() - t0) / 1000;
const totalGames = rows.reduce((s, r) => s + r.seeds, 0);
console.log(`Done: ${rows.length} rows / ${totalGames} games in ${elapsed.toFixed(0)}s.\n`);

// ── Flags: threshold breaches ──────────────────────────────────────────────
interface Flag {
  scenarioId: string;
  kind: string;
  detail: string;
}
const flags: Flag[] = [];
const baselines = new Map(SCENARIO_REGISTRY.map((m) => [m.scenarioId, scenarioBaseline(m)]));

for (const meta of SCENARIO_REGISTRY) {
  const b = baselines.get(meta.scenarioId)!;
  const mine = rows.filter((r) => r.scenarioId === meta.scenarioId);
  const easiest = easiestDifficultyFor(meta.engine);
  const hardest = hardestDifficultyFor(meta.engine);
  const dflt = defaultDifficultyFor(meta.engine);

  const floor = mine.find((r) => r.side === b.underdog && r.bot === "focused" && r.difficulty === easiest);
  if (floor && floor.winRate < GAUNTLET_THRESHOLDS.winnabilityFloor) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "winnability-floor",
      detail: `focused underdog (${b.underdog}) on ${easiest}: winRate ${pct(floor.winRate)} < ${pct(GAUNTLET_THRESHOLDS.winnabilityFloor)}`,
    });
  }
  const push = mine.find((r) => r.side === b.winner && r.bot === "focused" && r.difficulty === hardest);
  if (push && push.winRate < GAUNTLET_THRESHOLDS.noPushoverFloor) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "no-pushover",
      detail: `focused winner (${b.winner}) on ${hardest}: winRate ${pct(push.winRate)} < ${pct(GAUNTLET_THRESHOLDS.noPushoverFloor)}`,
    });
  }
  // Calibration under noise: passive play on the UNDERDOG side (so the engine
  // AI holds the historical winner) should reproduce history. Winner-side
  // passive rows are excluded by design: a competent AI beating a do-nothing
  // player is fun-correct, not a calibration drift.
  const fidelity = mine.find((r) => r.side === b.underdog && r.bot === "passive" && r.difficulty === dflt);
  if (fidelity && fidelity.historyMatchRate < GAUNTLET_THRESHOLDS.passiveFidelity) {
    flags.push({
      scenarioId: meta.scenarioId,
      kind: "passive-fidelity",
      detail: `passive underdog (${b.underdog}) on ${dflt}: history match ${pct(fidelity.historyMatchRate)} < ${pct(GAUNTLET_THRESHOLDS.passiveFidelity)}`,
    });
  }
}

// ── Label suggestions vs the registry ──────────────────────────────────────
interface LabelRow {
  scenarioId: string;
  authored: string;
  suggested: string;
  underdog: string;
  winRate: number;
  mismatch: boolean;
}
const labels: LabelRow[] = SCENARIO_REGISTRY.map((meta) => {
  const b = baselines.get(meta.scenarioId)!;
  const dflt = defaultDifficultyFor(meta.engine);
  const row = rows.find(
    (r) => r.scenarioId === meta.scenarioId && r.side === b.underdog && r.bot === "focused" && r.difficulty === dflt,
  );
  const winRate = row?.winRate ?? 0;
  const suggested = suggestedLabel(winRate);
  return {
    scenarioId: meta.scenarioId,
    authored: meta.difficulty,
    suggested,
    underdog: b.underdog,
    winRate,
    mismatch: suggested !== meta.difficulty,
  };
});
const mismatches = labels.filter((l) => l.mismatch);

// ── Markdown report ────────────────────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10);
const lines: string[] = [];
lines.push(`# Balance gauntlet report — ${date}`);
lines.push("");
lines.push(
  `Full matrix: ${rows.length} cells / ${totalGames} games, ${SEEDS} seeds per cell, ${elapsed.toFixed(0)}s runtime. ` +
    `Seeds are \`\${scenarioId}-\${side}-\${bot}-\${i}\` — reruns are identical.`,
);
lines.push("");
lines.push(
  `Thresholds: winnability floor ${pct(GAUNTLET_THRESHOLDS.winnabilityFloor)} (focused underdog, easiest setting), ` +
    `no-pushover ${pct(GAUNTLET_THRESHOLDS.noPushoverFloor)} (focused winner, hardest setting), ` +
    `passive fidelity ${pct(GAUNTLET_THRESHOLDS.passiveFidelity)} (passive underdog, default setting). ` +
    `Suggested labels from focused-underdog win rate on the default setting: ` +
    `easy ≥ ${pct(GAUNTLET_THRESHOLDS.labelEasyMin)}, medium ≥ ${pct(GAUNTLET_THRESHOLDS.labelMediumMin)}, else hard.`,
);

for (const engine of ["us", "uk", "country"] as const) {
  const engineRows = rows.filter((r) => r.engine === engine);
  if (engineRows.length === 0) continue;
  lines.push("");
  lines.push(`## Engine: ${engine}`);
  lines.push("");
  const demEvCol = engine === "us" ? " avg dem EV |" : "";
  lines.push(`| scenario | side | role | difficulty | bot | winRate | avgMargin | blowout% | avgScore | histMatch |${demEvCol}`);
  lines.push(`|---|---|---|---|---|---|---|---|---|---|${engine === "us" ? "---|" : ""}`);
  for (const r of engineRows) {
    const demEv = engine === "us" ? ` ${num(r.avgDemEV ?? 0)} |` : "";
    lines.push(
      `| ${r.scenarioId} | ${r.side} | ${r.sideRole} | ${r.difficulty} | ${r.bot} | ${pct(r.winRate)} | ${num(r.avgUnitMargin)} | ${pct(r.blowoutRate)} | ${num(r.avgScore)} | ${pct(r.historyMatchRate)} |${demEv}`,
    );
  }
}

lines.push("");
lines.push("## Flags (threshold breaches)");
lines.push("");
if (flags.length === 0) {
  lines.push("None — every scenario clears the winnability floor, the no-pushover bar, and passive fidelity.");
} else {
  for (const f of flags) lines.push(`- **${f.scenarioId}** [${f.kind}]: ${f.detail}`);
}

lines.push("");
lines.push("## Difficulty labels: measured vs registry");
lines.push("");
lines.push(
  "Caveat: the suggested label is a pure underdog-challenge rating (focused bot playing the " +
    "baseline loser). Several authored labels instead rate the marquee side's experience " +
    "(us-2008 'easy' = playing Obama; uk-1997 'easy' = playing Blair), so a mismatch here can " +
    "mean either a mislabeled scenario or a labeling-convention difference — decide per row " +
    "before the paywall flip.",
);
lines.push("");
lines.push("| scenario | authored | suggested | underdog focused winRate (default setting) | match |");
lines.push("|---|---|---|---|---|");
for (const l of labels) {
  lines.push(`| ${l.scenarioId} | ${l.authored} | ${l.suggested} | ${l.underdog}: ${pct(l.winRate)} | ${l.mismatch ? "MISMATCH" : "ok"} |`);
}
lines.push("");
lines.push(
  mismatches.length === 0
    ? "All registry labels match the measured difficulty."
    : `${mismatches.length} label mismatch(es): ${mismatches.map((l) => `${l.scenarioId} (${l.authored}→${l.suggested})`).join(", ")}.`,
);
lines.push("");

const outDir = join(root, "docs", "balance");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, FILTERED ? `report-${date}-${[...ONLY_COUNTRIES, ...ONLY_SCENARIOS].join("-").toLowerCase()}.md` : `report-${date}.md`);
writeFileSync(outPath, lines.join("\n"));

// Machine-readable labels — the registry-sync test and WRITE_REGISTRY consume this.
const labelsPath = join(outDir, "suggested-labels.json");
// A filtered run merges into the existing labels instead of replacing them.
type LabelsFile = { date: string; seeds: number; note?: string; labels: Record<string, Record<string, unknown>> };
const previous = FILTERED && existsSync(labelsPath)
  ? (JSON.parse(readFileSync(labelsPath, "utf8")) as LabelsFile)
  : null;
const labelsJson: LabelsFile["labels"] = {
  ...(previous?.labels ?? {}),
  ...Object.fromEntries(
    labels.map((l) => [l.scenarioId, { suggested: l.suggested, authored: l.authored, underdogWinRate: l.winRate }]),
  ),
};
// One scenario per line keeps the file diffable.
const inline = (o: Record<string, unknown>) => `{ ${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(", ")} }`;
const header: Record<string, unknown> = { date: previous?.date ?? date, seeds: previous?.seeds ?? SEEDS };
if (previous?.note) header.note = previous.note;
writeFileSync(labelsPath, [
  "{",
  ...Object.entries(header).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
  '  "labels": {',
  Object.entries(labelsJson).map(([id, row]) => `    ${JSON.stringify(id)}: ${inline(row)}`).join(",\n"),
  "  }",
  "}",
].join("\n") + "\n");

if (WRITE_REGISTRY && mismatches.length > 0) {
  // Each registry row lives in its country module as
  // `{ electionId: "<id>", ..., difficulty: "<label>", ... }`.
  const dir = join(root, "src", "content", "countries");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "types.ts");
  const byCode = new Map<string, string>();
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const code = /\bcode: "([A-Z]{2})"/.exec(text)?.[1] ?? /^\s+id: "([A-Z]{2})",$/m.exec(text)?.[1];
    if (code) byCode.set(code, join(dir, f));
  }
  let patched = 0;
  for (const l of mismatches) {
    const meta = FULL_REGISTRY.find((m) => m.scenarioId === l.scenarioId)!;
    const file = byCode.get(meta.country);
    const src = file ? readFileSync(file, "utf8") : "";
    const esc = meta.nativeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rowRe = new RegExp(`(electionId: "${esc}"[^}]*?difficulty: )"${l.authored}"`);
    if (!file || !rowRe.test(src)) { console.warn(`  could not patch registry row for ${l.scenarioId}`); continue; }
    writeFileSync(file, src.replace(rowRe, `$1"${l.suggested}"`));
    patched++;
  }
  console.log(`\nWRITE_REGISTRY=1: patched ${patched} difficulty label(s) in the country modules`);
}

// ── stdout summary ─────────────────────────────────────────────────────────
console.log(`Report written to ${outPath}`);
console.log(`Labels JSON written to ${labelsPath}\n`);
console.log(`Flags (${flags.length}):`);
if (flags.length === 0) console.log("  none");
for (const f of flags) console.log(`  - ${f.scenarioId} [${f.kind}]: ${f.detail}`);
console.log(`\nLabel mismatches (${mismatches.length}):`);
if (mismatches.length === 0) console.log("  none");
for (const l of mismatches) {
  console.log(`  - ${l.scenarioId}: authored ${l.authored} → suggested ${l.suggested} (underdog ${l.underdog} focused winRate ${pct(l.winRate)})`);
}
