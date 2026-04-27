import { useState } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SelectIndicator } from "./SelectIndicator";
import type { Edition } from "@/lib/editions";

type Props = {
  editions: Edition[];
  current: string;
  onChange: (id: string) => void;
};

export function EditionPicker({ editions, current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const currentEdition = editions.find((e) => e.id === current);
  const label = currentEdition?.label ?? current;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-rule bg-surface font-fraunces text-ink hover:border-ink-3 inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium"
        >
          {label}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true"
            className="text-ink-3"
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
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {editions.map((e) => {
                const active = e.id === current;
                return (
                  <CommandItem
                    key={e.id}
                    value={e.id}
                    onSelect={() => {
                      onChange(e.id);
                      setOpen(false);
                    }}
                  >
                    <SelectIndicator active={active} shape="round" />
                    <span>{e.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
