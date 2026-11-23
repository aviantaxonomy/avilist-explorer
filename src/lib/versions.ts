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

export function parseProposalNumbers(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type VersionsManifest = {
  // First entry is the current xlsx column name (also the CSV header),
  // the rest are aliases from older editions
  columnMap?: Record<string, string[]>;
  versions: Version[];
};

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
