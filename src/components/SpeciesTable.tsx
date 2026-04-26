import { useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { Species } from "@/lib/data";

const ROW_HEIGHT = 40;

const IUCN_SEVERITY: Record<string, number> = {
  LC: 1,
  NT: 2,
  VU: 3,
  EN: 4,
  CR: 5,
  EW: 6,
  EX: 7,
  DD: 8,
  NE: 9,
};

const iucnSort = (a: Row<Species>, b: Row<Species>, id: string) => {
  const av = IUCN_SEVERITY[(a.getValue(id) as string) ?? ""] ?? 99;
  const bv = IUCN_SEVERITY[(b.getValue(id) as string) ?? ""] ?? 99;
  return av - bv;
};

const columns: ColumnDef<Species>[] = [
  {
    accessorKey: "Sequence",
    header: "#",
    size: 64,
    sortingFn: "alphanumeric",
  },
  { accessorKey: "Taxon_rank", header: "Rank", size: 96, enableSorting: false },
  { accessorKey: "Order", header: "Order", size: 168 },
  { accessorKey: "Family", header: "Family", size: 168 },
  {
    accessorKey: "Family_English_name",
    header: "Family (English)",
    size: 200,
    enableSorting: false,
  },
  {
    accessorKey: "Scientific_name",
    header: "Scientific name",
    size: 240,
    meta: { italic: true },
  },
  { accessorKey: "English_name_AviList", header: "English name", size: 220 },
  {
    accessorKey: "IUCN_Red_List_Category",
    header: "IUCN",
    size: 80,
    sortingFn: iucnSort,
  },
];

export function SpeciesTable({ data }: { data: Species[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const headers = table.getHeaderGroups()[0].headers;
  const gridTemplate = headers
    .map((h) => `${h.column.getSize()}px`)
    .join(" ");
  const totalWidth = headers.reduce((sum, h) => sum + h.column.getSize(), 0);

  return (
    <div
      ref={scrollRef}
      className="relative overflow-auto rounded-md border"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      <div
        className="bg-muted text-muted-foreground sticky top-0 z-10 grid border-b text-xs font-medium"
        style={{
          gridTemplateColumns: gridTemplate,
          height: ROW_HEIGHT,
          minWidth: totalWidth,
        }}
      >
        {headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sorted = header.column.getIsSorted();
          return (
            <div
              key={header.id}
              className={`flex items-center gap-1 truncate px-3 ${canSort ? "hover:text-foreground cursor-pointer select-none" : ""}`}
              onClick={
                canSort ? header.column.getToggleSortingHandler() : undefined
              }
            >
              <span className="truncate">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </span>
              {canSort &&
                (sorted === "asc" ? (
                  <ChevronUp className="size-3.5 shrink-0" />
                ) : sorted === "desc" ? (
                  <ChevronDown className="size-3.5 shrink-0" />
                ) : (
                  <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
                ))}
            </div>
          );
        })}
      </div>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          minWidth: totalWidth,
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          return (
            <div
              key={row.id}
              className="hover:bg-muted/40 absolute inset-x-0 grid border-b text-sm"
              style={{
                transform: `translateY(${vRow.start}px)`,
                gridTemplateColumns: gridTemplate,
                height: ROW_HEIGHT,
              }}
            >
              {row.getVisibleCells().map((cell) => {
                const value = cell.getValue() as string | undefined;
                const italic = (
                  cell.column.columnDef.meta as { italic?: boolean } | undefined
                )?.italic;
                return (
                  <div
                    key={cell.id}
                    className={`flex items-center truncate px-3 ${italic ? "italic" : ""}`}
                    title={value ?? ""}
                  >
                    {value ?? ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
