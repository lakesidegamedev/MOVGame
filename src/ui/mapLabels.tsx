import { useEffect, useRef, useState } from "react";

// Region labels for the geographic maps (UK and the multiparty countries).
//
// Labels are sized in screen pixels, not map units, so they stay readable on a
// phone and on tall maps like the UK. They are placed greedily, biggest region
// first: a label that would collide with one already placed drops its second
// line, and if its name still collides it is left off. The region keeps its
// color, its hover title and its tile on the Square view. The selected region
// is always labelled.

export interface MapLabelInput {
  id: string;
  x: number;
  y: number;
  name: string;
  detail: string;
  /** Placement priority, higher first (seats). */
  weight: number;
}

export type MapLabelMode = "full" | "name" | "none";

/** Where a label ends up: its mode and its x, nudged inside the map's edges. */
export interface PlacedLabel {
  mode: MapLabelMode;
  x: number;
}

export interface MapLabelSizes {
  name: number;
  detail: number;
  offset: number;
}

// On-screen sizes in CSS pixels.
const NAME_PX = 13;
const DETAIL_PX = 11;
const GAP_PX = 13;
// Average glyph advance of the bold UI face, as a share of font size.
const ADVANCE = 0.62;

/**
 * Label sizes in map units for an SVG drawn with preserveAspectRatio "meet",
 * measured from its rendered size and updated when it resizes.
 */
export function useMapLabelSizes(viewBox: string) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [pxPerUnit, setPxPerUnit] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const [, , w, h] = viewBox.split(/\s+/).map(Number);
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || !w || !h) return;
      const s = Math.min(r.width / w, r.height / h);
      setPxPerUnit((prev) => (Math.abs(prev - s) > 0.01 ? s : prev));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewBox]);
  const k = 1 / Math.min(3, Math.max(0.25, pxPerUnit));
  const sizes: MapLabelSizes = { name: NAME_PX * k, detail: DETAIL_PX * k, offset: GAP_PX * k };
  return { ref, sizes };
}

interface Box { x0: number; x1: number; y0: number; y1: number }

function textBox(x: number, baseline: number, text: string, size: number): Box {
  const half = (text.length * size * ADVANCE) / 2 + size * 0.15;
  return { x0: x - half, x1: x + half, y0: baseline - size * 0.85, y1: baseline + size * 0.3 };
}

function hit(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/** Width of the map in units, from a "minX minY width height" viewBox. */
export function viewBoxWidth(viewBox: string): number {
  return Number(viewBox.split(/\s+/)[2]) || 560;
}

export function placeMapLabels(
  items: readonly MapLabelInput[], selectedId: string | null, sizes: MapLabelSizes, mapWidth: number,
): Record<string, PlacedLabel> {
  const order = [...items].sort((a, b) =>
    Number(b.id === selectedId) - Number(a.id === selectedId) || b.weight - a.weight || a.id.localeCompare(b.id));
  const placed: Box[] = [];
  const out: Record<string, PlacedLabel> = {};
  const free = (b: Box) => !placed.some((p) => hit(p, b));
  // Keep a label of half-width `half` fully inside the map.
  const clampX = (x: number, half: number) => Math.min(Math.max(x, half), Math.max(half, mapWidth - half));
  for (const it of order) {
    const halfName = (textBox(0, 0, it.name, sizes.name).x1);
    const halfDetail = it.detail ? textBox(0, 0, it.detail, sizes.detail).x1 : 0;
    const xFull = clampX(it.x, Math.max(halfName, halfDetail));
    const xName = clampX(it.x, halfName);
    const name = textBox(xFull, it.y, it.name, sizes.name);
    const detail = it.detail ? textBox(xFull, it.y + sizes.offset, it.detail, sizes.detail) : null;
    const nameOnly = textBox(xName, it.y, it.name, sizes.name);
    if (it.id === selectedId || (free(name) && (!detail || free(detail)))) {
      out[it.id] = { mode: "full", x: xFull };
      placed.push(name);
      if (detail) placed.push(detail);
    } else if (free(nameOnly)) {
      out[it.id] = { mode: "name", x: xName };
      placed.push(nameOnly);
    } else {
      out[it.id] = { mode: "none", x: it.x };
    }
  }
  return out;
}

const LABEL_STYLE = { fill: "#fff", pointerEvents: "none", paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)" } as const;

export function MapLabel({ x, y, name, detail, mode, sizes }: {
  x: number; y: number; name: string; detail: string; mode: MapLabelMode; sizes: MapLabelSizes;
}) {
  if (mode === "none") return null;
  return (
    <>
      <text x={x} y={y} textAnchor="middle" style={{ ...LABEL_STYLE, fontSize: sizes.name, fontWeight: 800, strokeWidth: sizes.name * 0.22 }}>{name}</text>
      {mode === "full" && detail && (
        <text x={x} y={y + sizes.offset} textAnchor="middle" style={{ ...LABEL_STYLE, fontSize: sizes.detail, fontWeight: 700, strokeWidth: sizes.detail * 0.22 }}>{detail}</text>
      )}
    </>
  );
}
