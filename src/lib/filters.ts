import type { Species } from "./data";
import type { LocaleNames } from "./ebird";
import { baseIucnCode } from "./iucn";

export const RANK_OPTIONS = [
  "order",
  "family",
  "genus",
  "species",
  "subspecies",
] as const;

export const IUCN_OPTIONS = [
  "LC",
  "NT",
  "VU",
  "EN",
  "CR",
  "EW",
  "EX",
  "DD",
  "NE",
] as const;

export type FilterState = {
  search: string;
  ranks: string[];
  iucn: string[];
  orders: string[];
  families: string[];
  genera: string[];
};

export const emptyFilters: FilterState = {
  search: "",
  ranks: [],
  iucn: [],
  orders: [],
  families: [],
  genera: [],
};

export function isFilterActive(f: FilterState): boolean {
  return (
    f.search.trim() !== "" ||
    f.ranks.length > 0 ||
    f.iucn.length > 0 ||
    f.orders.length > 0 ||
    f.families.length > 0 ||
    f.genera.length > 0
  );
}

export type Facets = {
  orders: string[];
  families: string[];
  familyEnglish: Record<string, string>;
  genera: string[];
};

function genusOf(row: Species): string | null {
  if (
    row.rank !== "genus" &&
    row.rank !== "species" &&
    row.rank !== "subspecies"
  )
    return null;
  if (!row.sciName) return null;
  const space = row.sciName.indexOf(" ");
  return space === -1 ? row.sciName : row.sciName.slice(0, space);
}

export function computeFacets(data: Species[]): Facets {
  const orders = new Set<string>();
  const familySet = new Set<string>();
  const familyEnglish: Record<string, string> = {};
  const generaSet = new Set<string>();
  for (const row of data) {
    if (row.order) orders.add(row.order);
    if (row.family) {
      familySet.add(row.family);
      if (row.familyEn && !familyEnglish[row.family]) {
        familyEnglish[row.family] = row.familyEn;
      }
    }
    const genus = genusOf(row);
    if (genus) generaSet.add(genus);
  }
  const families = [...familySet].sort((a, b) => {
    const ae = familyEnglish[a] ?? a;
    const be = familyEnglish[b] ?? b;
    return ae.localeCompare(be);
  });
  return {
    orders: [...orders].sort(),
    families,
    familyEnglish,
    genera: [...generaSet].sort(),
  };
}

export function applyFilters(
  data: Species[],
  f: FilterState,
  localeNames?: LocaleNames | null,
): Species[] {
  if (!isFilterActive(f)) return data;
  const search = f.search.trim().toLowerCase();
  const has = (v?: string) => !!v && v.toLowerCase().includes(search);
  const result: Species[] = [];
  for (const row of data) {
    if (f.ranks.length > 0 && (!row.rank || !f.ranks.includes(row.rank)))
      continue;
    if (f.iucn.length > 0) {
      const base = baseIucnCode(row.iucn);
      if (!base || !f.iucn.includes(base)) continue;
    }
    if (f.orders.length > 0 && (!row.order || !f.orders.includes(row.order)))
      continue;
    if (
      f.families.length > 0 &&
      (!row.family || !f.families.includes(row.family))
    )
      continue;
    if (f.genera.length > 0) {
      const genus = genusOf(row);
      if (!genus || !f.genera.includes(genus)) continue;
    }
    if (search) {
      // Locale name isn't on the row — it's looked up by cornellCode.
      const localeName =
        localeNames && row.cornellCode ? localeNames[row.cornellCode] : undefined;
      if (
        !has(row.sciName) &&
        !has(row.name) &&
        !has(row.nameClements) &&
        !has(row.nameBirdLife) &&
        !has(localeName)
      )
        continue;
    }
    result.push(row);
  }
  return result;
}
