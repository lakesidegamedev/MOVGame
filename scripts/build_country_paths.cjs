// Generates real-geography SVG map shape files for Canada, Germany, France,
// Australia, New Zealand, Brazil, India and Japan (src/content/countries/paths/*.ts), following the UK
// pipeline in scripts/build_uk_paths.cjs:
//   source geo data -> (optional group union) -> equirectangular lat-corrected
//   projection -> Douglas-Peucker simplify -> viewBox fit -> TS emit.
//
// Sources (download to the scratchpad dir first, see SRC below):
//   CA/AU: Natural Earth ne_50m_admin_1_states_provinces.geojson
//          https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
//   DE:    isellsoap/deutschlandGeoJSON 2_bundeslaender/3_mittel.geo.json
//          https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/3_mittel.geo.json
//   FR:    gregoiredavid/france-geojson regions.geojson (post-2016 régions)
//          https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson
//   NZ/IN/IE: Natural Earth ne_10m_admin_1_states_provinces.geojson (saved as ne10_admin1.geojson)
//          https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
//   BR:    the same Natural Earth ne10_admin1.geojson (states of Brazil, adm0_a3 BRA)
//
// Merged groups (CA NORTH, DE NORTH/NE/EAST/WEST) are geometrically unioned by
// edge cancellation: shared borders in these datasets carry identical vertex
// sequences, so interior edges appear twice (opposite directions) and are
// dropped, then the remaining boundary edges are stitched back into rings.
//
// Usage: node scripts/build_country_paths.cjs [srcDir] [--only=NZ,CA]
// --only rebuilds just the listed countries and needs only their sources;
// the other generated files are left untouched.

const fs = require("fs");
const path = require("path");

const ARGS = process.argv.slice(2);
const SRC_DIR = ARGS.find((a) => !a.startsWith("--")) || "/tmp/claude-0/-root/1bb8134f-b1af-4382-9ecf-16d0bbdddf08/scratchpad";
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "").slice("--only=".length).split(",").filter(Boolean);
const wants = (code) => ONLY.length === 0 || ONLY.includes(code);
const OUT_DIR = path.join(__dirname, "..", "src", "content", "countries", "paths");

// ---------------------------------------------------------------- geo input
// Normalise a GeoJSON feature geometry to an array of polygons; each polygon
// is an array of rings; each ring an array of [lon, lat].
function featurePolygons(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates];
  if (geom.type === "MultiPolygon") return geom.coordinates;
  return [];
}

// ------------------------------------------------------- union of adjacency
// Union adjacent polygons that share identical border vertex sequences.
// Input: array of polygons (array of rings). Output: array of rings.
// Throws if any boundary chain fails to close (vertex mismatch => fall back).
function unionByEdgeCancellation(polygons) {
  const q = (n) => Math.round(n * 1e6);
  const pk = (p) => q(p[0]) + "," + q(p[1]);
  const ek = (a, b) => pk(a) + "|" + pk(b);
  const edges = new Map(); // key -> [a, b]
  for (const poly of polygons) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i], b = ring[i + 1];
        if (pk(a) === pk(b)) continue; // degenerate
        const rk = ek(b, a);
        if (edges.has(rk)) edges.delete(rk); // interior edge: cancel
        else edges.set(ek(a, b), [a, b]);
      }
    }
  }
  const byStart = new Map(); // point key -> [edge keys...]
  for (const [k, [a]] of edges) {
    const sk = pk(a);
    if (!byStart.has(sk)) byStart.set(sk, []);
    byStart.get(sk).push(k);
  }
  const used = new Set();
  const rings = [];
  for (const [k0, [a0, b0]] of edges) {
    if (used.has(k0)) continue;
    used.add(k0);
    const ring = [a0, b0];
    let cur = b0;
    let guard = edges.size + 2;
    while (pk(cur) !== pk(a0)) {
      if (--guard <= 0) throw new Error("union: unclosed boundary chain");
      const cands = (byStart.get(pk(cur)) || []).filter((k) => !used.has(k));
      if (!cands.length) throw new Error("union: dead-end boundary chain");
      const k = cands[0];
      used.add(k);
      cur = edges.get(k)[1];
      ring.push(cur);
    }
    rings.push(ring);
  }
  return rings;
}

