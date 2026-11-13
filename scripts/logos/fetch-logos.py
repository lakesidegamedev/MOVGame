#!/usr/bin/env python3
"""Fetch party logos from Wikimedia Commons, with their credits.

    python3 scripts/logos/fetch-logos.py resolve   # parties.json -> sources.json
    python3 scripts/logos/fetch-logos.py fetch     # sources.json -> images, credits, table

`resolve` finds the Wikidata item for each party row in scripts/logos/parties.json
(by its English Wikipedia article) and records every logo image (P154) the item
lists, with the dates each logo was in use when Wikidata has them. Rows already
in sources.json keep any hand edits ("file", "skip").

`fetch` picks, for every election a row covers, the logo in use at that election
(else the nearest one in time, else the item's current logo), reads the Commons
file's licence and author, writes a small WebP to public/images/logos/, the
credits to public/images/logos/credits.json and the lookup table to
src/content/partyLogos.ts.

Requests go one at a time with a pause between them, as the Wikimedia API and
User-Agent policies ask. Needs Pillow.
"""

import io
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PARTIES = ROOT / "scripts/logos/parties.json"
SOURCES = ROOT / "scripts/logos/sources.json"
OUT_DIR = ROOT / "public/images/logos"
CREDITS = OUT_DIR / "credits.json"
TABLE = ROOT / "src/content/partyLogos.ts"
BUNDLES = ROOT / "apps/native/shared/src/commonMain/resources/bundles"
USER_AGENT = "MarginOfVictoryLogos/1.0 (https://lakesidegames.net/games/margin-of-victory/)"
# Logos are shown at about 16 to 22 px high; this box keeps them sharp at 3x.
BOX = (192, 72)
MAX_BYTES = 15_000

_last = 0.0


def get(url: str) -> bytes:
    global _last
    for attempt in range(5):
        wait = _last + 1.1 - time.time()
        if wait > 0:
            time.sleep(wait)
        _last = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(int(e.headers.get("retry-after") or 10 * (attempt + 1)))
                continue
            raise
    raise RuntimeError(f"gave up on {url}")


def api(base: str, **params) -> dict:
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    return json.loads(get(base + "?" + urllib.parse.urlencode(params)))


def election_years() -> dict:
    """Election years per country code, from the exported native bundles."""
    years: dict = {}
    for f in sorted((BUNDLES / "countries").glob("*.json")):
        j = json.loads(f.read_text())
        years[f.stem] = sorted({int(e["year"]) for e in j["elections"].values()})
    uk = json.loads((BUNDLES / "uk.json").read_text())
    years["uk"] = sorted({int(e["year"]) for e in uk["elections"].values()})
    reg = json.loads((BUNDLES / "scenario-registry.json").read_text())
    years["us"] = sorted({int(s["year"]) for s in reg if s["country"] == "US"})
    return years


def row_key(row: dict) -> str:
    return f'{row["country"]}:{row["party"]}:{row.get("from", "")}:{row.get("to", "")}'


def year_of(snak_value) -> int | None:
    m = re.match(r"[+-](\d{4})", (snak_value or {}).get("time", ""))
    return int(m.group(1)) if m else None


def resolve() -> None:
    rows = json.loads(PARTIES.read_text())
    old = {row_key(s): s for s in json.loads(SOURCES.read_text())} if SOURCES.exists() else {}
    titles = sorted({r["wiki"] for r in rows})
    qids: dict = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        res = api("https://en.wikipedia.org/w/api.php", action="query", titles="|".join(chunk),
                  redirects=1, prop="pageprops", ppprop="wikibase_item")["query"]
        back = {t: t for t in chunk}
        for n in res.get("normalized", []):
            back[n["to"]] = back.get(n["from"], n["from"])
        for rd in res.get("redirects", []):
            back[rd["to"]] = back.get(rd["from"], rd["from"])
        for page in res["pages"]:
            q = page.get("pageprops", {}).get("wikibase_item")
            if q:
                qids[back.get(page["title"], page["title"])] = q
    items: dict = {}
    ids = sorted(set(qids.values()))
    for i in range(0, len(ids), 50):
        res = api("https://www.wikidata.org/w/api.php", action="wbgetentities", ids="|".join(ids[i:i + 50]),
                  props="claims|labels", languages="en")
        items.update(res["entities"])
    out = []
    for r in rows:
        prev = old.get(row_key(r), {})
        entry = {**r}
        q = qids.get(r["wiki"])
        if not q:
            entry["skip"] = prev.get("skip", "No Wikidata item for this article")
            out.append(entry)
            continue
        item = items[q]
        entry["qid"] = q
        entry["label"] = item.get("labels", {}).get("en", {}).get("value", r["wiki"])
        logos = []
        for st in item.get("claims", {}).get("P154", []):
            if st.get("rank") == "deprecated":
                continue
            v = st["mainsnak"].get("datavalue", {}).get("value")
            if not v:
                continue
            quals = st.get("qualifiers", {})
            start = next((year_of(x.get("datavalue", {}).get("value")) for x in quals.get("P580", [])), None)
            end = next((year_of(x.get("datavalue", {}).get("value")) for x in quals.get("P582", [])), None)
            logos.append({"file": v, "rank": st.get("rank"), "from": start, "to": end})
        entry["logos"] = logos
        for keep in ("file", "skip", "files"):
            if keep in prev:
                entry[keep] = prev[keep]
        if not logos and "skip" not in entry and "file" not in entry and "files" not in entry:
            entry["skip"] = "The Wikidata item names no logo"
        out.append(entry)
    SOURCES.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(out)} rows, {sum(1 for e in out if 'skip' not in e)} with a logo")


