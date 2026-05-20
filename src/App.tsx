import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MoreVertical, BookOpen, Quote, Download, Info } from "lucide-react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { FilterBar } from "@/components/FilterBar";
import { DetailPanel } from "@/components/DetailPanel";
import { VersionPicker } from "@/components/VersionPicker";
import { LocalePicker } from "@/components/LocalePicker";
import { DownloadDialog } from "@/components/DownloadDialog";
import { ReferencesSheet } from "@/components/ReferencesSheet";
import { CitationSheet } from "@/components/CitationSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadSpecies, type Species } from "@/lib/data";
import { applyFilters, computeFacets, isFilterActive } from "@/lib/filters";
import { fetchLocaleNames, fetchLocales } from "@/lib/ebird";
import { dataPathFor, defaultVersion, loadVersions } from "@/lib/versions";
import { usePrefs } from "@/lib/store";
import logo from "@/assets/logo.webp";

export function App() {
  const { data: manifest, error: manifestError } = useQuery({
    queryKey: ["versions"],
    queryFn: loadVersions,
    staleTime: Infinity,
  });
  const versionId = usePrefs((s) => s.versionId);
  const setVersionId = usePrefs((s) => s.setVersionId);
  const locale = usePrefs((s) => s.locale);
  const setLocale = usePrefs((s) => s.setLocale);
  const filters = usePrefs((s) => s.filters);
  const setFilters = usePrefs((s) => s.setFilters);

  const [selected, setSelected] = useState<Species | null>(null);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);

  useEffect(() => {
    if (!manifest) return;
    const exists = versionId && manifest.versions.some((v) => v.id === versionId);
    if (!exists) setVersionId(defaultVersion(manifest)?.id ?? null);
  }, [manifest, versionId, setVersionId]);

  const currentVersion = useMemo(() => {
    if (!manifest || !versionId) return null;
    return manifest.versions.find((v) => v.id === versionId) ?? null;
  }, [manifest, versionId]);

  const isLatestVersion = !!manifest && currentVersion?.id === defaultVersion(manifest)?.id;

  const { data, error: speciesError } = useQuery({
    queryKey: ["species", currentVersion?.id],
    queryFn: () => loadSpecies(dataPathFor(currentVersion!)),
    enabled: !!currentVersion,
    staleTime: Infinity,
  });

  useEffect(() => {
    setSelected(null);
    setScrollTarget(null);
  }, [currentVersion?.id]);

  const { data: locales } = useQuery({
    queryKey: ["ebird", "locales"],
    queryFn: fetchLocales,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const localeQuery = useQuery({
    queryKey: ["ebird", "names", locale],
    queryFn: () => fetchLocaleNames(locale!),
    enabled: !!locale,
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    if (!locales || !locale) return;
    if (!locales.some((l) => l.code === locale)) setLocale(null);
  }, [locales, locale, setLocale]);

  useEffect(() => {
    document.title = currentVersion ? `AviList ${currentVersion.label}` : "AviList";
  }, [currentVersion]);

  const currentLocale =
    isLatestVersion && locale ? locales?.find((l) => l.code === locale) ?? null : null;

  const facets = useMemo(() => (data ? computeFacets(data) : null), [data]);
  const filtered = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);

  const handleSelect = (s: Species, scrollTo?: string) => {
    setSelected(s);
    setScrollTarget(scrollTo ?? null);
  };

  const handleClosePanel = () => {
    setSelected(null);
    setScrollTarget(null);
  };

  const error = manifestError ?? speciesError;

  return (
    <div className="bg-bg text-ink font-sans flex h-screen flex-col overflow-hidden">
      <header className="bg-surface border-rule flex items-center gap-2 border-b px-4 py-[18px] sm:gap-6 sm:px-8">
        <a href="https://avilist.org/" aria-label="AviList — The Global Avian Checklist">
          <img src={logo} alt="AviList — The Global Avian Checklist" className="block h-9 w-auto" />
        </a>
        {manifest && versionId && (
          <div className="ml-auto sm:ml-0">
            <VersionPicker versions={manifest.versions} current={versionId} onChange={setVersionId} />
          </div>
        )}
        <div className="hidden sm:block">
          <LocalePicker
            locales={locales ?? null}
            current={isLatestVersion ? locale : null}
            loading={localeQuery.isFetching}
            disabled={!isLatestVersion}
            onChange={setLocale}
          />
        </div>
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
              <DropdownMenuItem asChild className="gap-2 px-2.5 py-1.5">
                <a
                  href="https://www.avilist.org/about/"
                  target="_blank"
                  rel="noopener"
                >
                  <Info />
                  About AviList
                </a>
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

      {error && <div className="text-accent-2 p-8">{String(error)}</div>}
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
            resultsCount={filtered.length}
            resultsLabel={
              <>
                Showing <b>{filtered.length.toLocaleString()}</b> taxa
              </>
            }
          />
          <SpeciesTable
            data={filtered}
            onSelect={handleSelect}
            localeLabel={currentLocale?.name ?? null}
            localeNames={isLatestVersion ? localeQuery.data ?? null : null}
          />
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
