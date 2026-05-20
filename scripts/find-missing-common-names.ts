import { readFile } from "node:fs/promises";
import { COLUMNS } from "../src/columns.ts";

const AVILIST_JSON = "public/data/avilist-2025.06.json";
const EBIRD_API =
  "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species";

type EbirdTaxon = {
  speciesCode: string;
};

const rankIdx = COLUMNS.indexOf("rank");
const sciNameIdx = COLUMNS.indexOf("sciName");
const nameIdx = COLUMNS.indexOf("name");
const cornellCodeIdx = COLUMNS.indexOf("cornellCode");

async function fetchEbirdSpeciesCodes(): Promise<Set<string>> {
  const key = process.env.VITE_EBIRD_API_KEY;
  if (!key) throw new Error("VITE_EBIRD_API_KEY is not set in .env");
  console.log("Fetching eBird taxonomy…");
  const res = await fetch(EBIRD_API, {
    headers: { "X-eBirdApiToken": key },
  });
  if (!res.ok) {
    throw new Error(`eBird API ${res.status}: ${await res.text()}`);
  }
  const taxa = (await res.json()) as EbirdTaxon[];
  const codes = new Set<string>();
  for (const t of taxa) {
    if (t.speciesCode) codes.add(t.speciesCode.trim().toLowerCase());
  }
  console.log(`  ${taxa.length} taxa · ${codes.size} unique species codes`);
  return codes;
}

async function main() {
  const codes = await fetchEbirdSpeciesCodes();

  console.log(`Reading ${AVILIST_JSON}…`);
  const rows: (string | null)[][] = JSON.parse(
    await readFile(AVILIST_JSON, "utf8"),
  );

  type Row = { sciName: string; name: string; code: string };
  const unmatched: Row[] = [];
  const noCode: Row[] = [];
  let checked = 0;
  for (const row of rows) {
    if (row[rankIdx] !== "species") continue;
    checked++;
    const raw = row[cornellCodeIdx];
    const entry: Row = {
      sciName: row[sciNameIdx] ?? "",
      name: row[nameIdx] ?? "",
      code: raw ?? "",
    };
    if (!raw) noCode.push(entry);
    else if (!codes.has(raw.trim().toLowerCase())) unmatched.push(entry);
  }

  const fmtName = (m: Row) => m.name || "(no English name)";

  console.log(`\nChecked ${checked} species\n`);

  console.log(`${unmatched.length} species with an eBird code but no match:\n`);
  for (const m of unmatched) {
    console.log(`  ${fmtName(m)} — ${m.sciName}  ${m.code}`);
  }

  console.log(`\n${noCode.length} species with no eBird code in AviList:\n`);
  for (const m of noCode) {
    console.log(`  ${fmtName(m)} — ${m.sciName}`);
  }
}

await main();
