// Fetch leader portraits from Wikimedia Commons, with their credits.
//
//   npx tsx scripts/portraits/fetch-portraits.ts resolve   # find each person's Wikidata item
//   npx tsx scripts/portraits/fetch-portraits.ts fetch     # download, crop, encode, credit
//
// `resolve` looks up every leader, candidate and running mate the game names
// (scripts/portraits/leaders.ts) and records the Wikidata item and Commons file
// in scripts/portraits/sources.json. A person is only matched when the item is
// a human with citizenship of the right country; anything doubtful is written
// with "review" set and is not fetched until a person checks it and clears the
// flag. Entries already in sources.json are never changed.
//
// `fetch` takes the image the Wikidata item itself names as the person's photo
// (P18), checks the Commons file's licence (public domain, CC0, CC BY or
// CC BY-SA only) and its depicts (P180) data when the file has any, then
// writes a 256 px square WebP to public/images/portraits/, the name to file
// map in src/content/portraits.ts and the credits the game shows in
// public/images/portraits/credits.json.
//
// Requests go one at a time with a pause between them, as the Wikimedia API
// and User-Agent policies ask.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { allLeaders, type LeaderRef } from "./leaders";

const ROOT = resolvePath(import.meta.dirname, "../..");
const SOURCES = resolvePath(ROOT, "scripts/portraits/sources.json");
const OUT_DIR = resolvePath(ROOT, "public/images/portraits");
const CREDITS = resolvePath(OUT_DIR, "credits.json");
const MAP = resolvePath(ROOT, "src/content/portraits.ts");
const USER_AGENT = "MarginOfVictoryPortraits/1.0 (https://lakesidegames.net/games/margin-of-victory/)";
const SIZE = 256;

/** Wikidata items for each country's citizenship (P27). */
const CITIZENSHIP: Record<string, string[]> = {
  US: ["Q30"], UK: ["Q145", "Q174193"], CA: ["Q16"], DE: ["Q183", "Q7318", "Q713750", "Q43287"], FR: ["Q142"],
  AU: ["Q408"], NZ: ["Q664"], BR: ["Q155"], IN: ["Q668"], ES: ["Q29"], IE: ["Q27"], JP: ["Q17"], IT: ["Q38"], MX: ["Q96"],
};

export interface SourceEntry {
  name: string;
  country: string;
  qid?: string;
  /** Commons file title without "File:". Defaults to the item's first P18. */
  file?: string;
  /** Set by resolve when a person must check the match. Never fetched while set. */
  review?: string;
  /** No usable photo: the game shows initials. */
  skip?: string;
  /**
   * Checked by hand: the file shows this person although its depicts (P180)
   * data does not list them (for example it lists only a flag behind them).
   */
  depictsNote?: string;
}

export interface PortraitCredit {
  name: string;
  file: string;
  source: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
}

