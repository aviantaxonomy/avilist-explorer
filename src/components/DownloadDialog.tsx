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
import { xlsxUrlFor, type Version } from "@/lib/versions";
import type { Species } from "@/lib/data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: Version;
  data: Species[];
  filtered: Species[];
  filtersActive: boolean;
  columnMap?: Record<string, string[]>;
};

type Format = "csv" | "xlsx";
type Variant = "basic" | "extended";
type Rows = "filtered" | "full";

function downloadFile(url: string, filename?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DownloadDialog({
  open,
  onOpenChange,
  version,
  data,
  filtered,
  filtersActive,
  columnMap,
}: Props) {
  const [format, setFormat] = useState<Format>("csv");
  const [variant, setVariant] = useState<Variant>("basic");
  const [rows, setRows] = useState<Rows>("filtered");

  const showRowsOption = format === "csv" && filtersActive;

  const handleDownload = () => {
    if (format === "xlsx") {
      const url = xlsxUrlFor(version, variant);
      downloadFile(url);
    } else {
      const useFiltered = !showRowsOption || rows === "filtered";
      const exportRows = useFiltered ? filtered : data;
      downloadCsv(exportRows, variant, columnMap);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <Field label="Format">
            <PillGroup
              value={format}
              onChange={setFormat}
              options={[
                { value: "csv", label: "CSV" },
                { value: "xlsx", label: "XLSX" },
              ]}
            />
          </Field>

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

          {showRowsOption && (
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
