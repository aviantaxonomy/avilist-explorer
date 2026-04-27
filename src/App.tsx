import { useEffect, useMemo, useState } from "react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { DetailPanel } from "@/components/DetailPanel";
import { VersionPicker } from "@/components/VersionPicker";
import { loadSpecies, type Species } from "@/lib/data";
import {
  applyFilters,
  computeFacets,
  emptyFilters,
  type FilterState,
} from "@/lib/filters";
import { downloadCsv } from "@/lib/csv";
import {
  dataPathFor,
  defaultVersion,
  loadVersions,
  type VersionsManifest,
} from "@/lib/versions";
import logo from "@/assets/logo.webp";

const STORAGE_KEY = "avilist:version";

export function App() {
  const [manifest, setManifest] = useState<VersionsManifest | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [data, setData] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selected, setSelected] = useState<Species | null>(null);

  useEffect(() => {
    loadVersions().then(
      (m) => {
        setManifest(m);
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = stored && m.versions.some((v) => v.id === stored);
        setVersionId(valid ? stored : (defaultVersion(m)?.id ?? null));
      },
      (e) => setError(String(e)),
    );
  }, []);

  useEffect(() => {
    if (!manifest || !versionId) return;
    const version = manifest.versions.find((v) => v.id === versionId);
    if (!version) return;
    setData(null);
    setSelected(null);
    loadSpecies(dataPathFor(version)).then(setData, (e) => setError(String(e)));
  }, [manifest, versionId]);

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(
    () => (data ? applyFilters(data, filters) : null),
    [data, filters],
  );

  const handleVersionChange = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setVersionId(id);
  };

  return (
    <div className="bg-bg text-ink font-sans flex h-screen flex-col overflow-hidden">
      <header className="bg-surface border-rule grid grid-cols-[auto_1fr] items-center gap-8 border-b px-8 py-[18px]">
        <div className="flex items-center gap-6">
          <img
            src={logo}
            alt="AviList — The Global Avian Checklist"
            className="block h-9 w-auto"
          />
          {manifest && versionId && (
            <VersionPicker
              versions={manifest.versions}
              current={versionId}
              onChange={handleVersionChange}
            />
          )}
        </div>
        <div className="flex items-center gap-7 justify-self-end">
          <button
            type="button"
            disabled={!filtered}
            onClick={() => filtered && downloadCsv(filtered)}
            className="bg-ink text-bg inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border-0 px-4 text-[13px] font-medium hover:bg-[#2c2c28] disabled:cursor-not-allowed disabled:opacity-50"
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

      {error && <div className="text-accent-2 p-8">{error}</div>}
      {!data && !error && <div className="text-ink-3 p-8">Loading…</div>}

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
