import type { Species } from "./data";
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

const SEARCH_FIELDS = [
  "sciName",
  "name",
  "nameClements",
  "nameBirdLife",
] as const;

export type FilterState = {
  search: string;
  ranks: Set<string>;
  iucn: Set<string>;
  orders: Set<string>;
  families: Set<string>;
};

export const emptyFilters: FilterState = {
  search: "",
  ranks: new Set(),
  iucn: new Set(),
  orders: new Set(),
  families: new Set(),
};

export function isFilterActive(f: FilterState): boolean {
  return (
    f.search.trim() !== "" ||
    f.ranks.size > 0 ||
    f.iucn.size > 0 ||
    f.orders.size > 0 ||
    f.families.size > 0
  );
}

export type Facets = {
  orders: string[];
  families: string[];
  familyEnglish: Record<string, string>;
};

export function computeFacets(data: Species[]): Facets {
  const orders = new Set<string>();
  const familySet = new Set<string>();
  const familyEnglish: Record<string, string> = {};
  for (const row of data) {
    if (row.order) orders.add(row.order);
    if (row.family) {
      familySet.add(row.family);
      if (row.familyEn && !familyEnglish[row.family]) {
        familyEnglish[row.family] = row.familyEn;
      }
    }
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
  };
}

export function applyFilters(data: Species[], f: FilterState): Species[] {
  if (!isFilterActive(f)) return data;
  const search = f.search.trim().toLowerCase();
  const result: Species[] = [];
  for (const row of data) {
    if (f.ranks.size > 0 && (!row.rank || !f.ranks.has(row.rank))) continue;
    if (f.iucn.size > 0) {
      const base = baseIucnCode(row.iucn);
      if (!base || !f.iucn.has(base)) continue;
    }
    if (f.orders.size > 0 && (!row.order || !f.orders.has(row.order)))
      continue;
    if (f.families.size > 0 && (!row.family || !f.families.has(row.family)))
      continue;
    if (search) {
      let match = false;
      for (const field of SEARCH_FIELDS) {
        const v = row[field];
        if (v && v.toLowerCase().includes(search)) {
          match = true;
          break;
        }
      }
      if (!match) continue;
    }
    result.push(row);
  }
  return result;
}
