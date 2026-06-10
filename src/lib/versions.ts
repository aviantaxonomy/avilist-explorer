export type Version = {
  id: string;
  label: string;
  released: string;
  extendedXlsx: string;
  sheet: string;
  clementsVersion: string;
  birdLifeVersion: string;
  citation: string;
  license: string;
  contributors: string;
};

/** Split a `proposalNumber` cell that may contain multiple numbers. */
export function parseProposalNumbers(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type VersionsManifest = {
  /**
   * Maps each canonical field (see src/columns.ts) → array of xlsx column
   * names. Convention:
   *   - Index 0 is the **canonical/preferred** name. The extractor tries it
   *     first, and CSV exports use it as the column header.
   *   - Subsequent entries are fallback aliases for older editions where
   *     the column had a different name.
   */
  columnMap?: Record<string, string[]>;
  versions: Version[];
};

// Vite's BASE_URL has a trailing slash (e.g. "/" or "/avilist-explorer/"),
// so direct concatenation yields the right URL under any deploy prefix.
const BASE = import.meta.env.BASE_URL;

export function dataPathFor(version: Version): string {
  return `${BASE}data/avilist-${version.id}.json`;
}

export function referencesPathFor(version: Version): string {
  return `${BASE}data/avilist-${version.id}-references.json`;
}

export function defaultVersion(manifest: VersionsManifest): Version | null {
  return manifest.versions[manifest.versions.length - 1] ?? null;
}

export async function loadVersions(): Promise<VersionsManifest> {
  const res = await fetch(`${BASE}versions.json`);
  if (!res.ok) throw new Error(`Failed to load versions.json (${res.status})`);
  return res.json();
}