// --------------------------------------------- half-plane clip (lon/lat space)
// Sutherland-Hodgman against one half-plane: keeps the side of the directed
// line a->b where cross((b-a),(p-a)) has the sign `side` (+1 left, -1 right).
// Used to split one administrative region along a straight cut line.
function clipRing(ring, a, b, side) {
  const val = (p) => side * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
  const pts = ring.slice(0, -1);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
    const vc = val(cur), vp = val(prev);
    if (vc >= 0) {
      if (vp < 0) out.push(intersect(prev, cur, vp, vc));
      out.push(cur);
    } else if (vp >= 0) out.push(intersect(prev, cur, vp, vc));
  }
  if (out.length < 3) return null;
  out.push(out[0]);
  return out;
}
function intersect(p, q, vp, vq) {
  const t = vp / (vp - vq);
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}
// Clip every outer ring of every polygon (holes dropped: the sources used
// with this have none that survive simplification).
function clipPolygons(polys, cuts) {
  const out = [];
  for (const poly of polys) {
    let ring = poly[0];
    for (const [a, b, side] of cuts) { if (ring) ring = clipRing(ring, a, b, side); }
    if (ring) out.push([ring]);
  }
  return out;
}

// -------------------------------------------------------- simplify (px space)
function rdp(points, eps) {
  if (points.length < 3) return points;
  let dmax = 0, idx = 0;
  const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
// Split a closed ring at its farthest vertex into two open arcs (RDP degrades
// on closed rings whose endpoints coincide), simplify each, re-close.
function simplifyRing(ring, eps) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  if (open.length < 4) return ring;
  let far = 0, fd = -1;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  const a = rdp(open.slice(0, far + 1), eps);
  const b = rdp(open.slice(far).concat([open[0]]), eps);
  const merged = a.slice(0, -1).concat(b.slice(0, -1));
  merged.push(merged[0]);
  return merged;
}

// ------------------------------------------------------------ build country
// cfg: { name, constName, sourceNote, lat0, eps, minIslandPx, clip?, order,
//        regions: id -> array of polygons (lon/lat), labelNudge?: id -> [dx,dy] }
function buildCountry(cfg) {
  const k = Math.cos((cfg.lat0 * Math.PI) / 180);
  const project = ([lon, lat]) => [lon * k, lat];
  const inClip = ([lon, lat]) =>
    !cfg.clip || (lon >= cfg.clip[0] && lon <= cfg.clip[2] && lat >= cfg.clip[1] && lat <= cfg.clip[3]);

  // clip whole rings whose every vertex is outside the clip box (far islands)
  const regions = {};
  for (const id of cfg.order) {
    const polys = cfg.regions[id];
    if (!polys || !polys.length) throw new Error(`${cfg.name}: missing region ${id}`);
    regions[id] = polys
      .map((poly) => poly.filter((ring) => ring.some(inClip)))
      .filter((poly) => poly.length);
  }

  // projected bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of cfg.order)
    for (const poly of regions[id]) for (const ring of poly) for (const pt of ring) {
      const [x, y] = project(pt);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }

  const PAD = 8, W = 560;
  const sx = (W - PAD * 2) / (maxX - minX);
  const H = Math.round((maxY - minY) * sx + PAD * 2);
  const tx = (x) => PAD + (x - minX) * sx;
  const ty = (y) => PAD + (maxY - y) * sx; // flip vertical

  const round = (n) => Math.round(n * 10) / 10;
  const shapes = {};
  for (const id of cfg.order) {
    let d = "";
    let bestArea = 0, bestCentroid = null;
    for (const poly of regions[id]) {
      for (const rawRing of poly) {
        let ring = rawRing.map((pt) => { const [x, y] = project(pt); return [tx(x), ty(y)]; });
        // drop tiny islands to keep paths clean
        let rminx = Infinity, rminy = Infinity, rmaxx = -Infinity, rmaxy = -Infinity;
        for (const [x, y] of ring) {
          if (x < rminx) rminx = x; if (x > rmaxx) rmaxx = x;
          if (y < rminy) rminy = y; if (y > rmaxy) rmaxy = y;
        }
        if (Math.max(rmaxx - rminx, rmaxy - rminy) < cfg.minIslandPx) continue;
        ring = simplifyRing(ring, cfg.eps);
        if (ring.length < 4) continue;
        d += "M" + ring.map(([x, y]) => `${round(x)},${round(y)}`).join("L") + "Z";
        // shoelace area + centroid (largest ring wins the label)
        let a6 = 0, accx = 0, accy = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
          const cross = x1 * y2 - x2 * y1;
          a6 += cross; accx += (x1 + x2) * cross; accy += (y1 + y2) * cross;
        }
        const area = Math.abs(a6 / 2);
        if (area > bestArea) {
          bestArea = area;
          bestCentroid = [accx / (3 * a6), accy / (3 * a6)];
        }
      }
    }
    if (!d) throw new Error(`${cfg.name}: region ${id} produced an empty path`);
    const nudge = (cfg.labelNudge && cfg.labelNudge[id]) || [0, 0];
    shapes[id] = {
      d,
      label: bestCentroid
        ? [round(bestCentroid[0] + nudge[0]), round(bestCentroid[1] + nudge[1])]
        : [W / 2, H / 2],
    };
  }
  return { viewBox: `0 0 ${W} ${H}`, W, H, shapes, cfg };
}

