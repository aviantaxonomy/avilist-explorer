import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  formatLabel?: (value: string) => ReactNode;
  getKeywords?: (value: string) => string[];
  popoverWidth?: string;
};

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  formatLabel = (v) => v,
  getKeywords,
  popoverWidth = "w-72",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const q = search.trim().toLowerCase();
  const filtered = !q
    ? options
    : options.filter((opt) => {
        if (opt.toLowerCase().includes(q)) return true;
        const keywords = getKeywords?.(opt);
        return keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
      });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-between gap-2"
        >
          <span className="font-medium">{label}</span>
          {selected.size > 0 && (
            <Badge
              variant="secondary"
              className="rounded-sm px-1.5 font-normal"
            >
              {selected.size}
            </Badge>
          )}
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(popoverWidth, "p-0")} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${label.toLowerCase()}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>No matches.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((opt) => {
                  const isSelected = selected.has(opt);
                  return (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => toggle(opt)}
                    >
                      <div
                        className={cn(
                          "border-primary mr-2 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-60",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <span className="truncate">{formatLabel(opt)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          {selected.size > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onChange(new Set());
                    setOpen(false);
                  }}
                  className="justify-center text-center"
                >
                  Clear ({selected.size})
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
