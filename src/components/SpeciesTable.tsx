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
import { baseIucnCode, IUCN_INFO } from "@/lib/iucn";

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
  const av =
    IUCN_SEVERITY[baseIucnCode(a.getValue(id) as string) ?? ""] ?? 99;
  const bv =
    IUCN_SEVERITY[baseIucnCode(b.getValue(id) as string) ?? ""] ?? 99;
  return av - bv;
};

const RANK_HIERARCHY: Record<string, number> = {
  order: 0,
  family: 1,
  genus: 2,
  species: 3,
  subspecies: 4,
};

const rankSort = (a: Row<Species>, b: Row<Species>, id: string) => {
  const av = RANK_HIERARCHY[(a.getValue(id) as string) ?? ""] ?? 99;
  const bv = RANK_HIERARCHY[(b.getValue(id) as string) ?? ""] ?? 99;
  return av - bv;
};

const RANK_ROW_BG: Record<string, string> = {
  order: "bg-[#dbe1cd] hover:bg-[#cbd5b8]",
  family: "bg-[#e0d2b4] hover:bg-[#d0c19c]",
  genus: "bg-[#f3e3c5] hover:bg-[#ead4a8]",
  species: "bg-warm/60 hover:bg-warm/85",
  subspecies: "opacity-60 hover:bg-[rgba(0,0,0,0.025)]",
};

function rankRowClass(rank?: string): string {
  return RANK_ROW_BG[rank ?? ""] ?? "hover:bg-[rgba(0,0,0,0.025)]";
}

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
  const italic =
    rank === "genus" || rank === "species" || rank === "subspecies";
  return (
    <span className={`font-fraunces text-sm ${italic ? "italic" : ""}`}>
      {value}
    </span>
  );
}

function IucnPill({ code }: { code?: string }) {
  if (!code) return null;
  const base = baseIucnCode(code);
  const info = base ? IUCN_INFO[base] : undefined;
  if (!base || !info) return <span>{code}</span>;
  return (
    <span
      className="font-mono inline-block rounded px-[9px] py-[3px] text-[11px] font-semibold tracking-wider"
      style={{ background: info.bg, color: info.fg }}
      title={code !== base ? `${code} — ${info.label}` : info.label}
    >
      {base}
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sequence", desc: false },
  ]);

  const columns = useMemo<ColumnDef<Species>[]>(
    () => [
      {
        accessorKey: "sequence",
        header: "#",
        size: 73,
        sortingFn: "alphanumeric",
        cell: (ctx) => (
          <span className="font-mono text-ink-3 text-[11px] [font-variant-numeric:tabular-nums]">
            {ctx.getValue() as string | undefined}
          </span>
        ),
      },
      {
        accessorKey: "rank",
        header: "Rank",
        size: 120,
        sortingFn: rankSort,
        cell: (ctx) => (
          <RankBadge rank={ctx.getValue() as string | undefined} />
        ),
      },
      {
        accessorKey: "name",
        header: "English name",
        size: 200,
        cell: renderText,
      },
      {
        accessorKey: "sciName",
        header: "Scientific name",
        size: 280,
        cell: (ctx) => (
          <ScientificCell
            value={ctx.getValue() as string | undefined}
            rank={ctx.row.original.rank}
          />
        ),
      },
      {
        accessorKey: "range",
        header: "Range",
        size: 420,
        cell: renderText,
      },
      {
        accessorKey: "proposalNumber",
        header: "Decision",
        size: 104,
        sortingFn: "alphanumeric",
        cell: (ctx) => {
          const value = ctx.getValue() as string | undefined;
          if (!value) return null;
          return (
            <button
              type="button"
              className="text-ink-2 hover:text-ink inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium"
              title="View decision summary"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(ctx.row.original, "decision-summary");
              }}
            >
              <FileText className="size-3" />
              <span className="underline underline-offset-2">View</span>
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
            className="text-ink-2 hover:text-ink cursor-pointer text-[12px] font-medium underline underline-offset-2"
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
    defaultColumn: {
      sortUndefined: "last",
    },
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
                sorted ? "text-forest" : "text-ink-2",
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
                  className={`shrink-0 ${sorted ? "text-forest" : "text-ink-3"}`}
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
          const rowRank = row.original.rank;
          const isSelected =
            selected != null && selected.sequence === row.original.sequence;
          return (
            <div
              key={row.id}
              className={[
                "border-rule absolute inset-x-0 grid cursor-pointer border-b text-[13px] transition-colors",
                rankRowClass(rowRank),
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
                    className={`flex items-center overflow-hidden px-3 ${i === 0 ? "pl-6" : ""}`}
                    title={title}
                  >
                    <span className="block w-full truncate">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </span>
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
