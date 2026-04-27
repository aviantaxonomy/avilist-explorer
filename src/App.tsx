import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { DetailPanel } from "@/components/DetailPanel";
import { VersionPicker } from "@/components/VersionPicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const handleSelect = (s: Species, scrollTo?: string) => {
    setSelected(s);
    setScrollTarget(scrollTo ?? null);
  };

  const handleClosePanel = () => {
    setSelected(null);
    setScrollTarget(null);
  };

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

  const currentVersion = useMemo(() => {
    if (!manifest || !versionId) return null;
    return manifest.versions.find((v) => v.id === versionId) ?? null;
  }, [manifest, versionId]);

  useEffect(() => {
    if (!currentVersion) return;
    setData(null);
    setSelected(null);
    loadSpecies(dataPathFor(currentVersion)).then(setData, (e) =>
      setError(String(e)),
    );
  }, [currentVersion]);

  useEffect(() => {
    document.title = currentVersion
      ? `AviList ${currentVersion.label}`
      : "AviList Explorer";
  }, [currentVersion]);

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(
    () => (data ? applyFilters(data, filters) : null),
    [data, filters],
  );

  const handleVersionChange = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setVersionId(id);
  };

  const handleDownload = (variant: "basic" | "expanded") => {
    if (!filtered) return;
    downloadCsv(filtered, variant);
    setDownloadOpen(false);
  };

  return (
    <div className="bg-bg text-ink font-sans flex h-screen flex-col overflow-hidden">
      <header className="bg-surface border-rule flex items-center gap-4 border-b px-4 py-[18px] sm:gap-6 sm:px-8">
        <a
          href="https://avilist.org/"
          aria-label="AviList — The Global Avian Checklist"
        >
          <img
            src={logo}
            alt="AviList — The Global Avian Checklist"
            className="block h-9 w-auto"
          />
        </a>
        {manifest && versionId && (
          <div className="ml-auto sm:ml-0">
            <VersionPicker
              versions={manifest.versions}
              current={versionId}
              onChange={handleVersionChange}
            />
          </div>
        )}
        <div className="hidden sm:ml-auto sm:flex">
          <Popover open={downloadOpen} onOpenChange={setDownloadOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={!filtered}
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
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-40 gap-0 p-1"
              align="end"
              sideOffset={6}
            >
              <button
                type="button"
                className="hover:bg-bg text-ink w-full cursor-pointer rounded px-3 py-2 text-left text-sm"
                onClick={() => handleDownload("basic")}
              >
                Basic
              </button>
              <button
                type="button"
                className="hover:bg-bg text-ink w-full cursor-pointer rounded px-3 py-2 text-left text-sm"
                onClick={() => handleDownload("expanded")}
              >
                Expanded
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {error && <div className="text-accent-2 p-8">{error}</div>}
      {!data && !error && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-ink-3 flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Loading taxa…</p>
          </div>
        </div>
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
            onSelect={handleSelect}
          />
        </>
      )}

      {selected && currentVersion && (
        <DetailPanel
          taxon={selected}
          version={currentVersion}
          scrollTo={scrollTarget}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
