import { useState, type ReactNode } from "react";
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
import { SelectIndicator } from "./SelectIndicator";
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
        <button
          type="button"
          className="border-rule bg-surface text-ink-2 hover:border-ink-3 relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors"
        >
          <span>{label}</span>
          {selected.size > 0 && (
            <span className="bg-ink text-bg inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
              {selected.size}
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M2 4l3 3 3-3"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
        </button>
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
                      <SelectIndicator active={isSelected} />
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
