export type Version = {
  id: string;
  label: string;
  released: string;
  inputXlsx: string;
  sheet: string;
};

export type VersionsManifest = {
  versions: Version[];
};

export function dataPathFor(version: Version): string {
  return `/data/avilist-${version.id}.json.gz`;
}

export function defaultVersion(manifest: VersionsManifest): Version | null {
  return manifest.versions[manifest.versions.length - 1] ?? null;
}

export async function loadVersions(): Promise<VersionsManifest> {
  const res = await fetch("/versions.json");
  if (!res.ok) throw new Error(`Failed to load versions.json (${res.status})`);
  return res.json();
}
