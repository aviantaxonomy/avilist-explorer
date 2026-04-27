export type Version = {
  id: string;
  label: string;
  released: string;
  inputXlsx: string;
  sheet: string;
  clementsVersion: string;
  birdLifeVersion: string;
};

export type VersionsManifest = {
  /**
   * Maps each canonical field (see src/columns.ts) → array of possible xlsx
   * column names. The converter tries each in order and uses the first match.
   * Add aliases here as AviList renames columns across editions.
   */
  columnMap?: Record<string, string[]>;
  versions: Version[];
};

// Vite's BASE_URL has a trailing slash (e.g. "/" or "/avilist-explorer/"),
// so direct concatenation yields the right URL under any deploy prefix.
const BASE = import.meta.env.BASE_URL;

export function dataPathFor(version: Version): string {
  return `${BASE}data/avilist-${version.id}.json.gz`;
}

export function defaultVersion(manifest: VersionsManifest): Version | null {
  return manifest.versions[manifest.versions.length - 1] ?? null;
}

export async function loadVersions(): Promise<VersionsManifest> {
  const res = await fetch(`${BASE}versions.json`);
  if (!res.ok) throw new Error(`Failed to load versions.json (${res.status})`);
  return res.json();
}
