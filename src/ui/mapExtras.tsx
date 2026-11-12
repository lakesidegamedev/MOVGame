// Shared pieces of the real-geography country maps: inert land and inset
// frames. Every map view draws both the same way, so a place that does not
// vote never looks like a region and an inset box never looks like a place.

// Land with no vote in this election, under the regions. Neutral, unlabelled,
// hidden from assistive tech and from the pointer.
export function InertLand({ paths }: { paths?: readonly string[] }) {
  if (!paths?.length) return null;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {paths.map((d, i) => <path key={i} d={d} fill="var(--gray-650)" stroke="var(--gray-500)" strokeWidth={0.75} />)}
    </g>
  );
}

// The dashed frame that marks an inset box (it stands for voters, not a
// place), drawn over the region's fill.
export function InsetFrames({ shapes }: { shapes: Record<string, { d: string; inset?: boolean }> }) {
  const insets = Object.entries(shapes).filter(([, s]) => s.inset);
  if (!insets.length) return null;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {insets.map(([id, s]) => <path key={id} d={s.d} fill="none" stroke="var(--text-2)" strokeWidth={1.5} strokeDasharray="5 4" />)}
    </g>
  );
}
