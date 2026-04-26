import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectFilter } from "./MultiSelectFilter";
import {
  type FilterState,
  type Facets,
  RANK_OPTIONS,
  IUCN_OPTIONS,
  isFilterActive,
  emptyFilters,
} from "@/lib/filters";

type Props = {
  filters: FilterState;
  facets: Facets;
  onChange: (next: FilterState) => void;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FilterBar({ filters, facets, onChange }: Props) {
  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 opacity-50" />
        <Input
          placeholder="Search species..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="h-9 w-64 pl-8"
        />
      </div>

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
      />

      {isFilterActive(filters) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(emptyFilters)}
          className="h-9"
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