// ------------------------------------------------------------------- emit TS
function emit(built, file) {
  const { cfg, viewBox, shapes } = built;
  let out = `// AUTO-GENERATED by scripts/build_country_paths.cjs from ${cfg.sourceNote}.\n`;
  out += `// Do not hand-edit. Regenerate with: node scripts/build_country_paths.cjs\n`;
  out += `// Equirectangular projection (cos(${cfg.lat0}°) lat correction), Douglas-Peucker simplified.\n`;
  if (cfg.extraNote) out += `// ${cfg.extraNote}\n`;
  out += `\nimport type { CountryMapShapes } from "@engine/countryGame";\n\n`;
  out += `export const ${cfg.constName}: CountryMapShapes = {\n`;
  out += `  viewBox: "${viewBox}",\n`;
  out += `  shapes: {\n`;
  for (const id of cfg.order) {
    const s = shapes[id];
    out += `    ${id}: { d: "${s.d}", label: [${s.label[0]}, ${s.label[1]}] },\n`;
  }
  out += `  },\n};\n`;
  fs.writeFileSync(file, out);
  return out.length;
}

// -------------------------------------------------------------- load sources
const readSrc = (name) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, name)));
const ne50 = wants("CA") || wants("AU") ? readSrc("ne50_admin1.geojson") : null;
const deSrc = wants("DE") ? readSrc("de_laender.geojson") : null;
const frSrc = wants("FR") ? readSrc("fr_regions.geojson") : null;
// Natural Earth 10m admin-1, shared by every country built from it.
const ne10 = readSrc("ne10_admin1.geojson");

function neCountry(a3, source = ne50) {
  const m = {};
  for (const f of source.features) {
    if (f.properties.adm0_a3 !== a3) continue;
    m[f.properties.name] = featurePolygons(f.geometry);
  }
  return m;
}

// Map region groups; single-member groups pass through, multi-member groups
// are unioned (fallback: plain concatenation if the union fails to close).
function groupRegions(byName, groups, countryLabel) {
  const out = {};
  for (const [id, members] of Object.entries(groups)) {
    const polys = [];
    for (const name of members) {
      if (!byName[name]) throw new Error(`${countryLabel}: source missing "${name}"`);
      polys.push(...byName[name]);
    }
    if (members.length === 1) { out[id] = polys; continue; }
    try {
      out[id] = [unionByEdgeCancellation(polys)]; // one polygon, many rings
      console.log(`${countryLabel} ${id}: union OK (${members.length} members -> ${out[id][0].length} rings)`);
    } catch (e) {
      console.warn(`${countryLabel} ${id}: union failed (${e.message}), concatenating members`);
      out[id] = polys;
    }
  }
  return out;
}

// --------------------------------------------------------------------- CA
const CA = wants("CA") && buildCountry({
  name: "Canada", constName: "CA_MAP",
  sourceNote: "Natural Earth ne_50m_admin_1_states_provinces (CAN)",
  extraNote: "NORTH = Yukon + Northwest Territories + Nunavut merged (arc-cancellation union).",
  lat0: 60, eps: 1.1, minIslandPx: 7,
  order: ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "NORTH"],
  regions: groupRegions(neCountry("CAN"), {
    BC: ["British Columbia"], AB: ["Alberta"], SK: ["Saskatchewan"], MB: ["Manitoba"],
    ON: ["Ontario"], QC: ["Québec"], NB: ["New Brunswick"], NS: ["Nova Scotia"],
    PE: ["Prince Edward Island"], NL: ["Newfoundland and Labrador"],
    NORTH: ["Yukon", "Northwest Territories", "Nunavut"],
  }, "CA"),
  // NORTH's largest ring is the merged mainland; nudge the label toward the
  // NWT/Nunavut mainland's visual middle if the centroid drifts.
  labelNudge: { NORTH: [0, 20] },
});