def pick(logos: list, year: int) -> str | None:
    if not logos:
        return None
    dated = [l for l in logos if l["from"] or l["to"]]
    inside = [l for l in dated if (l["from"] or 0) <= year <= (l["to"] or 9999)]
    if inside:
        return max(inside, key=lambda l: l["from"] or 0)["file"]
    undated = [l for l in logos if not (l["from"] or l["to"])]
    if undated:
        # Wikidata lists undated logos for the years its dated ones do not cover.
        pref = [l for l in undated if l["rank"] == "preferred"]
        return (pref or undated)[0]["file"]
    return min(dated, key=lambda l: min(abs(year - (l["from"] or year)), abs(year - (l["to"] or year))))["file"]


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def strip_html(s: str) -> str:
    s = re.sub(r"<br\s*/?>|</p>|</li>", "; ", str(s or ""), flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"(;\s*)+", "; ", s).strip("; ")
    s = re.sub(r"[\U00010000-\U0010FFFF]|\(talk\)", "", s)
    s = re.sub(r"(Unknown author)+\s*/\s*", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("&amp;", "&").replace("&nbsp;", " ").replace("&#039;", "'").replace("&quot;", '"')


def encode(png: bytes) -> bytes:
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    img.thumbnail(BOX, Image.LANCZOS)
    for q in (88, 80, 70, 60):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            return buf.getvalue()
    return buf.getvalue()


def fetch() -> None:
    sources = json.loads(SOURCES.read_text())
    years = election_years()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    table = []  # (country, party, from, to, file)
    wanted: dict = {}  # commons title -> output name
    party_of: dict = {}  # commons title -> party name, for the credits
    author_of: dict = {}  # commons title -> author, where Commons' own field is unusable
    for s in sources:
        if "skip" in s:
            continue
        ys = [y for y in years[s["country"]] if s.get("from", 0) <= y <= s.get("to", 9999)]
        for y in ys:
            title = (s.get("files") or {}).get(str(y)) or s.get("file") or pick(s["logos"], y)
            if not title:
                continue
            name = wanted.get(title) or f'{s["country"]}-{s["party"]}-{slug(Path(title).stem)[:60] or y}.webp'
            wanted[title] = name
            party_of.setdefault(title, s.get("label") or s["wiki"])
            if s.get("author"):
                author_of[title] = s["author"]
            last = table[-1] if table else None
            if last and last[0] == s["country"] and last[1] == s["party"] and last[4] == name:
                table[-1] = (last[0], last[1], last[2], y, name)
            else:
                table.append((s["country"], s["party"], y, y, name))
    credits = []
    titles = sorted(wanted)
    info: dict = {}
    for i in range(0, len(titles), 25):
        res = api("https://commons.wikimedia.org/w/api.php", action="query",
                  titles="|".join("File:" + t for t in titles[i:i + 25]), prop="imageinfo",
                  iiprop="url|extmetadata|mime|size", iiurlwidth=str(BOX[0] * 2))
        back = {t: t for t in titles[i:i + 25]}
        for n in res["query"].get("normalized", []):
            back[n["to"].removeprefix("File:")] = n["from"].removeprefix("File:")
        for page in res["query"]["pages"]:
            t = back.get(page["title"].removeprefix("File:"), page["title"].removeprefix("File:"))
            info[t] = page
    for t in titles:
        page = info.get(t)
        if not page or "imageinfo" not in page:
            print("MISSING", t)
            continue
        ii = page["imageinfo"][0]
        meta = {k: strip_html(v.get("value", "")) for k, v in ii.get("extmetadata", {}).items()}
        out = OUT_DIR / wanted[t]
        if not out.exists():
            src = ii.get("thumburl") or ii["url"]
            out.write_bytes(encode(get(src)))
        credits.append({
            "party": party_of[t],
            "file": f"images/logos/{wanted[t]}",
            "source": ii["descriptionurl"],
            "title": t,
            "author": author_of.get(t) or meta.get("Artist") or "Unknown",
            "license": meta.get("LicenseShortName") or "See source",
            **({"licenseUrl": meta["LicenseUrl"]} if meta.get("LicenseUrl") else {}),
            **({"attribution": meta["Attribution"]} if meta.get("Attribution") else {}),
        })
    used = {c["file"] for c in credits}
    table = [r for r in table if f"images/logos/{r[4]}" in used]
    for f in OUT_DIR.glob("*.webp"):
        if f"images/logos/{f.name}" not in used:
            f.unlink()
    CREDITS.write_text(json.dumps(sorted(credits, key=lambda c: c["file"]), ensure_ascii=False, indent=1) + "\n")
    lines = [
        "// Party logos, used to identify each party next to its name. One row per",
        "// party and run of elections that share a logo; `from` and `to` are election",
        "// years. Delete a row to stop showing that logo: the party then shows its",
        "// colour only, and the Credits page drops the matching credit.",
        "// Generated by scripts/logos/fetch-logos.py from scripts/logos/sources.json.",
        "export interface PartyLogoRow { country: string; party: string; from: number; to: number; file: string }",
        "",
        "export const PARTY_LOGOS: PartyLogoRow[] = [",
    ]
    for c, p, a, b, f in table:
        lines.append(f'  {{ country: "{c}", party: "{p}", from: {a}, to: {b}, file: "images/logos/{f}" }},')
    lines += ["];", ""]
    TABLE.write_text("\n".join(lines))
    sizes = [ (OUT_DIR / Path(c["file"]).name).stat().st_size for c in credits ]
    print(f"{len(table)} rows, {len(credits)} files, {sum(sizes)} bytes, largest {max(sizes) if sizes else 0}")


if __name__ == "__main__":
    {"resolve": resolve, "fetch": fetch}[sys.argv[1]]()
