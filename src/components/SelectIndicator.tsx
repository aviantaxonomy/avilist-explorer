import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  shape?: "square" | "round";
};

export function SelectIndicator({ active, shape = "square" }: Props) {
  return (
    <div
      className={cn(
        "border-primary mr-2 flex size-4 shrink-0 items-center justify-center border",
        shape === "round" ? "rounded-full" : "rounded-sm",
        active ? "bg-primary text-primary-foreground" : "opacity-60",
      )}
    >
      {active && <Check className="size-3" />}
    </div>
  );
}
