import type { Species } from "./data";

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
  "Scientific_name",
  "English_name_AviList",
  "English_name_Clements_v2024",
  "English_name_BirdLife_v9",
  "Family",
  "Family_English_name",
  "Protonym",
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
    if (row.Order) orders.add(row.Order);
    if (row.Family) {
      familySet.add(row.Family);
      if (row.Family_English_name && !familyEnglish[row.Family]) {
        familyEnglish[row.Family] = row.Family_English_name;
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
    if (f.ranks.size > 0 && (!row.Taxon_rank || !f.ranks.has(row.Taxon_rank)))
      continue;
    if (
      f.iucn.size > 0 &&
      (!row.IUCN_Red_List_Category || !f.iucn.has(row.IUCN_Red_List_Category))
    )
      continue;
    if (f.orders.size > 0 && (!row.Order || !f.orders.has(row.Order))) continue;
    if (f.families.size > 0 && (!row.Family || !f.families.has(row.Family)))
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
