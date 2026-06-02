export type Version = {
  id: string;
  label: string;
  released: string;
  extendedXlsx: string;
  basicXlsx: string;
  sheet: string;
  clementsVersion: string;
  birdLifeVersion: string;
  /** Prefix used to namespace proposal numbers, e.g. "2025" → "2025-117". */
  decisionSummaryPrefix: string;
  citation: string;
  license: string;
  contributors: string;
};

/**
 * Format a single proposal number with the version's prefix, e.g. `117` →
 * `2025-117`, `N-70` → `N-2025-70`. Idempotent if the year is already present.
 */
export function formatProposalNumber(version: Version, num: string): string {
  const prefix = version.decisionSummaryPrefix;
  const trimmed = num.trim();
  if (!prefix) return trimmed;
  if (trimmed.startsWith(prefix)) return trimmed;
  if (/^N-/i.test(trimmed)) return `N-${prefix}-${trimmed.slice(2)}`;
  return `${prefix}-${trimmed}`;
}

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

export function xlsxUrlFor(
  version: Version,
  variant: "basic" | "extended",
): string {
  return `${BASE}data/avilist-${version.id}-${variant}.xlsx`;
}

export function defaultVersion(manifest: VersionsManifest): Version | null {
  return manifest.versions[manifest.versions.length - 1] ?? null;
}

export async function loadVersions(): Promise<VersionsManifest> {
  const res = await fetch(`${BASE}versions.json`);
  if (!res.ok) throw new Error(`Failed to load versions.json (${res.status})`);
  return res.json();
}
