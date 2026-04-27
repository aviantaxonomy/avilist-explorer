export type Edition = {
  id: string;
  label: string;
  released: string;
  dataPath: string;
};

export type EditionsManifest = {
  current: string;
  editions: Edition[];
};

export async function loadEditions(): Promise<EditionsManifest> {
  const res = await fetch("/versions.json");
  if (!res.ok) throw new Error(`Failed to load versions.json (${res.status})`);
  return res.json();
}
