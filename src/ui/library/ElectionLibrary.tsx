import { useMemo, useState } from "react";
import { Lock, Play, Search, Shuffle, X } from "lucide-react";
import { scenarioTags, type ScenarioMeta } from "@content/scenarioRegistry";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  countryBlurb,
  countryName,
  erasFor,
  filterScenarios,
  groupByCountry,
  type AccessFilter,
  type DifficultyFilter,
  type LibraryFilters,
} from "./filter";

// How many elections a country shows before "Show all" when no filter is set.
const COLLAPSED_ROWS = 8;

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="catalog-filter-group" role="group" aria-label={label}>
      <span className="catalog-filter-label">{label}</span>
      <div className="segmented">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LibraryCard({ s, unlocked, showFree, onPlay, onLocked }: {
  s: ScenarioMeta;
  unlocked: boolean;
  showFree: boolean;
  onPlay: () => void;
  onLocked: () => void;
}) {
  const [, matchup] = s.label.split("·").map((part) => part.trim());
  const tags = scenarioTags(s);
  return (
    <button
      type="button"
      className={`library-card${unlocked ? "" : " locked"}`}
      onClick={unlocked ? onPlay : onLocked}
      aria-label={`${s.label}${unlocked ? "" : ", locked"}`}
    >
      <span className="library-card-top">
        <span className="library-card-year num">{s.year}</span>
        <span className={`tag ${s.difficulty}`}>{s.difficulty}</span>
        {showFree && s.free ? (
          <span className="tag positive">Free</span>
        ) : !unlocked ? (
          <Lock size={13} className="library-card-lock" aria-hidden="true" />
        ) : null}
        <span className="library-card-go" aria-hidden="true">{unlocked ? <Play size={13} /> : null}</span>
      </span>
      <span className="library-card-title">{matchup ?? s.label}</span>
      <span className="library-card-desc">{s.description}</span>
      {tags.length > 0 && (
        <span className={`library-card-note${tags.includes("tide") ? " tide" : ""}`}>
          {tags.includes("tide") ? "Historical tide" : tags.includes("coin-flip") ? "Coin-flip election" : "Challenge path"}
        </span>
      )}
      {!unlocked && <span className="library-card-unlock">Unlock to play</span>}
    </button>
  );
}

