# Web UI system

The web game (and the desktop app, which shows the same build) uses one set of
design tokens and one set of component classes. This page is the reference for
anyone adding or restyling a screen.

## Stylesheets

`src/ui/styles.css` is the entry. It imports, in this order:

| File | Holds |
| --- | --- |
| `styles/tokens.css` | Every CSS variable: ramps, semantic colors, spacing, type, radii, elevation, layers, motion. |
| `styles/base.css` | Reset, document type, focus ring, keyframes, reduced motion. |
| `styles/components.css` | Buttons, cards, chips and tags, segmented controls and tabs, tables and stat rows, meters, form controls, tooltip, modals and sheets, toast, utilities. |
| `styles/desk.css` | The campaign desk: top bar, ticker, map, state and region panels, action panel, week planner. |
| `styles/overlays.css` | In-game overlays: event, debate, recap, stats, guide, candidates, timeline. |
| `styles/setup.css` | Setup wizard and election pickers. |
| `styles/results.css` | Results screens. |
| `styles/responsive.css` | Phone and tablet overrides for the game screens. |
| `styles/landing.css` | Landing page and the election library. |
| `styles/account.css` | Sign-in, account, notices. |
| `styles/editor.css` | Campaign editor. |

Feature areas with their own stylesheet (election night, coach, store) import
it from their component and use only the tokens below. Do not hard-code
colors, sizes or shadows in a feature stylesheet or in inline styles.

## Tokens

### Surfaces, borders, text

Surfaces stack from dark to light. Each step must sit visibly above the one
below it; do not put a surface on itself.

| Token | Use |
| --- | --- |
| `--surface-0` | App background |
| `--surface-sunken` | Wells, bar tracks, inputs |
| `--surface-1` | Cards and panels |
| `--surface-2` | Controls and nested rows inside a card, modal header |
| `--surface-3` | Hover and selected fill |
| `--surface-4` | Pressed, active segment |
| `--surface-scrim` | Behind modals and sheets |
| `--border-subtle`, `--border-default`, `--border-strong` | Hairlines, normal edges, hover or emphasis |
| `--text-1` | Primary text and numbers |
| `--text-2` | Body prose |
| `--text-3` | Secondary text and labels |
| `--text-4` | Faintest allowed text (units, captions). Never lighter than this. |
| `--text-on-accent` | Text on a filled accent or warning background |

All four text levels pass WCAG AA (4.5:1) on `--surface-0` to `--surface-2`.

### Semantic color

| Token | Use |
| --- | --- |
| `--accent`, `--accent-hover`, `--accent-text`, `--accent-soft` | The main action (one primary button per view), brand moments |
| `--positive`, `--positive-edge`, `--positive-soft` | Gains, wins, owned |
| `--negative`, `--negative-edge`, `--negative-soft` | Losses, errors, destructive |
| `--warning`, `--warning-edge`, `--warning-soft` | Battlegrounds, current selection, "decision required" |
| `--info`, `--info-soft` | Links, focus ring |

`*-soft` is a tinted background, `*-edge` a border that pairs with the text color.

### Party colors

US parties: `--dem`, `--dem-bright`, `--gop`, `--gop-bright` for fills,
`--dem-text` and `--gop-text` for text. Other countries' party colors come from
game data. Use the raw color for fills, bars and map regions. For party-colored
text call `partyInk(color)` from `src/ui/colors.ts`, which lifts the color
toward white until it passes AA on the panels (needed for near-black or deep
blue parties). For a small color key use `<span className="swatch" style={{ "--party": color }} />`,
which keeps an inner edge so dark parties stay visible.

### Spacing, type, radii, elevation

- Spacing is a 4px grid: `--space-0-5` (2), `--space-1` (4), `--space-1-5` (6),
  `--space-2` (8), `--space-2-5` (10), `--space-3` (12), `--space-4` (16), `--space-5` (20),
  `--space-6` (24), `--space-8` (32), `--space-10` (40), `--space-12` (48).
- Type sizes: `--fs-2xs` 10, `--fs-xs` 11, `--fs-sm` 12, `--fs-md` 13 (default UI),
  `--fs-base` 14 (prose, inputs), `--fs-lg` 16, `--fs-xl` 20, `--fs-2xl` 26, `--fs-3xl` 34,
  `--fs-4xl` 48. Weights `--fw-regular` to `--fw-heavy`. Line heights `--lh-tight`,
  `--lh-snug`, `--lh-body`. Eyebrow labels use `--tracking-label`.
- One sans family (`--font-sans`). Numbers use tabular figures (`.num`), not a
  monospace font. `--font-mono` is only for seeds and codes the player types.
- Radii are crisp: `--radius-xs` 3, `--radius-sm` 4, `--radius-md` 6 (controls),
  `--radius-lg` 8 (cards), `--radius-xl` 10 (modals), `--radius-pill`.
- Elevation: `--elev-1` cards, `--elev-2` sticky bars and popovers, `--elev-3` modals and sheets.
- Selection: `--ring-select` (warning glow) for the selected map region or option,
  `--ring-accent` for the selected election. Keyboard focus is always the
  `--focus-ring` outline from `base.css`; do not remove it.