// --------------------------------------------------------------------- DE
const deNames = {};
if (deSrc) for (const f of deSrc.features) deNames[f.properties.name] = featurePolygons(f.geometry);
const DE = wants("DE") && buildCountry({
  name: "Germany", constName: "DE_MAP",
  sourceNote: "isellsoap/deutschlandGeoJSON 2_bundeslaender/3_mittel.geo.json",
  extraNote: "Grouped Länder (NORTH/NE/EAST/WEST) merged via arc-cancellation union.",
  lat0: 51, eps: 0.6, minIslandPx: 4,
  order: ["NORTH", "NE", "NRW", "EAST", "WEST", "BW", "BAV"],
  regions: groupRegions(deNames, {
    NORTH: ["Niedersachsen", "Schleswig-Holstein", "Hamburg", "Bremen"],
    NE: ["Berlin", "Brandenburg", "Mecklenburg-Vorpommern"],
    NRW: ["Nordrhein-Westfalen"],
    EAST: ["Sachsen", "Sachsen-Anhalt", "Thüringen"],
    WEST: ["Hessen", "Rheinland-Pfalz", "Saarland"],
    BW: ["Baden-Württemberg"],
    BAV: ["Bayern"],
  }, "DE"),
});

// --------------------------------------------------------------------- FR
const FR_CODE2ID = {
  32: "HDF", 28: "NOR", 44: "GE", 53: "BRE", 52: "PDL", 11: "IDF",
  27: "BFC", 24: "CVL", 75: "NAQ", 84: "ARA", 76: "OCC", 93: "PACA",
  94: "COM", // Corse stands in for the bundle's "Corse & Outre-mer" unit
};
const frRegions = {};
if (frSrc) for (const f of frSrc.features) {
  const id = FR_CODE2ID[Number(f.properties.code)];
  if (id) frRegions[id] = featurePolygons(f.geometry);
}
const FR = wants("FR") && buildCountry({
  name: "France", constName: "FR_MAP",
  sourceNote: "gregoiredavid/france-geojson regions.geojson (post-2016 régions)",
  extraNote: "COM = Corse shape standing in for the bundle's \"Corse & Outre-mer\" unit.",
  lat0: 46.5, eps: 0.6, minIslandPx: 3,
  order: ["HDF", "NOR", "GE", "BRE", "PDL", "IDF", "BFC", "CVL", "NAQ", "ARA", "OCC", "PACA", "COM"],
  regions: frRegions,
});

// --------------------------------------------------------------------- AU
// neCountry("AUS") includes Jervis Bay Territory (excluded below)
const AU = wants("AU") && buildCountry({
  name: "Australia", constName: "AU_MAP",
  sourceNote: "Natural Earth ne_50m_admin_1_states_provinces (AUS)",
  extraNote: "Clipped to the mainland + Tasmania box (drops Macquarie, Lord Howe etc.); ACT drawn last so the enclave sits above NSW.",
  lat0: -25, eps: 1.0, minIslandPx: 5,
  clip: [111.5, -44.5, 155.5, -9.0], // lonMin, latMin, lonMax, latMax
  order: ["WA", "NT", "SA", "QLD", "NSW", "VIC", "TAS", "ACT"],
  regions: groupRegions(neCountry("AUS"), {
    NSW: ["New South Wales"], VIC: ["Victoria"], QLD: ["Queensland"],
    WA: ["Western Australia"], SA: ["South Australia"], TAS: ["Tasmania"],
    NT: ["Northern Territory"], ACT: ["Australian Capital Territory"],
  }, "AU"),
});

// --------------------------------------------------------------------- NZ
// Ten units: nine groups of regional councils (Auckland split in three along
// straight cut lines that follow the Waitematā Harbour and the Ōtāhuhu
// isthmus) plus the Māori electorates, which cover the whole country and are
// drawn as an inset box in the Tasman Sea.
function nzRegions() {
  const nz = neCountry("NZL", ne10);
  const auckland = nz["Auckland"];
  // Directed cut lines in lon/lat; side +1 keeps the left of a->b.
  const harbour = [[174.40, -36.88], [174.90, -36.84]];   // west -> east
  const isthmus = [[174.55, -36.99], [175.00, -36.87]];   // west -> east
  const north = clipPolygons(auckland, [[...harbour, +1]]);
  const middle = clipPolygons(auckland, [[...harbour, -1], [...isthmus, +1]]);
  const south = clipPolygons(auckland, [[...isthmus, -1]]);
  const box = (lon0, lat0, lon1, lat1) => [[[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]]];
  const merged = groupRegions(nz, {
    WBP: ["Waikato", "Bay of Plenty"],
    CNI: ["Taranaki", "Manawatu-Wanganui", "Hawke's Bay", "Gisborne District"],
    WGN: ["Wellington"],
    UPS: ["Tasman District", "Nelson City", "Marlborough District", "West Coast"],
    CAN: ["Canterbury"],
    OTS: ["Otago", "Southland"],
  }, "NZ");
  return {
    NTH: [...nz["Northland"], ...north],
    AKC: middle,
    AKS: south,
    ...merged,
    MAO: box(167.2, -35.6, 170.6, -37.4),
  };
}
const NZ = wants("NZ") && buildCountry({
  name: "New Zealand", constName: "NZ_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (NZL)",
  extraNote: "Auckland split along straight cut lines; MAO (Māori electorates) is an inset box, not a place.",
  lat0: -41, eps: 0.9, minIslandPx: 5,
  clip: [166.0, -47.5, 179.0, -34.0], // mainland + Stewart Island; drops Chathams and the subantarctic islands
  order: ["NTH", "AKC", "AKS", "WBP", "CNI", "WGN", "UPS", "CAN", "OTS", "MAO"],
  regions: nzRegions(),
});

