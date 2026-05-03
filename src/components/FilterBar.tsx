import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { MultiSelectFilter } from "./MultiSelectFilter";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  resultsCount: number;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FilterBar({
  filters,
  facets,
  onChange,
  resultsLabel,
  resultsCount,
}: Props) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount =
    filters.ranks.size +
    filters.orders.size +
    filters.families.size +
    filters.genera.size +
    filters.iucn.size;

  const controls = (
    <FilterControls filters={filters} facets={facets} update={update} />
  );

  return (
    <div className="bg-surface border-rule flex flex-col gap-3 border-b px-4 py-[14px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:py-[18px] sm:px-8">
      {/* Search + mobile filter trigger. `sm:contents` unwraps this on desktop
          so the search label flows alongside the chip row in the outer flex. */}
      <div className="flex items-center gap-2 sm:contents">
        <label className="border-rule bg-bg text-ink-3 hover:border-ink-3 focus-within:border-ink-3 flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border px-3 transition-colors sm:gap-2.5 sm:px-3.5 sm:max-w-[520px] sm:min-w-[320px] sm:flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
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
            placeholder="Search by name…"
            spellCheck={false}
            className="text-ink placeholder:text-ink-3 min-w-0 flex-1 border-0 bg-transparent text-sm outline-0"
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="border-rule bg-surface text-ink-2 hover:border-ink-3 flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-ink text-bg inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        {controls}
        {isFilterActive(filters) && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="text-accent-2 cursor-pointer border-0 bg-transparent px-1 text-[13px] font-medium underline underline-offset-4"
          >
            Reset
          </button>
        )}
      </div>

      <div className="text-ink-3 hidden text-xs sm:ml-auto sm:block [&_b]:text-ink [&_b]:font-semibold">
        {resultsLabel}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="right"
          className="bg-surface text-ink font-sans flex flex-col gap-0 px-0 pt-0 pb-0"
        >
          <SheetHeader className="border-rule border-b px-6 py-5">
            <SheetTitle className="text-ink text-lg font-medium">
              Filter
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col items-start gap-3 overflow-y-auto px-6 py-5">
            {controls}
          </div>
          <SheetFooter className="border-rule mt-0 flex-row items-center justify-between gap-3 border-t p-4">
            {isFilterActive(filters) ? (
              <button
                type="button"
                onClick={() => {
                  onChange(emptyFilters);
                  setFiltersOpen(false);
                }}
                className="text-accent-2 cursor-pointer border-0 bg-transparent px-2 text-[13px] font-medium underline underline-offset-4"
              >
                Reset
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="bg-ink text-bg inline-flex h-10 cursor-pointer items-center justify-center rounded-md border-0 px-4 text-[13px] font-medium hover:bg-[#2c2c28]"
            >
              Show {resultsCount.toLocaleString()} results
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterControls({
  filters,
  facets,
  update,
}: {
  filters: FilterState;
  facets: Facets;
  update: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}) {
  return (
    <>
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
        label="Genus"
        options={facets.genera}
        selected={filters.genera}
        onChange={(next) => update("genera", next)}
        maxResults={100}
        formatLabel={(value) => <span className="italic">{value}</span>}
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
    </>
  );
}
