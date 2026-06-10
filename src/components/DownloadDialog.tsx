import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  downloadCsv,
  BASIC_FIELD_COUNT,
  EXTENDED_FIELD_COUNT,
} from "@/lib/csv";
import type { Species } from "@/lib/data";
import type { LocaleNames } from "@/lib/ebird";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Species[];
  filtered: Species[];
  filtersActive: boolean;
  columnMap?: Record<string, string[]>;
  localeLabel?: string | null;
  localeNames?: LocaleNames | null;
};

type Variant = "basic" | "extended";
type Rows = "filtered" | "full";

const COLUMN_OPTIONS: { value: Variant; label: string; description: string }[] = [
  {
    value: "basic",
    label: "Basic",
    description: `${BASIC_FIELD_COUNT} columns — core taxonomy plus IUCN status.`,
  },
  {
    value: "extended",
    label: "Extended",
    description: `All ${EXTENDED_FIELD_COUNT} columns — adds authorities, citations, alternate names, ranges, external IDs, and nomenclatural detail.`,
  },
];

export function DownloadDialog({
  open,
  onOpenChange,
  data,
  filtered,
  filtersActive,
  columnMap,
  localeLabel,
  localeNames,
}: Props) {
  const [variant, setVariant] = useState<Variant>("basic");
  const [rows, setRows] = useState<Rows>("filtered");

  const handleDownload = () => {
    const useFiltered = !filtersActive || rows === "filtered";
    const exportRows = useFiltered ? filtered : data;
    const locale =
      localeLabel && localeNames
        ? { label: localeLabel, names: localeNames }
        : undefined;
    downloadCsv(exportRows, variant, columnMap, locale);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <Field label="Columns">
            <CardGroup
              value={variant}
              onChange={setVariant}
              options={COLUMN_OPTIONS}
            />
          </Field>

          {filtersActive && (
            <Field label="Rows">
              <PillGroup
                value={rows}
                onChange={setRows}
                options={[
                  {
                    value: "filtered",
                    label: `Filtered (${filtered.length.toLocaleString()})`,
                  },
                  {
                    value: "full",
                    label: `All (${data.length.toLocaleString()})`,
                  },
                ]}
              />
            </Field>
          )}
        </div>

        <p className="text-ink-3 text-xs leading-relaxed">
          Want the full dataset as XLSX? Download it from{" "}
          <a
            href="https://www.avilist.org"
            target="_blank"
            rel="noopener"
            className="text-ink-2 underline underline-offset-2"
          >
            avilist.org
          </a>
          .
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleDownload}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-ink-2 text-[11px] font-semibold uppercase tracking-[0.1em]">
        {label}
      </div>
      {children}
      {help && <div className="text-ink-3 text-xs">{help}</div>}
    </div>
  );
}

function CardGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; description: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-colors ${
              active
                ? "bg-warm border-[#c5b89a]"
                : "border-rule bg-surface hover:border-ink-3"
            }`}
          >
            <span
              className={`text-sm font-semibold ${active ? "text-ink" : "text-ink-2"}`}
            >
              {o.label}
            </span>
            <span className="text-ink-3 text-xs leading-relaxed">
              {o.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PillGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
              active
                ? "bg-warm text-ink border-[#c5b89a] font-semibold"
                : "border-rule bg-surface text-ink-2 hover:border-ink-3 font-medium"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
