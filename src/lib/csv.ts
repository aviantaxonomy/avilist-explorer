import type { Species } from "./data";
import { COLUMNS, type Column } from "@/columns";

const BASIC_FIELDS: Column[] = [
  "sequence",
  "rank",
  "order",
  "family",
  "familyEn",
  "sciName",
  "name",
  "iucn",
];

export type CsvVariant = "basic" | "expanded";

function stripHtml(s: string): string {
  if (!s.includes("<") && !s.includes("&")) return s;
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escape(v: unknown): string {
  let s = String(v ?? "");
  s = stripHtml(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(rows: Species[], variant: CsvVariant) {
  const fields: Column[] =
    variant === "basic" ? BASIC_FIELDS : ([...COLUMNS] as Column[]);
  const lines = [fields.join(",")];
  for (const t of rows) {
    lines.push(fields.map((f) => escape(t[f])).join(","));
  }
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `avilist-${variant}-${rows.length}-taxa.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const EXPANDED_FIELD_COUNT = COLUMNS.length;
export const BASIC_FIELD_COUNT = BASIC_FIELDS.length;
