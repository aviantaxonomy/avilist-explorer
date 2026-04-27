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

export type CsvVariant = "basic" | "extended";

/**
 * Resolve the export header for a canonical field. By convention,
 * `columnMap[field][0]` is the canonical xlsx name and what we use as the
 * CSV column header. Falls back to the canonical name itself.
 */
function headerFor(field: Column, columnMap?: Record<string, string[]>) {
  return columnMap?.[field]?.[0] ?? field;
}

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

export function downloadCsv(
  rows: Species[],
  variant: CsvVariant,
  columnMap?: Record<string, string[]>,
) {
  const fields: Column[] =
    variant === "basic" ? BASIC_FIELDS : ([...COLUMNS] as Column[]);
  const headers = fields.map((f) => escape(headerFor(f, columnMap)));
  const lines = [headers.join(",")];
  for (const t of rows) {
    lines.push(fields.map((f) => escape(t[f])).join(","));
  }
  // Prepend UTF-8 BOM so Excel auto-detects the encoding. Without it,
  // Windows Excel falls back to its default codepage and mangles accented
  // characters in scientific names, type localities, and citations.
  const blob = new Blob(["﻿" + lines.join("\n")], {
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

export const EXTENDED_FIELD_COUNT = COLUMNS.length;
export const BASIC_FIELD_COUNT = BASIC_FIELDS.length;