// --------------------------------------------------------------------- BR
// Twelve units built from the 27 states: São Paulo, Minas Gerais, Rio de
// Janeiro, Bahia, Espírito Santo and Rio Grande do Sul on their own; the rest are contiguous
// groups of states (Paraná and Santa Catarina; Ceará, Piauí and Maranhão;
// Pernambuco and the eastern Northeast; the Centre-West with the Federal
// District; Pará, Amapá and Tocantins; the western Amazon). The clip box
// drops Fernando de Noronha, Trindade and the other ocean islands.
const BR = wants("BR") && buildCountry({
  name: "Brazil", constName: "BR_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (BRA)",
  extraNote: "Twelve units: six states alone, six contiguous groups of states (arc-cancellation union). Ocean islands clipped.",
  lat0: -15, eps: 1.0, minIslandPx: 5,
  clip: [-75.0, -34.5, -33.0, 5.5], // lonMin, latMin, lonMax, latMax
  order: ["AMZ", "NOR", "CPM", "PNE", "CW", "BA", "MG", "ES", "PRSC", "SP", "RJ", "RS"],
  regions: groupRegions(neCountry("BRA", ne10), {
    AMZ: ["Amazonas", "Acre", "Rondônia", "Roraima"],
    NOR: ["Pará", "Amapá", "Tocantins"],
    CPM: ["Ceará", "Piauí", "Maranhão"],
    PNE: ["Pernambuco", "Paraíba", "Rio Grande do Norte", "Alagoas", "Sergipe"],
    CW: ["Goiás", "Distrito Federal", "Mato Grosso", "Mato Grosso do Sul"],
    BA: ["Bahia"], MG: ["Minas Gerais"], ES: ["Espírito Santo"],
    PRSC: ["Paraná", "Santa Catarina"], SP: ["São Paulo"], RJ: ["Rio de Janeiro"],
    RS: ["Rio Grande do Sul"],
  }, "BR"),
});

// --------------------------------------------------------------------- IN
// Fifteen groups of states and union territories. The Andaman and Nicobar and
// Lakshadweep island groups vote with West Bengal and Kerala but are not drawn.
const inRegionPolys = () => {
  const ind = neCountry("IND", ne10);
  const merged = groupRegions(ind, {
    BJ: ["Bihar", "Jharkhand"],
    MP: ["Madhya Pradesh", "Chhattisgarh"],
    GR: ["Gujarat", "Rajasthan", "Dadra and Nagar Haveli and Daman and Diu"],
    MH: ["Maharashtra", "Goa"],
    DH: ["Delhi", "Haryana", "Chandigarh"],
    HM: ["Himachal Pradesh", "Uttarakhand", "Jammu and Kashmir", "Ladakh"],
    TN: ["Tamil Nadu", "Puducherry"],
    AT: ["Andhra Pradesh", "Telangana"],
    NE: ["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"],
  }, "IN");
  return {
    UP: ind["Uttar Pradesh"],
    ...merged,
    PB: ind["Punjab"], KA: ind["Karnataka"], KL: ind["Kerala"],
    WB: ind["West Bengal"], OD: ind["Odisha"],
  };
};
const IN = wants("IN") && buildCountry({
  name: "India", constName: "IN_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (IND)",
  extraNote: "Island territories (Andaman and Nicobar, Lakshadweep) vote with West Bengal and Kerala and are not drawn.",
  lat0: 22, eps: 0.9, minIslandPx: 4,
  order: ["UP", "BJ", "MP", "GR", "MH", "DH", "PB", "HM", "KA", "KL", "TN", "AT", "WB", "OD", "NE"],
  regions: inRegionPolys(),
});

