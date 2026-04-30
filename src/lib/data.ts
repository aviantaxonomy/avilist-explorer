import { COLUMNS, type Column } from "@/columns";

export type Species = Partial<Record<Column, string>>;

export type Reference = {
  short: string;
  full: string;
  url?: string;
  doi?: string;
};

export async function loadSpecies(path: string): Promise<Species[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load species data (${res.status})`);
  const compact = (await res.json()) as (string | null)[][];

  return compact.map((row) => {
    const obj: Species = {};
    for (let i = 0; i < COLUMNS.length; i++) {
      const v = row[i];
      if (v != null) obj[COLUMNS[i]] = v;
    }
    return obj;
  });
}

export async function loadReferences(path: string): Promise<Reference[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load references (${res.status})`);
  return (await res.json()) as Reference[];
}
