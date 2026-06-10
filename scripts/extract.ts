import ExcelJS from "exceljs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { COLUMNS } from "../src/columns.ts";

const VERSIONS_FILE = "public/versions.json";

type Version = {
  id: string;
  label: string;
  released: string;
  extendedXlsx: string;
  sheet: string;
  referencesSheet?: string;
  clementsVersion?: string;
  birdLifeVersion?: string;
};

type Reference = {
  short: string;
  full: string;
  url?: string;
  doi?: string;
};

type Manifest = {
  columnMap?: Record<string, string[]>;
  versions: Version[];
};

// Substitute {field} placeholders in a columnMap alias with values from the
// version entry. Lets a column name track its per-revision version suffix
// declaratively — e.g. "English_name_Clements_{clementsVersion}" resolves to
// "English_name_Clements_v2025" without editing columnMap each release.
function interpolate(alias: string, version: Version): string {
  return alias.replace(/\{(\w+)\}/g, (_, key) => {
    const value = (version as Record<string, unknown>)[key];
    if (value == null) {
      throw new Error(
        `columnMap alias "${alias}" references version field "${key}", ` +
          `which is missing from version "${version.id}"`,
      );
    }
    return String(value);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function runsToHtml(runs: ExcelJS.RichText[]): string {
  let out = "";
  for (const run of runs) {
    if (!run.text) continue;
    const f = run.font ?? {};
    let open = "";
    let close = "";
    if (f.bold) {
      open += "<strong>";
      close = "</strong>" + close;
    }
    if (f.italic) {
      open += "<em>";
      close = "</em>" + close;
    }
    if (f.underline) {
      open += "<u>";
      close = "</u>" + close;
    }
    if (f.strike) {
      open += "<s>";
      close = "</s>" + close;
    }
    out += open + escapeHtml(run.text) + close;
  }
  return out;
}

function cellValue(cell: ExcelJS.Cell): string | null {
  const v = cell.value;
  if (v == null || v === "") return null;
  if (typeof v === "object" && "richText" in v && Array.isArray(v.richText)) {
    return runsToHtml(v.richText);
  }
  if (typeof v === "object" && "hyperlink" in v) {
    return cell.text || v.hyperlink || null;
  }
  if (typeof v === "object" && "result" in v) {
    return v.result == null ? null : String(v.result);
  }
  if (v instanceof Date) return v.toISOString();
  return cell.text;
}

async function processVersion(
  version: Version,
  canonical: string[],
  columnMap: Record<string, string[]>,
): Promise<void> {
  console.log(`\n=== ${version.id} ===`);
  console.log(`Reading ${version.extendedXlsx}…`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(version.extendedXlsx);

  const sheet = wb.getWorksheet(version.sheet);
  if (!sheet) {
    throw new Error(
      `Sheet "${version.sheet}" not found in ${version.extendedXlsx}`,
    );
  }

  // Build xlsx-name → column-index from header row
  const xlsxIndex = new Map<string, number>();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const name = cell.text;
    if (name && !xlsxIndex.has(name)) xlsxIndex.set(name, col);
  });

  // Resolve each canonical field to its xlsx column index (or null if missing).
  // For each field: try the columnMap aliases in order; fall back to the
  // canonical name itself.
  const resolved: { canonical: string; xlsxCol: number | null }[] = [];
  const missing: string[] = [];
  for (const field of canonical) {
    const candidates = columnMap[field] ?? [field];
    let col: number | null = null;
    for (const alias of candidates) {
      const name = interpolate(alias, version);
      const idx = xlsxIndex.get(name);
      if (idx != null) {
        col = idx;
        break;
      }
    }
    resolved.push({ canonical: field, xlsxCol: col });
    if (col == null) missing.push(field);
  }
  if (missing.length > 0) {
    console.warn(
      `  ⚠️  ${missing.length} canonical field(s) not found in xlsx — will be null in output: ${missing.join(", ")}`,
    );
  }

  // Walk data rows; produce arrays in canonical order. Real taxa always have a
  // numeric Sequence, so any other row (the field-name header, plus the display-
  // label header some editions add below it) is skipped.
  const seqCol = resolved.find((r) => r.canonical === "sequence")?.xlsxCol ?? 1;

  const compact: (string | null)[][] = [];
  let cellCount = 0;
  let richCount = 0;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const xlsxRow = sheet.getRow(r);
    if (!/^\d+$/.test(xlsxRow.getCell(seqCol).text.trim())) continue;
    const out: (string | null)[] = new Array(canonical.length).fill(null);
    let hasAny = false;
    for (let i = 0; i < resolved.length; i++) {
      const { xlsxCol } = resolved[i];
      if (xlsxCol == null) continue;
      const cell = xlsxRow.getCell(xlsxCol);
      const val = cellValue(cell);
      if (val == null) continue;
      out[i] = val;
      hasAny = true;
      cellCount++;
      if (/<(em|strong|u|s)>/.test(val)) richCount++;
    }
    if (hasAny) compact.push(out);
  }

  console.log(
    `  ${compact.length} rows · ${cellCount} cells · ${richCount} HTML cells`,
  );

  const compactJson = JSON.stringify(compact);
  const outPath = `public/data/avilist-${version.id}.json`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, compactJson);

  const { size } = await stat(outPath);
  console.log(`  Wrote ${outPath} (${(size / 1024 / 1024).toFixed(2)} MB)`);

  await processReferences(wb, version);
}

