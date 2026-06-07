import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Download, ExternalLink, Loader2, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { loadReferences, type Reference } from "@/lib/data";
import { referencesPathFor, type Version } from "@/lib/versions";
import { downloadReferencesCsv } from "@/lib/csv";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: Version;
};

export function ReferencesSheet({ open, onOpenChange, version }: Props) {
  const { data: references = null } = useQuery({
    queryKey: ["references", version.id],
    queryFn: () => loadReferences(referencesPathFor(version)),
    staleTime: Infinity,
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!references) return null;
    const q = query.trim().toLowerCase();
    if (!q) return references;
    return references.filter(
      (r) =>
        r.short.toLowerCase().includes(q) ||
        r.full.toLowerCase().includes(q),
    );
  }, [references, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-surface text-ink font-sans flex flex-col gap-0 px-0 pt-0 pb-0 data-[side=right]:w-full data-[side=right]:sm:w-[560px] data-[side=right]:sm:max-w-[560px]"
      >
        <SheetHeader className="border-rule border-b px-6 py-5">
          <SheetTitle className="text-ink text-lg font-medium">
            References
          </SheetTitle>
          <p className="text-ink-3 text-xs">
            Sources cited in {version.label} decision summaries.
          </p>
        </SheetHeader>

        <div className="border-rule border-b px-6 py-3">
          <div className="relative">
            <Search className="text-ink-3 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search author or title…"
              disabled={!references}
              className="bg-bg border-rule focus:border-ink-2 text-ink placeholder:text-ink-3 h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <ReferencesBody
          references={references}
          filtered={filtered}
          query={query}
          version={version}
        />
      </SheetContent>
    </Sheet>
  );
}

function ReferencesBody({
  references,
  filtered,
  query,
  version,
}: {
  references: Reference[] | null;
  filtered: Reference[] | null;
  query: string;
  version: Version;
}) {
  if (!references || !filtered) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-ink-3 flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading references…</p>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-ink-3 flex-1 py-12 text-center text-sm">
        No references match “{query}”.
      </div>
    );
  }

  return (
    <ReferencesList
      references={references}
      filtered={filtered}
      version={version}
    />
  );
}

function ReferencesList({
  references,
  filtered,
  version,
}: {
  references: Reference[];
  filtered: Reference[];
  version: Version;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 110,
    overscan: 8,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="text-ink-3">
          {filtered.length.toLocaleString()}
          {filtered.length !== references.length
            ? ` of ${references.length.toLocaleString()}`
            : ""}{" "}
          references
        </div>
        <button
          type="button"
          onClick={() => downloadReferencesCsv(references, version.id)}
          className="text-ink-2 hover:text-ink inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
        >
          <Download className="h-3 w-3" />
          Download CSV
        </button>
      </div>
      <div
        className="relative"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((vItem) => {
          const r = filtered[vItem.index];
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0"
              style={{ transform: `translateY(${vItem.start}px)` }}
            >
              <ReferenceRow ref_={r} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferenceRow({ ref_ }: { ref_: Reference }) {
  const links = [
    ref_.doi && { href: ref_.doi, label: "DOI" },
    ref_.url && { href: ref_.url, label: "View Article" },
  ].filter(Boolean) as { href: string; label: string }[];
  return (
    <div className="border-rule border-b py-4">
      <div
        className="text-ink text-sm font-semibold"
        dangerouslySetInnerHTML={{ __html: ref_.short }}
      />
      <div
        className="text-ink-2 mt-1 text-[13px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: ref_.full }}
      />
      {links.length > 0 && (
        <div className="mt-1.5 flex items-center gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-2 hover:text-ink inline-flex items-center gap-1 text-xs"
            >
              {link.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