let lastRequest = 0;
async function getJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = lastRequest + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT } });
    if (response.status === 429 || response.status >= 500) {
      const retry = Number(response.headers.get("retry-after")) || 10 * (attempt + 1);
      await new Promise((r) => setTimeout(r, retry * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    const body = await response.json();
    if (body?.error?.code === "maxlag") { await new Promise((r) => setTimeout(r, 5000)); continue; }
    return body;
  }
  throw new Error(`Gave up on ${url}`);
}

async function getBytes(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = lastRequest + 1500 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.status === 429 || response.status >= 500) {
      const retry = Number(response.headers.get("retry-after")) || 15 * (attempt + 1);
      await new Promise((r) => setTimeout(r, retry * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error(`Gave up on ${url}`);
}

const api = (host: string, params: Record<string, string>) =>
  `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params });

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const key = (ref: { name: string; country: string }) => `${ref.country}|${ref.name}`;

function readSources(): SourceEntry[] {
  return existsSync(SOURCES) ? JSON.parse(readFileSync(SOURCES, "utf8")) : [];
}

function writeSources(entries: SourceEntry[]) {
  entries.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
  writeFileSync(SOURCES, JSON.stringify(entries, null, 2) + "\n");
}

const claimIds = (entity: any, property: string): string[] =>
  (entity?.claims?.[property] ?? []).map((c: any) => c.mainsnak?.datavalue?.value?.id ?? c.mainsnak?.datavalue?.value).filter(Boolean);

async function entities(ids: string[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (const batch of chunks(ids, 50)) {
    const body = await getJson(api("www.wikidata.org", { action: "wbgetentities", ids: batch.join("|"), props: "claims|descriptions|labels|sitelinks", languages: "en", sitefilter: "enwiki" }));
    Object.assign(out, body.entities);
  }
  return out;
}

function checkPerson(entity: any, ref: LeaderRef): string | undefined {
  if (!entity || entity.missing !== undefined) return "no Wikidata item";
  if (!claimIds(entity, "P31").includes("Q5")) return "item is not a human";
  const citizenship = claimIds(entity, "P27");
  if (!citizenship.some((id) => CITIZENSHIP[ref.country]?.includes(id))) return `citizenship ${citizenship.join(",") || "missing"}`;
  const born = entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  const birthYear = born ? Number.parseInt(born.slice(1, 5), 10) : undefined;
  if (birthYear && (ref.years[0] - birthYear < 25 || ref.years[0] - birthYear > 95)) return `born ${birthYear}, in a ${ref.years[0]} election`;
  if (!claimIds(entity, "P18").length) return "item has no image";
  return undefined;
}

async function resolve() {
  const leaders = await allLeaders();
  const sources = readSources();
  const known = new Set(sources.map(key));
  const todo = leaders.filter((ref) => !known.has(key(ref)));
  console.log(`${leaders.length} people, ${todo.length} to resolve`);
  // English Wikipedia titles resolve famous politicians best; follow redirects.
  const titleToQid: Record<string, string> = {};
  for (const batch of chunks([...new Set(todo.map((r) => r.name))], 50)) {
    const body = await getJson(api("en.wikipedia.org", { action: "query", titles: batch.join("|"), redirects: "1", prop: "pageprops", ppprop: "wikibase_item|disambiguation" }));
    const back: Record<string, string> = {};
    for (const n of body.query.normalized ?? []) back[n.to] = n.from;
    for (const r of body.query.redirects ?? []) back[r.to] = back[r.from] ?? r.from;
    for (const page of body.query.pages ?? []) {
      if (page.missing || page.pageprops?.disambiguation !== undefined || !page.pageprops?.wikibase_item) continue;
      titleToQid[back[page.title] ?? page.title] = page.pageprops.wikibase_item;
    }
  }
  const first = await entities([...new Set(Object.values(titleToQid))]);
  const pending: LeaderRef[] = [];
  for (const ref of todo) {
    const qid = titleToQid[ref.name];
    const problem = qid ? checkPerson(first[qid], ref) : "no Wikipedia page by this name";
    if (!problem) {
      sources.push({ name: ref.name, country: ref.country, qid });
    } else pending.push(ref);
  }
  // Search Wikidata for the rest: a human of the right country, preferring politicians.
  for (const ref of pending) {
    const body = await getJson(api("www.wikidata.org", { action: "wbsearchentities", search: ref.name, language: "en", type: "item", limit: "8" }));
    const ids: string[] = (body.search ?? []).map((s: any) => s.id);
    const found = ids.length ? await entities(ids) : {};
    const fits = ids.filter((id) => !checkPerson(found[id], ref));
    const politicians = fits.filter((id) => claimIds(found[id], "P106").some((o) => ["Q82955", "Q193391", "Q372436", "Q4175034", "Q48352"].includes(o)) || claimIds(found[id], "P39").length > 0);
    const pick = politicians[0] ?? fits[0];
    const direct = titleToQid[ref.name];
    if (pick && politicians.length <= 1) {
      sources.push({ name: ref.name, country: ref.country, qid: pick, review: `search match: ${found[pick].descriptions?.en?.value ?? "no description"}` });
    } else if (pick) {
      sources.push({ name: ref.name, country: ref.country, qid: pick, review: `several matches: ${politicians.join(",")}` });
    } else {
      const why = direct ? checkPerson(first[direct], ref) : "not found";
      sources.push({ name: ref.name, country: ref.country, ...(direct ? { qid: direct } : {}), skip: why ?? "not found" });
    }
    console.log(`${ref.country} ${ref.name}: ${sources[sources.length - 1].review ?? sources[sources.length - 1].skip ?? "ok"}`);
  }
  writeSources(sources);
  console.log(`sources.json: ${sources.filter((s) => s.review).length} to review, ${sources.filter((s) => s.skip).length} without a photo`);
}

const LICENSE_OK = /^(public domain|pd([- ].*)?|cc0( 1\.0)?|cc[- ]by(-sa)?[- ]\d\.\d( [a-z]{2,})?|cc[- ]by(-sa)?[- ]\d\.\d$)$/i;

function plain(html: string | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function fileSlug(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * The item's photo nearest in time to the person's elections. Items often list
 * several (a 1999 and a 2021 photo of the same prime minister); the year in the
 * file name decides, and a file with no year counts as 15 years off.
 */
export function pickImage(entity: any, years: number[]): string | undefined {
  const claims = (entity?.claims?.P18 ?? []).filter((c: any) => c.rank !== "deprecated" && c.mainsnak?.datavalue?.value);
  // Preferred-rank photos first, so they win ties; the rank alone does not
  // decide, since it usually marks the newest photo.
  claims.sort((a: any, b: any) => Number(b.rank === "preferred") - Number(a.rank === "preferred"));
  const files: string[] = claims.map((c: any) => c.mainsnak.datavalue.value);
  const distance = (file: string) => {
    const year = Number(/(?:^|\D)((?:19|20)\d\d)/.exec(file)?.[1]);
    return year ? Math.min(...years.map((y) => Math.abs(y - year))) : 15;
  };
  return files.reduce<string | undefined>((best, file) => (best === undefined || distance(file) < distance(best) ? file : best), undefined);
}

async function fetchAll() {
  const leaders = new Map((await allLeaders()).map((ref) => [key(ref), ref]));
  const sources = readSources().filter((s) => s.qid && !s.review && !s.skip && leaders.has(key(s)));
  const items = await entities([...new Set(sources.map((s) => s.qid!))]);
  const files = new Map<string, string>();
  for (const s of sources) {
    const file = s.file ?? pickImage(items[s.qid!], leaders.get(key(s))!.years);
    if (file) files.set(key(s), file);
  }
  // File pages: licence, author, a thumbnail URL and the page id for depicts data.
  const info: Record<string, any> = {};
  for (const batch of chunks([...new Set(files.values())], 50)) {
    const body = await getJson(api("commons.wikimedia.org", {
      action: "query", titles: batch.map((f) => `File:${f}`).join("|"), prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: "500",
    }));
    const back: Record<string, string> = {};
    for (const n of body.query.normalized ?? []) back[n.to] = n.from;
    for (const page of body.query.pages ?? []) info[(back[page.title] ?? page.title).replace(/^File:/, "")] = page;
  }
  const depicts: Record<string, string[]> = {};
  const mids = Object.values(info).filter((p: any) => p.pageid).map((p: any) => `M${p.pageid}`);
  for (const batch of chunks(mids, 50)) {
    const body = await getJson(api("commons.wikimedia.org", { action: "wbgetentities", ids: batch.join("|"), props: "claims" }));
    for (const [mid, entity] of Object.entries<any>(body.entities ?? {})) {
      depicts[mid] = (entity.statements?.P180 ?? entity.claims?.P180 ?? []).map((c: any) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
    }
  }
  mkdirSync(OUT_DIR, { recursive: true });
  // A person whose chosen Commons file changed since the last run is fetched again.
  const previous = new Map<string, string>(
    (existsSync(CREDITS) ? (JSON.parse(readFileSync(CREDITS, "utf8")) as PortraitCredit[]) : []).map((c) => [c.file, c.title]),
  );
  const credits: PortraitCredit[] = [];
  const rejected: string[] = [];
  const work = resolvePath(ROOT, "node_modules/.cache/portraits");
  mkdirSync(work, { recursive: true });
  for (const s of sources) {
    const file = files.get(key(s));
    const page = file ? info[file] : undefined;
    const image = page?.imageinfo?.[0];
    if (!file || !image) { rejected.push(`${s.country} ${s.name}: no image file`); continue; }
    const meta = image.extmetadata ?? {};
    const license = plain(meta.LicenseShortName?.value);
    if (!LICENSE_OK.test(license) || meta.NonFree?.value === "true") { rejected.push(`${s.country} ${s.name}: licence "${license}" (${file})`); continue; }
    const shown = depicts[`M${page.pageid}`] ?? [];
    if (shown.length && !shown.includes(s.qid!) && !s.depictsNote) { rejected.push(`${s.country} ${s.name}: file depicts ${shown.join(",")}, not ${s.qid} (${file})`); continue; }
    const slug = `${s.country.toLowerCase()}-${fileSlug(s.name)}`;
    const out = resolvePath(OUT_DIR, `${slug}.webp`);
    if (!existsSync(out) || previous.get(`images/portraits/${slug}.webp`) !== file) {
      const raw = resolvePath(work, `${slug}.src`);
      writeFileSync(raw, await getBytes(image.thumburl ?? image.url));
      // Square crop: portraits keep the top of the frame (the face), wide
      // shots keep the middle. 256 px WebP, about 10 to 25 KB.
      const [w, h] = execFileSync("identify", ["-format", "%w %h", `${raw}[0]`]).toString().split(" ").map(Number);
      const side = Math.min(w, h);
      const x = Math.round((w - side) / 2);
      const y = h > w ? Math.round(Math.min((h - side) * 0.2, h * 0.08)) : 0;
      execFileSync("convert", [`${raw}[0]`, "-auto-orient", "-crop", `${side}x${side}+${x}+${y}`, "+repage", "-resize", `${SIZE}x${SIZE}`,
        "-strip", "-colorspace", "sRGB", "-quality", "78", "-define", "webp:method=6", out]);
      rmSync(raw);
    }
    const credit: PortraitCredit = {
      name: s.name,
      file: `images/portraits/${slug}.webp`,
      source: page.canonicalurl ?? image.descriptionurl,
      title: file,
      author: plain(meta.Artist?.value) || "Unknown author",
      license,
      ...(meta.LicenseUrl?.value ? { licenseUrl: meta.LicenseUrl.value } : {}),
      ...(plain(meta.Attribution?.value) ? { attribution: plain(meta.Attribution?.value) } : {}),
    };
    credits.push(credit);
    console.log(`ok ${s.country} ${s.name} ${license} ${statSync(out).size} B`);
  }
  // Files nobody uses any more (a person whose photo was rejected or replaced).
  const kept = new Set(credits.map((c) => c.file.replace("images/portraits/", "")));
  for (const f of readdirSync(OUT_DIR)) if (f.endsWith(".webp") && !kept.has(f)) rmSync(resolvePath(OUT_DIR, f));
  credits.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(CREDITS, JSON.stringify(credits, null, 1) + "\n");
  writeMap(credits);
  console.log(`${credits.length} portraits, ${rejected.length} rejected`);
  for (const r of rejected) console.log(`rejected ${r}`);
}

function writeMap(credits: PortraitCredit[]) {
  const lines = credits.map((c) => `  ${JSON.stringify(c.name)}: ${JSON.stringify(c.file)},`);
  writeFileSync(MAP, `// Portrait files keyed by the full name the game shows for a leader,
// candidate or running mate. Anyone without an entry gets an initials avatar
// (see ui/Avatar). Every file is a Wikimedia Commons photo under a public
// domain, CC0, CC BY or CC BY-SA licence, credited in
// public/images/portraits/credits.json and on the Credits page.
// Generated by scripts/portraits/fetch-portraits.ts: do not hand-edit.
export const PORTRAITS: Record<string, string> = {
${lines.join("\n")}
};

export function portraitFor(name: string): string | undefined {
  return PORTRAITS[name];
}
`);
}

const mode = process.argv[2];
if (mode === "resolve") await resolve();
else if (mode === "fetch") await fetchAll();
else { console.error("usage: fetch-portraits.ts resolve|fetch"); process.exit(1); }