async function processReferences(
  wb: ExcelJS.Workbook,
  version: Version,
): Promise<void> {
  const sheetName = version.referencesSheet ?? "References";
  const sheet = wb.getWorksheet(sheetName);
  if (!sheet) {
    console.warn(`  ⚠️  References sheet "${sheetName}" not found — skipping`);
    return;
  }

  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, "_");

  let headerRow = 0;
  let shortCol: number | undefined;
  let fullCol: number | undefined;
  let urlCol: number | undefined;
  let doiCol: number | undefined;
  const maxScan = Math.min(sheet.rowCount, 10);
  for (let r = 1; r <= maxScan; r++) {
    const headerIndex = new Map<string, number>();
    sheet.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
      const name = cell.text;
      if (name && !headerIndex.has(norm(name))) headerIndex.set(norm(name), col);
    });
    if (
      headerIndex.has("short_reference") &&
      headerIndex.has("full_reference")
    ) {
      headerRow = r;
      shortCol = headerIndex.get("short_reference");
      fullCol = headerIndex.get("full_reference");
      urlCol = headerIndex.get("url");
      doiCol = headerIndex.get("doi");
      break;
    }
  }

  if (shortCol == null || fullCol == null) {
    console.warn(
      `  ⚠️  References sheet missing Short_reference / Full_reference — skipping`,
    );
    return;
  }

  const refs: Reference[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const short = cellValue(row.getCell(shortCol));
    const full = cellValue(row.getCell(fullCol));
    if (!short || !full) continue;
    const ref: Reference = { short, full };
    if (urlCol != null) {
      const url = cellValue(row.getCell(urlCol));
      if (url) ref.url = url;
    }
    if (doiCol != null) {
      const doi = cellValue(row.getCell(doiCol));
      if (doi) ref.doi = doi;
    }
    refs.push(ref);
  }

  const outPath = `public/data/avilist-${version.id}-references.json`;
  await writeFile(outPath, JSON.stringify(refs));
  const { size } = await stat(outPath);
  console.log(
    `  ${refs.length} references → ${outPath} (${(size / 1024).toFixed(1)} KB)`,
  );
}

async function main() {
  const manifest: Manifest = JSON.parse(await readFile(VERSIONS_FILE, "utf8"));
  console.log(
    `${COLUMNS.length} canonical columns · ${manifest.versions.length} version(s)`,
  );

  const columnMap = manifest.columnMap ?? {};
  for (const version of manifest.versions) {
    await processVersion(version, [...COLUMNS], columnMap);
  }
}

await main();
