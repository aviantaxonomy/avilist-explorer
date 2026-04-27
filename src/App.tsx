import { useEffect, useMemo, useState } from "react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { DetailPanel } from "@/components/DetailPanel";
import { EditionPicker } from "@/components/EditionPicker";
import { loadSpecies, type Species } from "@/lib/data";
import {
  applyFilters,
  computeFacets,
  emptyFilters,
  type FilterState,
} from "@/lib/filters";
import { downloadCsv } from "@/lib/csv";
import { loadEditions, type EditionsManifest } from "@/lib/editions";
import logo from "@/assets/logo.webp";

const STORAGE_KEY = "avilist:edition";

export function App() {
  const [manifest, setManifest] = useState<EditionsManifest | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [data, setData] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selected, setSelected] = useState<Species | null>(null);

  useEffect(() => {
    loadEditions().then(
      (m) => {
        setManifest(m);
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = stored && m.editions.some((e) => e.id === stored);
        setEditionId(valid ? stored : m.current);
      },
      (e) => setError(String(e)),
    );
  }, []);

  useEffect(() => {
    if (!manifest || !editionId) return;
    const edition = manifest.editions.find((e) => e.id === editionId);
    if (!edition) return;
    setData(null);
    setSelected(null);
    loadSpecies(edition.dataPath).then(setData, (e) => setError(String(e)));
  }, [manifest, editionId]);

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(
    () => (data ? applyFilters(data, filters) : null),
    [data, filters],
  );

  const handleEditionChange = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setEditionId(id);
  };

  return (
    <div className="mu-root">
      <header className="mu-header">
        <div className="mu-brand">
          <img
            src={logo}
            alt="AviList — The Global Avian Checklist"
            className="mu-brand-logo"
          />
          {manifest && editionId && (
            <EditionPicker
              editions={manifest.editions}
              current={editionId}
              onChange={handleEditionChange}
            />
          )}
        </div>
        <div className="mu-header-right">
          <button
            type="button"
            className="mu-download"
            disabled={!filtered}
            onClick={() => filtered && downloadCsv(filtered)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M8 1v9M4 7l4 4 4-4M2 14h12" />
            </svg>
            Download CSV
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: "32px", color: "var(--accent-2)" }}>{error}</div>
      )}
      {!data && !error && (
        <div style={{ padding: "32px", color: "var(--ink-3)" }}>Loading…</div>
      )}

      {data && facets && filtered && (
        <>
          <FilterBar
            filters={filters}
            facets={facets}
            onChange={setFilters}
            resultsLabel={
              <>
                Showing <b>{filtered.length.toLocaleString()}</b> taxa
              </>
            }
          />
          <SpeciesTable
            data={filtered}
            selected={selected}
            onSelect={setSelected}
          />
        </>
      )}

      {selected && (
        <DetailPanel taxon={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
