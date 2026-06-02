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
import { downloadCsv } from "@/lib/csv";
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
          <DialogTitle>Download</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <Field label="Columns">
            <PillGroup
              value={variant}
              onChange={setVariant}
              options={[
                { value: "basic", label: "Basic" },
                { value: "extended", label: "Extended" },
              ]}
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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleDownload}>Download</Button>
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
