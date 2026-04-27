import ExcelJS from "exceljs";
import { writeFile, mkdir, stat, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { gzipSync, constants as zlibConstants } from "node:zlib";
import { COLUMNS } from "../src/columns.ts";

const VERSIONS_FILE = "public/versions.json";

type Version = {
  id: string;
  label: string;
  released: string;
  inputXlsx: string;
  sheet: string;
};

type Manifest = {
  columnMap?: Record<string, string[]>;
  versions: Version[];
};

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
  console.log(`Reading ${version.inputXlsx}…`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(version.inputXlsx);

  const sheet = wb.getWorksheet(version.sheet);
  if (!sheet) {
    throw new Error(
      `Sheet "${version.sheet}" not found in ${version.inputXlsx}`,
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
    for (const name of candidates) {
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

  // Walk data rows; produce arrays in canonical order.
  const compact: (string | null)[][] = [];
  let cellCount = 0;
  let richCount = 0;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const xlsxRow = sheet.getRow(r);
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
  const outPath = `public/data/avilist-${version.id}.json.gz`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    gzipSync(compactJson, { level: zlibConstants.Z_BEST_COMPRESSION }),
  );

  const { size } = await stat(outPath);
  console.log(`  Wrote ${outPath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
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
