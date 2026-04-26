import { COLUMNS, type Column } from "@/columns";

export type Species = Partial<Record<Column, string>>;

export async function loadSpecies(): Promise<Species[]> {
  const res = await fetch("/data/avilist-compact.json");
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
