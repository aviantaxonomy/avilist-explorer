import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
      downloadCsv(exportRows, variant);
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
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(v) => v && setFormat(v as Format)}
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="csv" className="flex-1">
                CSV
              </ToggleGroupItem>
              <ToggleGroupItem value="xlsx" className="flex-1">
                XLSX
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field
            label="Columns"
            help={
              variant === "basic"
                ? "Core fields only"
                : "Every column from the source spreadsheet"
            }
          >
            <ToggleGroup
              type="single"
              value={variant}
              onValueChange={(v) => v && setVariant(v as Variant)}
              variant="outline"
              className="w-full"
            >
              <ToggleGroupItem value="basic" className="flex-1">
                Basic
              </ToggleGroupItem>
              <ToggleGroupItem value="extended" className="flex-1">
                Extended
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          {showRowsOption && (
            <Field label="Rows">
              <ToggleGroup
                type="single"
                value={rows}
                onValueChange={(v) => v && setRows(v as Rows)}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="filtered" className="flex-1">
                  Filtered ({filtered.length.toLocaleString()})
                </ToggleGroupItem>
                <ToggleGroupItem value="full" className="flex-1">
                  All ({data.length.toLocaleString()})
                </ToggleGroupItem>
              </ToggleGroup>
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
  children: React.ReactNode;
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
