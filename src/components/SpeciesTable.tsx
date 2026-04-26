import { useRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Species } from "@/lib/data";

const ROW_HEIGHT = 40;

const columns: ColumnDef<Species>[] = [
  { accessorKey: "Sequence", header: "#", size: 64 },
  { accessorKey: "Taxon_rank", header: "Rank", size: 96 },
  { accessorKey: "Order", header: "Order", size: 168 },
  { accessorKey: "Family", header: "Family", size: 168 },
  { accessorKey: "Family_English_name", header: "Family (English)", size: 200 },
  {
    accessorKey: "Scientific_name",
    header: "Scientific name",
    size: 240,
    meta: { italic: true },
  },
  { accessorKey: "English_name_AviList", header: "English name", size: 220 },
  { accessorKey: "IUCN_Red_List_Category", header: "IUCN", size: 72 },
];

export function SpeciesTable({ data }: { data: Species[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
      style={{ height: "calc(100vh - 8rem)" }}
    >
      <div
        className="bg-muted text-muted-foreground sticky top-0 z-10 grid border-b text-xs font-medium"
        style={{
          gridTemplateColumns: gridTemplate,
          height: ROW_HEIGHT,
          minWidth: totalWidth,
        }}
      >
        {headers.map((header) => (
          <div key={header.id} className="flex items-center truncate px-3">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
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
