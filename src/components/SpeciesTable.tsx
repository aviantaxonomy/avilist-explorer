import { useMemo, useRef, useState } from "react";
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
import { FileText } from "lucide-react";
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
  if (!rank || !RANK_KEYS.has(rank)) return null;
  return (
    <span
      className={`font-sans inline-block min-w-[70px] rounded-[2px] border px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] rank-badge-${rank}`}
    >
      {rank}
    </span>
  );
}

function ScientificCell({ value, rank }: { value?: string; rank?: string }) {
  if (!value) return null;
  const italic = rank === "species" || rank === "subspecies";
  return (
    <span className={`font-fraunces text-sm ${italic ? "italic" : ""}`}>
      {value}
    </span>
  );
}

function IucnPill({ code }: { code?: string }) {
  if (!code) return null;
  const info = IUCN_INFO[code as IucnCode];
  if (!info) return <span>{code}</span>;
  return (
    <span
      className="font-mono inline-block rounded px-[9px] py-[3px] text-[11px] font-semibold tracking-wider"
      style={{ background: info.bg, color: info.fg }}
      title={info.label}
    >
      {code}
    </span>
  );
}

const renderText = (info: CellContext<Species, unknown>) => {
  return (info.getValue() as string | undefined) ?? null;
};

type Props = {
  data: Species[];
  selected: Species | null;
  onSelect: (s: Species, scrollTo?: string) => void;
};

export function SpeciesTable({ data, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Species>[]>(
    () => [
      {
        id: "index",
        header: "#",
        size: 73,
        enableSorting: false,
        cell: (ctx) => (
          <span className="font-mono text-ink-3 text-[11px] [font-variant-numeric:tabular-nums]">
            {ctx.row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "rank",
        header: "Rank",
        size: 120,
        enableSorting: false,
        cell: (ctx) => (
          <RankBadge rank={ctx.getValue() as string | undefined} />
        ),
      },
      { accessorKey: "order", header: "Order", size: 170, cell: renderText },
      { accessorKey: "family", header: "Family", size: 160, cell: renderText },
      {
        accessorKey: "familyEn",
        header: "Family (English)",
        size: 200,
        enableSorting: false,
        cell: renderText,
      },
      {
        accessorKey: "sciName",
        header: "Scientific name",
        size: 360,
        cell: (ctx) => (
          <ScientificCell
            value={ctx.getValue() as string | undefined}
            rank={ctx.row.original.rank}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "English name",
        size: 200,
        cell: (ctx) => {
          const v = ctx.getValue() as string | undefined;
          return v ? <span className="text-ink-2">{v}</span> : null;
        },
      },
      {
        accessorKey: "proposalNumber",
        header: "Decision",
        size: 104,
        enableSorting: false,
        cell: (ctx) => {
          const value = ctx.getValue() as string | undefined;
          if (!value) return null;
          return (
            <button
              type="button"
              className="text-ink-3 hover:bg-warm hover:text-ink inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1"
              title="View decision summary"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(ctx.row.original, "decision-summary");
              }}
            >
              <FileText className="size-3.5" />
              <span className="text-[12px] font-medium">View</span>
            </button>
          );
        },
      },
      {
        accessorKey: "iucn",
        header: "IUCN",
        size: 120,
        sortingFn: iucnSort,
        cell: (ctx) => <IucnPill code={ctx.getValue() as string | undefined} />,
      },
      {
        id: "details",
        header: "",
        size: 96,
        enableSorting: false,
        cell: () => (
          <button
            type="button"
            className="text-ink-3 hover:text-ink cursor-pointer text-[12px] font-medium underline underline-offset-2"
          >
            Details
          </button>
        ),
      },
    ],
    [onSelect],
  );

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
    <div ref={scrollRef} className="bg-surface relative flex-1 overflow-auto">
      <div
        className="bg-warm border-rule sticky top-0 z-10 grid border-b"
        style={{ gridTemplateColumns: gridTemplate, minWidth: totalWidth }}
      >
        {headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sorted = header.column.getIsSorted();
          const isFirst = header === headers[0];
          return (
            <div
              key={header.id}
              className={[
                "flex items-center gap-1 truncate px-3 py-3 text-[11px] font-semibold uppercase tracking-wider select-none",
                isFirst ? "pl-6" : "",
                canSort ? "cursor-pointer" : "",
                sorted ? "text-accent" : "text-ink-2",
              ].join(" ")}
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
              {canSort && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  aria-hidden="true"
                  className={`shrink-0 ${sorted ? "text-accent" : "text-ink-3"}`}
                >
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
        className="relative"
        style={{
          height: virtualizer.getTotalSize(),
          minWidth: totalWidth,
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          const isSelected =
            selected != null && selected.sequence === row.original.sequence;
          return (
            <div
              key={row.id}
              className={[
                "border-rule absolute inset-x-0 grid cursor-pointer border-b text-[13px] transition-colors hover:bg-[rgba(0,0,0,0.025)]",
                isSelected
                  ? "bg-selected [&>:first-child]:shadow-[inset_3px_0_0_var(--color-accent-2)]"
                  : "",
              ].join(" ")}
              style={{
                gridTemplateColumns: gridTemplate,
                transform: `translateY(${vRow.start}px)`,
                height: ROW_HEIGHT,
              }}
              onClick={() => onSelect(row.original)}
            >
              {row.getVisibleCells().map((cell, i) => {
                const v = cell.getValue();
                const title = typeof v === "string" ? v : undefined;
                return (
                  <div
                    key={cell.id}
                    className={`flex items-center truncate px-3 ${i === 0 ? "pl-6" : ""}`}
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