// --------------------------------------------------------------------- ES
// Fourteen units: the autonomous communities, with the small ones merged
// (Castilla-La Mancha with Extremadura, Navarre with La Rioja, Asturias with
// Cantabria). Source features are provinces, grouped by community. Ceuta and
// Melilla are under a pixel across at this scale and are dropped from the
// drawing; their seats are counted with Andalusia. The Canary Islands are
// shifted north-east into an inset in the sea off Cadiz, as on any map of Spain.
function esRegions() {
  const es = neCountry("ESP", ne10);
  const shift = (polys, dLon, dLat) => polys.map((poly) => poly.map((ring) => ring.map(([lon, lat]) => [lon + dLon, lat + dLat])));
  const merged = groupRegions(es, {
    AND: ["Huelva", "Cádiz", "Sevilla", "Córdoba", "Jaén", "Málaga", "Granada", "Almería"],
    CAT: ["Lérida", "Gerona", "Barcelona", "Tarragona"],
    VAL: ["Castellón", "Valencia", "Alicante"],
    GAL: ["La Coruña", "Lugo", "Orense", "Pontevedra"],
    PV: ["Álava", "Bizkaia", "Gipuzkoa"],
    CYL: ["León", "Zamora", "Salamanca", "Ávila", "Segovia", "Valladolid", "Palencia", "Burgos", "Soria"],
    CLE: ["Cáceres", "Badajoz", "Toledo", "Ciudad Real", "Cuenca", "Albacete", "Guadalajara"],
    ARA: ["Huesca", "Zaragoza", "Teruel"],
    NAV: ["Navarra", "La Rioja"],
    AST: ["Asturias", "Cantabria"],
    CAN: ["Santa Cruz de Tenerife", "Las Palmas"],
  }, "ES");
  return {
    ...merged,
    MAD: es["Madrid"],
    MUR: es["Murcia"],
    BAL: es["Baleares"],
    CAN: shift(merged.CAN, 8.2, 6.4),
  };
}
const ES = wants("ES") && buildCountry({
  name: "Spain", constName: "ES_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (ESP, provinces grouped by community)",
  extraNote: "Ceuta and Melilla are not drawn (counted with Andalusia); CAN (Canary Islands) is shifted into an inset off the Andalusian coast.",
  lat0: 40, eps: 0.8, minIslandPx: 3.5,
  order: ["AND", "CAT", "MAD", "VAL", "GAL", "PV", "CYL", "CLE", "ARA", "NAV", "MUR", "AST", "BAL", "CAN"],
  regions: esRegions(),
});

// --------------------------------------------------------------------- IE
// Ten units built from the 26 county-level features (Natural Earth lists Cork,
// Galway, Limerick and Waterford as a city and a county each). Dublin is cut
// three ways to match the bundle: DNO (Fingal and the city north of the
// Liffey), DSO (Dun Laoghaire-Rathdown and the city south of the Liffey) and
// DWE (South Dublin plus the Castleknock and Blanchardstown corner of Fingal).
// Northern Ireland is left blank: the Dail has no seats there.
const ie10 = wants("IE") ? readSrc("ne10_admin1.geojson") : null;
function ieRegions() {
  const by = {};
  for (const f of ie10.features) {
    if (f.properties.adm0_a3 !== "IRL") continue;
    const key = f.properties.name.startsWith("D\u00fan Laoghaire") ? "DLR" : f.properties.name;
    (by[key] ||= []).push(...featurePolygons(f.geometry));
  }
  // Directed cut lines in lon/lat; side +1 keeps the left of a->b.
  const liffey = [[-6.60, 53.356], [-6.10, 53.346]];     // west -> east
  const westEdge = [[-6.29, 53.20], [-6.29, 53.60]];     // south -> north, west is left
  const northEdge = [[-6.60, 53.43], [-6.00, 53.43]];    // west -> east, south is right
  const dublinN = clipPolygons(by["Dublin"], [[...liffey, +1]]);
  const dublinS = clipPolygons(by["Dublin"], [[...liffey, -1]]);
  const fingalWest = clipPolygons(by["Fingal"], [[...westEdge, +1], [...northEdge, -1]]);
  const fingalRest = [
    ...clipPolygons(by["Fingal"], [[...westEdge, -1]]),
    ...clipPolygons(by["Fingal"], [[...westEdge, +1], [...northEdge, +1]]),
  ];
  const merged = groupRegions(by, {
    CMB: ["Meath", "Kildare", "Wicklow"],
    SEA: ["Carlow", "Kilkenny", "Waterford", "Wexford"],
    MID: ["Longford", "Westmeath", "Laoighis", "Offaly"],
    COR: ["Cork"],
    MUN: ["Kerry", "Limerick", "Clare", "North Tipperary", "South Tipperary"],
    WES: ["Mayo", "Galway", "Roscommon"],
    BOR: ["Donegal", "Cavan", "Monaghan", "Louth", "Sligo", "Leitrim"],
  }, "IE");
  return {
    DNO: [...dublinN, ...fingalRest],
    DSO: [...dublinS, ...by["DLR"]],
    DWE: [...by["South Dublin"], ...fingalWest],
    ...merged,
  };
}
const IE = wants("IE") && buildCountry({
  name: "Ireland", constName: "IE_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (IRL)",
  extraNote: "Dublin cut three ways along straight lines (the Liffey, and Castleknock for the west); Northern Ireland left blank.",
  lat0: 53.4, eps: 0.8, minIslandPx: 4,
  clip: [-10.8, 51.3, -5.9, 55.5], // drops nothing but stray rocks
  order: ["BOR", "WES", "MID", "CMB", "DNO", "DSO", "DWE", "SEA", "MUN", "COR"],
  regions: ieRegions(),
  // The three Dublin shapes are tiny: push their labels out into open space.
  labelNudge: { DNO: [8, -16], DWE: [-26, 6], DSO: [14, 18] },
});

