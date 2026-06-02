import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SelectIndicator } from "./SelectIndicator";
import type { Locale } from "@/lib/ebird";

const DEFAULT_LABEL = "English (AviList)";

type Props = {
  locales: Locale[] | null;
  current: string | null;
  loading: boolean;
  disabled?: boolean;
  onChange: (code: string | null) => void;
};

export function LocalePicker({ locales, current, loading, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = current ? locales?.find((l) => l.code === current) : null;
  const label = selected ? selected.name : DEFAULT_LABEL;
  const isDisabled = disabled || !locales;
  // cmdk highlights and scrolls to the item whose value matches this.
  const activeValue = selected ? `${selected.name} ${selected.code}` : DEFAULT_LABEL;

  // cmdk scrolls with block:"nearest"; re-center the active item on open.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !current) return;
    const raf = requestAnimationFrame(() => {
      contentRef.current
        ?.querySelector('[cmdk-item=""][aria-selected="true"]')
        ?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, current]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          className="border-rule bg-surface text-ink hover:border-ink-3 inline-flex h-9 max-w-[220px] cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="size-3.5 shrink-0 animate-spin" />}
          <span className="truncate">{label}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true"
            className="text-ink-3 shrink-0"
          >
            <path
              d="M2 4l3 3 3-3"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} className="w-72 p-0" align="start">
        <Command defaultValue={activeValue}>
          <CommandInput placeholder="Search languages…" />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={DEFAULT_LABEL}
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <SelectIndicator active={!current} shape="round" />
                <span>{DEFAULT_LABEL}</span>
              </CommandItem>
              {locales?.map((l) => (
                <CommandItem
                  key={l.code}
                  value={`${l.name} ${l.code}`}
                  onSelect={() => {
                    onChange(l.code);
                    setOpen(false);
                  }}
                >
                  <SelectIndicator active={l.code === current} shape="round" />
                  <span className="truncate">{l.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
