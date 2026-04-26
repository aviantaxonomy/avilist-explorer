import { useEffect, useMemo, useState } from "react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { loadSpecies, type Species } from "@/lib/data";
import {
  applyFilters,
  computeFacets,
  emptyFilters,
  type FilterState,
} from "@/lib/filters";
import logo from "@/assets/logo.webp";

export function App() {
  const [data, setData] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  useEffect(() => {
    loadSpecies().then(setData, (e) => setError(String(e)));
  }, []);

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(
    () => (data ? applyFilters(data, filters) : null),
    [data, filters],
  );

  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <img
          src={logo}
          alt="AviList — The Global Avian Checklist"
          className="h-10 w-auto"
        />
      </header>
      {error && <p className="text-destructive p-6">{error}</p>}
      {!data && !error && (
        <p className="text-muted-foreground p-6">Loading…</p>
      )}
      {data && facets && filtered && (
        <>
          <div className="space-y-3 px-6 pt-4 pb-3">
            <FilterBar
              filters={filters}
              facets={facets}
              onChange={setFilters}
            />
            <p className="text-sm">
              Showing {filtered.length.toLocaleString()} taxa
            </p>
          </div>
          <SpeciesTable data={filtered} />
        </>
      )}
    </div>
  );
}