- Control heights: `--control-sm` 28, `--control-md` 34, `--control-lg` 42.
- Layers: `--z-sticky`, `--z-sheet`, `--z-modal`, `--z-toast`.

Older variable names (`--panel`, `--muted`, `--gold`, `--navy-700` and so on)
still resolve to these tokens so existing code keeps working. Use the new names
in new code.

## Components

### Buttons

```html
<button>Secondary</button>
<button class="primary">End week</button>        <!-- one per view -->
<button class="ghost small">Stats</button>         <!-- toolbars -->
<button class="danger">Delete save</button>
<button class="subtle">Clear</button>              <!-- borderless text button -->
<button class="ghost icon-btn" aria-label="Settings"><Settings /></button>
<a class="btn primary" href="...">Link as button</a>
```

Sizes: `.small` (28px), default (34px), `.large` (42px), `.block` for full
width. Icons are `lucide-react` at 14 to 16px placed before the label; the
button lays them out with a gap. Group toolbar buttons in `.toolbar`.

### Cards

```html
<section class="card">
  <div class="card-head"><h3>Week plan</h3><button class="ghost small">Clear</button></div>
  ...
</section>
```

`.card.tight` for dense panels, `.card.flat` without shadow, `.inset` for a
sunken block inside a card. `.eyebrow` is the uppercase label style outside a
card head. Screen sections use `.section-head` with `.section-title` and
`.section-note`.

### Chips and tags

- `.chip` (outlined) with `.up`, `.down`, `.warn`, `.accent`, `.info` for effects and filters.
- `.tag` (small solid badge) with `.positive`, `.negative`, `.warning`, `.accent`,
  `.outline`, and the difficulty variants `.easy`, `.medium`, `.hard`.

### Segmented control and tabs

```html
<div class="segmented" role="group" aria-label="Map view">
  <button aria-pressed="true">Tiles</button>
  <button aria-pressed="false">Map</button>
</div>
```

The active button is marked with `aria-pressed="true"`, `aria-selected="true"`
or `.active`. `.segmented.fill` stretches the buttons to full width. Use
`role="tablist"` and `role="tab"` with `aria-selected` when it switches panels.

### Tables and numbers

```html
<table class="data-table">
  <thead><tr><th>Party</th><th class="num">Seats</th></tr></thead>
  <tbody><tr class="is-player"><td>Labour</td><td class="num">411</td></tr></tbody>
</table>
```

Every number the player compares gets `.num` (tabular figures) and right
alignment in columns. `.kv` is a label and value row. `.stat-row` with `.metric`
blocks (`.v` value over `.l` label) is the strip used in top bars and summaries.
Units: money as `$254.0M` or `£12M`, shares as `48.1%`, swings as `+2.3`.

### Meters

```html
<div class="meter"><div class="meter-fill" style="width: 62%; background: var(--dem)"></div></div>
```

`.meter.thin` (4px) and `.meter.thick` (10px). `.meter-mark` positions a
threshold line (for example a majority).

### Forms

Inputs, selects and textareas are styled globally. Wrap with `.field` and a
`<label>`. `.search-box` is an input with a leading icon:

```html
<label class="search-box"><Search size={15} /><input type="search" aria-label="Search elections" /></label>
```

### Tooltip

`data-tip="Short hint"` on any focusable element shows a hover and focus hint.

### Modals and sheets

```html
<div class="overlay">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t">
    <div class="head"><div class="tag">Breaking</div><h2 id="t">Title</h2>
      <button class="modal-close" aria-label="Close"><X size={16} /></button></div>
    <div class="body">...</div>
    <div class="foot"><button class="primary">Continue</button></div>
  </div>
</div>
```

Widths: default 640px, `.modal.narrow` 440px, `.modal.wide` 840px. Below 640px
wide every modal becomes a bottom sheet. The map's state detail sheet on phones
uses `.sheet-scrim` and `.sheet`.

### Utilities

`.row`, `.stack`, `.spacer`, `.muted` (text-3), `.faint` (text-4), `.small`,
`.num`, `.up`, `.down`, `.flat`, `.visually-hidden`.

## Rules

- No serif display type, no beige or parchment, no gradient-and-glass styling,
  no emoji as icons (flags from data are fine), no decorative panels.
- Every panel carries information or an action. No warnings the player cannot act on.
- One primary button per view. Secondary actions are default or ghost buttons.
- Motion is short and purposeful and is disabled under `prefers-reduced-motion`.
- Phone is a real layout: content stacks, the main action stays reachable,
  touch targets are at least 34px, and nothing scrolls sideways except
  explicit horizontal rails.

## Screenshots

`node scripts/ui-screenshots.mjs <dev-server-url> <out-dir> [phone,tablet,desktop] [filter]`
captures every main screen at 390x844, 820x1180 and 1440x900 with real seeded
game state. Run `npm run dev` first.
