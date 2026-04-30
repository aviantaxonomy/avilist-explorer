import { useEffect, useMemo, useState } from "react";
import { Loader2, MoreVertical, BookOpen, Quote, Download } from "lucide-react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { DetailPanel } from "@/components/DetailPanel";
import { VersionPicker } from "@/components/VersionPicker";
import { DownloadDialog } from "@/components/DownloadDialog";
import { ReferencesSheet } from "@/components/ReferencesSheet";
import { CitationSheet } from "@/components/CitationSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadReferences, loadSpecies, type Reference, type Species } from "@/lib/data";
import { applyFilters, computeFacets, emptyFilters, isFilterActive, type FilterState } from "@/lib/filters";
import { dataPathFor, defaultVersion, loadVersions, referencesPathFor, type VersionsManifest } from "@/lib/versions";
import logo from "@/assets/logo.webp";

const STORAGE_KEY = "avilist:version";

export function App() {
  const [manifest, setManifest] = useState<VersionsManifest | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [data, setData] = useState<Species[] | null>(null);
  const [references, setReferences] = useState<Reference[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selected, setSelected] = useState<Species | null>(null);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);

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
        setVersionId(valid ? stored : defaultVersion(m)?.id ?? null);
      },
      (e) => setError(String(e))
    );
  }, []);

  const currentVersion = useMemo(() => {
    if (!manifest || !versionId) return null;
    return manifest.versions.find((v) => v.id === versionId) ?? null;
  }, [manifest, versionId]);

  useEffect(() => {
    if (!currentVersion) return;
    setData(null);
    setReferences(null);
    setSelected(null);
    loadSpecies(dataPathFor(currentVersion)).then(setData, (e) => setError(String(e)));
  }, [currentVersion]);

  // Prefetch references in the background after the main species data has
  // loaded, so opening the References sheet feels instant.
  useEffect(() => {
    if (!currentVersion || !data) return;
    let cancelled = false;
    loadReferences(referencesPathFor(currentVersion)).then(
      (r) => !cancelled && setReferences(r),
      // Swallow errors — sheet will fall back to its own loading state.
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [currentVersion, data]);

  useEffect(() => {
    document.title = currentVersion ? `AviList ${currentVersion.label}` : "AviList";
  }, [currentVersion]);

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);

  const handleVersionChange = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setVersionId(id);
  };

  return (
    <div className="bg-bg text-ink font-sans flex h-screen flex-col overflow-hidden">
      <header className="bg-surface border-rule flex items-center gap-2 border-b px-4 py-[18px] sm:gap-6 sm:px-8">
        <a href="https://avilist.org/" aria-label="AviList — The Global Avian Checklist">
          <img src={logo} alt="AviList — The Global Avian Checklist" className="block h-9 w-auto" />
        </a>
        {manifest && versionId && (
          <div className="ml-auto sm:ml-0">
            <VersionPicker versions={manifest.versions} current={versionId} onChange={handleVersionChange} />
          </div>
        )}
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            disabled={!filtered}
            onClick={() => setDownloadOpen(true)}
            className="bg-ink text-bg hidden h-9 cursor-pointer items-center gap-2 rounded-md border-0 px-4 text-[13px] font-medium hover:bg-[#2c2c28] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
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
            Download
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More options"
              className="border-rule bg-surface text-ink-2 hover:border-ink-3 grid h-9 w-9 cursor-pointer place-items-center rounded-md border outline-none transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-56 p-1.5">
              <DropdownMenuItem
                onSelect={() => setDownloadOpen(true)}
                disabled={!filtered}
                className="gap-2 px-2.5 py-1.5 sm:hidden"
              >
                <Download />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setCitationOpen(true)}
                className="gap-2 px-2.5 py-1.5"
              >
                <Quote />
                Recommended Citation
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setReferencesOpen(true)}
                className="gap-2 px-2.5 py-1.5"
              >
                <BookOpen />
                References
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {currentVersion && data && filtered && manifest && (
        <DownloadDialog
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
          version={currentVersion}
          data={data}
          filtered={filtered}
          filtersActive={isFilterActive(filters)}
          columnMap={manifest.columnMap}
        />
      )}

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
          <SpeciesTable data={filtered} onSelect={handleSelect} />
        </>
      )}

      {currentVersion && (
        <DetailPanel taxon={selected} version={currentVersion} scrollTo={scrollTarget} onClose={handleClosePanel} />
      )}

      {currentVersion && (
        <ReferencesSheet
          open={referencesOpen}
          onOpenChange={setReferencesOpen}
          version={currentVersion}
          references={references}
        />
      )}

      {currentVersion && (
        <CitationSheet
          open={citationOpen}
          onOpenChange={setCitationOpen}
          version={currentVersion}
        />
      )}
    </div>
  );
}
