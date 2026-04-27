import { useEffect, useState } from "react";
import { MultiSelectFilter } from "./MultiSelectFilter";
import {
  type FilterState,
  type Facets,
  RANK_OPTIONS,
  IUCN_OPTIONS,
  isFilterActive,
  emptyFilters,
} from "@/lib/filters";
import { IUCN_INFO, type IucnCode } from "@/lib/iucn";

const SEARCH_DEBOUNCE_MS = 200;

type Props = {
  filters: FilterState;
  facets: Facets;
  onChange: (next: FilterState) => void;
  resultsLabel: React.ReactNode;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FilterBar({ filters, facets, onChange, resultsLabel }: Props) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Reverse-sync when parent clears (e.g. "Clear all" button)
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  // Debounce local input → parent filter state.
  // `filters` is a dep so a mid-debounce facet change (Rank/Order/Family/IUCN)
  // re-schedules the timer with the latest filters and isn't dropped.
  useEffect(() => {
    if (searchValue === filters.search) return;
    const t = setTimeout(() => {
      onChange({ ...filters, search: searchValue });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchValue, filters, onChange]);

  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-surface border-rule flex flex-wrap items-center gap-4 border-b px-4 py-[18px] sm:px-8">
      <label className="border-rule bg-bg text-ink-3 hover:border-ink-3 focus-within:border-ink-3 flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border px-3.5 transition-colors max-w-[520px] sm:min-w-[320px]">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="11"
            cy="11"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by scientific or English name…"
          spellCheck={false}
          className="text-ink placeholder:text-ink-3 flex-1 border-0 bg-transparent text-sm outline-0"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="Rank"
          options={[...RANK_OPTIONS]}
          selected={filters.ranks}
          onChange={(next) => update("ranks", next)}
          formatLabel={capitalize}
        />

        <MultiSelectFilter
          label="Order"
          options={facets.orders}
          selected={filters.orders}
          onChange={(next) => update("orders", next)}
        />

        <MultiSelectFilter
          label="Family"
          options={facets.families}
          selected={filters.families}
          onChange={(next) => update("families", next)}
          popoverWidth="w-96"
          getKeywords={(value) => {
            const english = facets.familyEnglish[value];
            return english ? [english] : [];
          }}
          formatLabel={(value) => {
            const english = facets.familyEnglish[value];
            if (!english) return <span className="italic">{value}</span>;
            return (
              <>
                {english}
                <span className="text-muted-foreground ml-2 text-xs italic">
                  {value}
                </span>
              </>
            );
          }}
        />

        <MultiSelectFilter
          label="IUCN"
          options={[...IUCN_OPTIONS]}
          selected={filters.iucn}
          onChange={(next) => update("iucn", next)}
          formatLabel={(v) => `${v} — ${IUCN_INFO[v as IucnCode]?.label ?? v}`}
          getKeywords={(v) => {
            const label = IUCN_INFO[v as IucnCode]?.label;
            return label ? [label] : [];
          }}
        />

        {isFilterActive(filters) && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="text-accent-2 cursor-pointer border-0 bg-transparent px-1 text-[13px] font-medium underline underline-offset-4"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="text-ink-3 text-xs sm:ml-auto [&_b]:text-ink [&_b]:font-semibold">
        {resultsLabel}
      </div>
    </div>
  );
}