// The full election library: search, filters, a country rail, and results
// grouped by country. Works from the registry alone, so new countries and
// elections appear without changes here.
export function ElectionLibrary({
  rows,
  canPlay,
  showAccess,
  onPlay,
  onLocked,
}: {
  rows: readonly ScenarioMeta[];
  canPlay: (scenarioId: string) => boolean;
  /** Show the Owned and Locked filter and the Free tags (paywall on). */
  showAccess: boolean;
  onPlay: (s: ScenarioMeta) => void;
  onLocked: (s: ScenarioMeta) => void;
}) {
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const set = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const eras = useMemo(() => erasFor(rows), [rows]);
  const countries = useMemo(() => groupByCountry(rows, rows), [rows]);
  const visible = filterScenarios(rows, filters, canPlay);
  const groups = groupByCountry(rows, visible);
  const filtering = activeFilterCount(filters) > 0;
  const narrowing = filtering && !(activeFilterCount(filters) === 1 && filters.country);
  const playable = visible.filter((s) => canPlay(s.scenarioId));
  const query = filters.query.trim();

  const playRandom = () => {
    if (!playable.length) return;
    onPlay(playable[Math.floor(Math.random() * playable.length)]);
  };

  const heading = query
    ? `${visible.length} matching election${visible.length === 1 ? "" : "s"}${filters.country ? ` in ${countryName(filters.country)}` : ""}`
    : filtering
      ? `${visible.length} of ${rows.length} elections`
      : `${rows.length} elections in ${countries.length} countries`;

  return (
    <section className="library" aria-label="Election library">
      <div className="library-tools">
        <label className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => set("query", event.target.value)}
            aria-label="Search election scenarios"
            placeholder={filters.country ? `Search ${countryName(filters.country)} elections` : "Search by year, country, candidate or issue"}
          />
          {query && (
            <button type="button" className="subtle small icon-btn" aria-label="Clear search" onClick={() => set("query", "")}>
              <X size={14} />
            </button>
          )}
        </label>

        <div className="library-countries" role="group" aria-label="Country">
          <button type="button" className="country-chip" aria-pressed={!filters.country} onClick={() => set("country", null)}>
            All countries <span className="country-chip-n num">{rows.length}</span>
          </button>
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              className="country-chip"
              aria-pressed={filters.country === c.code}
              onClick={() => set("country", filters.country === c.code ? null : c.code)}
            >
              <span className="country-chip-flag" aria-hidden="true">{c.flag}</span>{c.name}
              <span className="country-chip-n num">{c.total}</span>
            </button>
          ))}
        </div>

        <div className="catalog-filters">
          {showAccess && (
            <FilterGroup<AccessFilter>
              label="Show"
              value={filters.access}
              onChange={(v) => set("access", v)}
              options={[{ value: "all", label: "All" }, { value: "owned", label: "Owned" }, { value: "locked", label: "Locked" }]}
            />
          )}
          <FilterGroup<DifficultyFilter>
            label="Difficulty"
            value={filters.difficulty}
            onChange={(v) => set("difficulty", v)}
            options={[{ value: "all", label: "Any" }, { value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]}
          />
          <FilterGroup<string>
            label="Era"
            value={filters.era}
            onChange={(v) => set("era", v)}
            options={[{ value: "all", label: "Any" }, ...eras.map((e) => ({ value: e.id, label: e.label }))]}
          />
        </div>
      </div>

      <div className="library-status">
        <span className="library-count" role="status">{heading}</span>
        <span className="toolbar">
          {filtering && (
            <button type="button" className="subtle small" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
          )}
          {playable.length > 0 && (
            <button type="button" className="ghost small catalog-random" onClick={playRandom}>
              <Shuffle size={13} aria-hidden="true" /> Pick a playable campaign
            </button>
          )}
        </span>
      </div>

      {groups.length ? groups.map((g) => {
        const open = narrowing || expanded.has(g.code) || !!filters.country;
        const shown = open ? g.rows : g.rows.slice(0, COLLAPSED_ROWS);
        const owned = g.rows.filter((s) => canPlay(s.scenarioId)).length;
        return (
          <section key={g.code} className="library-group" aria-label={g.name}>
            <header className="library-group-head">
              <span className="library-group-flag" aria-hidden="true">{g.flag}</span>
              <h3 className="library-group-name">{g.name}</h3>
              <span className="library-group-meta num">
                {g.rows.length === g.total ? `${g.total} election${g.total === 1 ? "" : "s"}` : `${g.rows.length} of ${g.total}`}
                {g.total > 1 ? ` · ${g.from} to ${g.to}` : ""}
                {showAccess ? ` · ${owned} playable` : ""}
              </span>
              {countryBlurb(g.code) && <span className="library-group-blurb">{countryBlurb(g.code)}</span>}
              {!filters.country && countries.length > 1 && (
                <button type="button" className="subtle small library-group-only" onClick={() => set("country", g.code)}>
                  Only {g.name}
                </button>
              )}
            </header>
            <div className="library-grid">
              {shown.map((s) => (
                <LibraryCard
                  key={s.scenarioId}
                  s={s}
                  unlocked={canPlay(s.scenarioId)}
                  showFree={showAccess}
                  onPlay={() => onPlay(s)}
                  onLocked={() => onLocked(s)}
                />
              ))}
            </div>
            {shown.length < g.rows.length && (
              <button
                type="button"
                className="ghost small block library-more"
                onClick={() => setExpanded((prev) => new Set(prev).add(g.code))}
              >
                Show all {g.rows.length} {g.name} elections
              </button>
            )}
          </section>
        );
      }) : (
        <div className="catalog-empty" role="status">
          No elections match these filters{query ? ` for "${query}"` : ""}{filters.country ? ` in ${countryName(filters.country)}` : ""}.
          <button type="button" className="ghost small" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