// --------------------------------------------------------------------- JP
// Eleven units: the proportional blocks of the House of Representatives, each
// a group of prefectures. Okinawa belongs to the Kyushu block and is drawn as
// an inset shifted north so it sits west of Kyushu; Tokyo also gets a 2.4x
// magnified copy in the Pacific; the far southern island chains (Amami, Tokara, Izu,
// Ogasawara) are dropped.
function jpRegions() {
  const jp = neCountry("JPN", ne10);
  const ringMinLat = (ring) => Math.min(...ring.map((p) => p[1]));
  // Keep only polygons whose outer ring lies north of a latitude.
  const northOf = (polys, lat) => polys.filter((poly) => ringMinLat(poly[0]) >= lat);
  const shift = (polys, dlon, dlat) => polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [x + dlon, y + dlat])));
  jp["Kagoshima"] = northOf(jp["Kagoshima"], 30.0);
  // Tokyo is a speck at map scale. Keep its true outline and add a magnified
  // copy in the Pacific off Chiba (a lens) so the block can be read and
  // tapped. Both pieces belong to the one TKY shape.
  const scaleAbout = (polys, cx, cy, k) => polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k])));
  const tokyo = northOf(jp["Tokyo"], 35.3);
  const lens = shift(scaleAbout(tokyo, 139.5, 35.7, 2.4), 3.4, 0.2);
  jp["Tokyo"] = [...tokyo, ...lens];
  const okinawa = shift(jp["Okinawa"], 0, 4.2);
  const merged = groupRegions(jp, {
    HKD: ["Hokkaidō"],
    TOH: ["Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima"],
    NKT: ["Ibaraki", "Tochigi", "Gunma", "Saitama"],
    SKT: ["Chiba", "Kanagawa", "Yamanashi"],
    TKY: ["Tokyo"],
    HSN: ["Niigata", "Toyama", "Ishikawa", "Fukui", "Nagano"],
    TKI: ["Gifu", "Shizuoka", "Aichi", "Mie"],
    KNK: ["Shiga", "Kyōto", "Ōsaka", "Hyōgo", "Nara", "Wakayama"],
    CHG: ["Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi"],
    SHK: ["Tokushima", "Kagawa", "Ehime", "Kōchi"],
  }, "JP");
  const kyushu = groupRegions(jp, { KYU: ["Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Ōita", "Miyazaki", "Kagoshima"] }, "JP");
  kyushu.KYU = [...kyushu.KYU, ...okinawa];
  return { ...merged, ...kyushu };
}
const JP = wants("JP") && buildCountry({
  name: "Japan", constName: "JP_MAP",
  sourceNote: "Natural Earth ne_10m_admin_1_states_provinces (JPN)",
  extraNote: "Regions are the 11 proportional blocks. Okinawa (Kyushu block) is an inset shifted north; Tokyo carries a 2.4x magnified lens copy in the Pacific so it can be tapped; Amami, Tokara, Izu and Ogasawara are dropped.",
  labelNudge: { KYU: [10, -14], SKT: [15, 12], NKT: [-2, -4] },
  lat0: 36, eps: 0.8, minIslandPx: 4,
  clip: [122.5, 27.8, 145.9, 45.9],
  order: ["HKD", "TOH", "NKT", "SKT", "HSN", "TKI", "KNK", "CHG", "SHK", "KYU", "TKY"],
  regions: jpRegions(),
});

