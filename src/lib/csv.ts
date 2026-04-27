import type { Species } from "./data";

const HEADER = [
  "#",
  "rank",
  "order",
  "family",
  "family_english",
  "scientific_name",
  "english_name",
  "iucn",
];

function escape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(rows: Species[]) {
  const lines = [HEADER.join(",")];
  rows.forEach((t, i) => {
    lines.push(
      [
        i + 1,
        t.Taxon_rank,
        t.Order,
        t.Family,
        t.Family_English_name,
        t.Scientific_name,
        t.English_name_AviList,
        t.IUCN_Red_List_Category,
      ]
        .map(escape)
        .join(","),
    );
  });
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `avilist-${rows.length}-taxa.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
