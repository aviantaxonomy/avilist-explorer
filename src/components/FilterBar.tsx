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

type Props = {
  filters: FilterState;
  facets: Facets;
  onChange: (next: FilterState) => void;
  resultsLabel: React.ReactNode;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FilterBar({ filters, facets, onChange, resultsLabel }: Props) {
  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="mu-toolbar">
      <label className="mu-search">
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
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Search by scientific or English name…"
          spellCheck={false}
        />
      </label>

      <div className="mu-chips">
        <MultiSelectFilter
          label="Rank"
          options={[...RANK_OPTIONS]}
          selected={filters.ranks}
          onChange={(next) => update("ranks", next)}
          formatLabel={capitalize}
          formatTriggerValue={capitalize}
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
          formatTriggerValue={(value) => facets.familyEnglish[value] ?? value}
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
          <button className="mu-clear" onClick={() => onChange(emptyFilters)}>
            Clear all
          </button>
        )}
      </div>

      <div className="mu-result-count">{resultsLabel}</div>
    </div>
  );
}