// ------------------------------------------------------------------- write
fs.mkdirSync(OUT_DIR, { recursive: true });
const files = [
  [CA, "ca.ts"],
  [DE, "de.ts"],
  [FR, "fr.ts"],
  [AU, "au.ts"],
  [NZ, "nz.ts"],
  [BR, "br.ts"],
  [IN, "in.ts"],
  [ES, "es.ts"],
  [IE, "ie.ts"],
  [JP, "jp.ts"],
].filter(([built]) => built);
for (const [built, name] of files) {
  const bytes = emit(built, path.join(OUT_DIR, name));
  console.log(`${name}: ${(bytes / 1024).toFixed(1)} KB, viewBox ${built.viewBox}`);
}

// -------------------------------------------------------------- assertions
function assertCountry(built, expectIds, aspectMin, aspectMax) {
  const { cfg, shapes, W, H } = built;
  const ids = Object.keys(shapes).sort();
  const want = expectIds.slice().sort();
  if (JSON.stringify(ids) !== JSON.stringify(want))
    throw new Error(`${cfg.name}: region ids ${ids} != expected ${want}`);
  const aspect = W / H;
  if (aspect < aspectMin || aspect > aspectMax)
    throw new Error(`${cfg.name}: aspect ${aspect.toFixed(2)} outside [${aspectMin}, ${aspectMax}]`);
  for (const [id, s] of Object.entries(shapes)) {
    if (!s.d || /NaN/.test(s.d)) throw new Error(`${cfg.name} ${id}: bad path data`);
    if (!/^M[-\d.,LMZ]+Z$/.test(s.d)) throw new Error(`${cfg.name} ${id}: malformed path`);
    const [lx, ly] = s.label;
    if (!Number.isFinite(lx) || !Number.isFinite(ly)) throw new Error(`${cfg.name} ${id}: NaN label`);
    if (lx < 0 || lx > W || ly < 0 || ly > H) throw new Error(`${cfg.name} ${id}: label [${lx},${ly}] outside viewBox 0 0 ${W} ${H}`);
    // every path coordinate inside the viewBox (with rounding slack)
    for (const m of s.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      if (x < -1 || x > W + 1 || y < -1 || y > H + 1)
        throw new Error(`${cfg.name} ${id}: point [${x},${y}] outside viewBox`);
    }
  }
}
if (CA) assertCountry(CA, ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "NORTH"], 0.75, 1.6); // wide-ish
if (DE) assertCountry(DE, ["NORTH", "NE", "NRW", "EAST", "WEST", "BW", "BAV"], 0.55, 0.95); // tall
if (FR) assertCountry(FR, ["HDF", "NOR", "GE", "BRE", "PDL", "IDF", "BFC", "CVL", "NAQ", "ARA", "OCC", "PACA", "COM"], 0.8, 1.3); // squarish
if (AU) assertCountry(AU, ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"], 1.0, 1.6); // wide
if (NZ) assertCountry(NZ, ["NTH", "AKC", "AKS", "WBP", "CNI", "WGN", "UPS", "CAN", "OTS", "MAO"], 0.55, 0.95); // tall
if (BR) assertCountry(BR, ["AMZ", "NOR", "CPM", "PNE", "CW", "BA", "MG", "ES", "PRSC", "SP", "RJ", "RS"], 0.85, 1.25); // squarish
if (IN) assertCountry(IN, ["UP", "BJ", "MP", "GR", "MH", "DH", "PB", "HM", "KA", "KL", "TN", "AT", "WB", "OD", "NE"], 0.8, 1.15); // squarish
if (ES) assertCountry(ES, ["AND", "CAT", "MAD", "VAL", "GAL", "PV", "CYL", "CLE", "ARA", "NAV", "MUR", "AST", "BAL", "CAN"], 1.0, 1.9); // wide
if (IE) assertCountry(IE, ["BOR", "WES", "MID", "CMB", "DNO", "DSO", "DWE", "SEA", "MUN", "COR"], 0.55, 0.95); // tall-ish
if (JP) assertCountry(JP, ["HKD", "TOH", "NKT", "SKT", "TKY", "HSN", "TKI", "KNK", "CHG", "SHK", "KYU"], 0.8, 1.3); // squarish
console.log("All assertions passed.");
