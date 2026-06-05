import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommonNamesSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-surface text-ink font-sans flex flex-col gap-0 px-0 pt-0 pb-0 data-[side=right]:w-full data-[side=right]:sm:w-[560px] data-[side=right]:sm:max-w-[560px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-rule border-b px-6 py-5">
          <SheetTitle className="text-ink text-lg font-medium">
            Common Names
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-2">
          <p>
            <strong className="text-ink font-medium">English (AviList)</strong>{" "}
            is the primary common name for AviList; the AviList English Names
            Committee will govern these names starting in v2026 (for v2025 these
            were largely inherited from IOC).
          </p>
          <p>
            A menu at top left allows you to select your preferred common names,
            including more than a dozen versions of English and 70+ non-English
            languages (with additional regional versions). These alternate
            common names{" "}
            <a
              href="https://support.ebird.org/en/support/solutions/articles/48000804865-bird-names-in-ebird"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-ink-2"
            >
              are those used by eBird
            </a>{" "}
            and can be displayed (and downloaded) alongside the AviList English
            name.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
