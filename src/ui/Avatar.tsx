import { useState } from "react";
import { portraitFor } from "@content/portraits";

// A round portrait that always renders something: the person's photo when we
// have one, otherwise a colored initials avatar. Photos are licensed Wikimedia
// Commons images (credited on the About page) and load lazily, so a screen
// with many faces only fetches the ones on screen. With `ring`, the avatar
// sits in a ring of the party color, separated by a thin dark line.
export function Avatar({
  name,
  color = "var(--navy-500)",
  size = 44,
  ring = false,
  ringColor,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
  /** Ring color when it must differ from the fill (on a party-colored banner). */
  ringColor?: string;
}) {
  const src = portraitFor(name);
  const [failed, setFailed] = useState(false);
  const ringWidth = size >= 48 ? 3 : 2;
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    boxSizing: "border-box",
    border: ring ? `${ringWidth}px solid ${ringColor ?? color}` : "2px solid var(--border)",
    boxShadow: ring ? "inset 0 0 0 1px rgba(0, 0, 0, 0.55)" : undefined,
  } as const;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ ...base, objectFit: "cover", background: color }}
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        ...base,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: Math.round(size * 0.38),
        color: "#fff",
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}

/**
 * Party id to leader name, for the parties that have a named leader. Parties
 * without one get a placeholder name ("LAB leader") from the engines, which
 * would only make a meaningless initials avatar, so they are left out.
 */
export function namedLeaders(leaders: Record<string, { name: string } | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [party, leader] of Object.entries(leaders)) {
    if (leader?.name && !/ leader$/.test(leader.name)) out[party] = leader.name;
  }
  return out;
}
