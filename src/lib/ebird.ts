export type Locale = {
  code: string;
  name: string;
  lastUpdate?: string;
};

export type LocaleNames = Record<string, string>;

const API_BASE = "https://api.ebird.org/v2/ref";

function apiKey(): string {
  const key = import.meta.env.VITE_EBIRD_API_KEY;
  if (!key) throw new Error("VITE_EBIRD_API_KEY is not set");
  return key;
}

export async function fetchLocales(): Promise<Locale[]> {
  const res = await fetch(`${API_BASE}/taxa-locales/ebird`, {
    headers: { "X-eBirdApiToken": apiKey() },
  });
  if (!res.ok) throw new Error(`Failed to fetch locales (${res.status})`);
  const raw = (await res.json()) as Locale[];
  return raw
    .filter((l) => l.code !== "en_AVI")
    .sort((a, b) => a.name.localeCompare(b.name));
}

type EbirdTaxon = {
  speciesCode: string;
  comName: string;
};

export async function fetchLocaleNames(locale: string): Promise<LocaleNames> {
  const url = `${API_BASE}/taxonomy/ebird?locale=${encodeURIComponent(locale)}&fmt=json&cat=species`;
  const res = await fetch(url, {
    headers: { "X-eBirdApiToken": apiKey() },
  });
  if (!res.ok)
    throw new Error(`Failed to fetch taxonomy for ${locale} (${res.status})`);
  const taxa = (await res.json()) as EbirdTaxon[];
  const out: LocaleNames = {};
  for (const t of taxa) {
    if (t.speciesCode && t.comName) out[t.speciesCode] = t.comName;
  }
  return out;
}
