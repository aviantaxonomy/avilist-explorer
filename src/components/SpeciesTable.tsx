import { useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Species } from "@/lib/data";
import { IUCN_INFO, type IucnCode } from "@/lib/iucn";

const ROW_HEIGHT = 48;

const RANK_KEYS = new Set(["order", "family", "genus", "species", "subspecies"]);

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

function RankBadge({ rank }: { rank?: string }) {
  if (!rank || !RANK_KEYS.has(rank)) return <span className="mu-empty">—</span>;
  return (
    <span className={`mu-rank-badge mu-rank-badge-${rank}`}>{rank}</span>
  );
}

function ScientificCell({ value }: { value?: string }) {
  if (!value) return <span className="mu-empty">—</span>;
  return <span className="mu-sci">{value}</span>;
}

function IucnPill({ code }: { code?: string }) {
  if (!code) return <span className="mu-empty">—</span>;
  const info = IUCN_INFO[code as IucnCode];
  if (!info) return <span>{code}</span>;
  return (
    <span
      className="mu-iucn"
      style={{ background: info.bg, color: info.fg }}
      title={info.label}
    >
      {code}
    </span>
  );
}

const renderText = (info: CellContext<Species, unknown>) => {
  const v = info.getValue() as string | undefined;
  return v ?? <span className="mu-empty">—</span>;
};

const columns: ColumnDef<Species>[] = [
  {
    id: "index",
    header: "#",
    size: 56,
    enableSorting: false,
    cell: (ctx) => <span className="mu-num">{ctx.row.index + 1}</span>,
  },
  {
    accessorKey: "Taxon_rank",
    header: "Rank",
    size: 120,
    enableSorting: false,
    cell: (ctx) => <RankBadge rank={ctx.getValue() as string | undefined} />,
  },
  { accessorKey: "Order", header: "Order", size: 170, cell: renderText },
  { accessorKey: "Family", header: "Family", size: 160, cell: renderText },
  {
    accessorKey: "Family_English_name",
    header: "Family (English)",
    size: 200,
    enableSorting: false,
    cell: renderText,
  },
  {
    accessorKey: "Scientific_name",
    header: "Scientific name",
    size: 360,
    cell: (ctx) => (
      <ScientificCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "English_name_AviList",
    header: "English name",
    size: 200,
    cell: (ctx) => {
      const v = ctx.getValue() as string | undefined;
      return v ? <span className="mu-en">{v}</span> : <span className="mu-empty">—</span>;
    },
  },
  {
    accessorKey: "IUCN_Red_List_Category",
    header: "IUCN",
    size: 120,
    sortingFn: iucnSort,
    cell: (ctx) => <IucnPill code={ctx.getValue() as string | undefined} />,
  },
];

type Props = {
  data: Species[];
  selected: Species | null;
  onSelect: (s: Species) => void;
};

export function SpeciesTable({ data, selected, onSelect }: Props) {
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
    <div ref={scrollRef} className="mu-table-wrap">
      <div
        className="mu-table-head"
        style={{ gridTemplateColumns: gridTemplate, minWidth: totalWidth }}
      >
        {headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sorted = header.column.getIsSorted();
          return (
            <div
              key={header.id}
              className={`mu-th ${canSort ? "is-sortable" : ""} ${sorted ? "is-active" : ""}`}
              onClick={
                canSort ? header.column.getToggleSortingHandler() : undefined
              }
            >
              <span className="mu-cell-truncate">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </span>
              {canSort && (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  {sorted === "asc" ? (
                    <path
                      d="M2 6l3-3 3 3"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="1.4"
                    />
                  ) : sorted === "desc" ? (
                    <path
                      d="M2 4l3 3 3-3"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="1.4"
                    />
                  ) : (
                    <path
                      d="M2 4l3-3 3 3M2 6l3 3 3-3"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="1.4"
                    />
                  )}
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div
        className="mu-rows"
        style={{
          height: virtualizer.getTotalSize(),
          minWidth: totalWidth,
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          const isSelected =
            selected != null && selected.Sequence === row.original.Sequence;
          return (
            <div
              key={row.id}
              className={`mu-row ${isSelected ? "is-selected" : ""}`}
              style={{
                gridTemplateColumns: gridTemplate,
                transform: `translateY(${vRow.start}px)`,
                height: ROW_HEIGHT,
              }}
              onClick={() => onSelect(row.original)}
            >
              {row.getVisibleCells().map((cell) => {
                const v = cell.getValue();
                const title = typeof v === "string" ? v : undefined;
                return (
                  <div
                    key={cell.id}
                    className="mu-cell mu-cell-truncate"
                    title={title}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
