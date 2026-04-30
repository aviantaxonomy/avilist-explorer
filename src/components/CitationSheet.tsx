import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Version } from "@/lib/versions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: Version;
};

export function CitationSheet({ open, onOpenChange, version }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-surface text-ink font-sans flex flex-col gap-0 px-0 pt-0 pb-0 data-[side=right]:w-[560px] data-[side=right]:sm:max-w-[560px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-rule border-b px-6 py-5">
          <SheetTitle className="text-ink text-lg font-medium">
            Recommended Citation
          </SheetTitle>
          <p className="text-ink-3 text-xs">
            How to credit AviList {version.label} in your work.
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          <Section label="Citation" copyText={version.citation}>
            <p className="text-ink text-sm leading-relaxed">
              {version.citation}
            </p>
          </Section>

          <Section label="License" copyText={version.license}>
            <p className="text-ink-2 text-sm leading-relaxed">
              {version.license}
            </p>
          </Section>

          <Section label="AviList Core Team" copyText={version.contributors}>
            <p className="text-ink-2 text-sm leading-relaxed">
              {version.contributors}
            </p>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  label,
  copyText,
  children,
}: {
  label: string;
  copyText: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-ink-2 text-xs font-semibold uppercase tracking-[0.1em]">
          {label}
        </div>
        <CopyButton text={copyText} />
      </div>
      {children}
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail on insecure contexts; silently no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-ink-2 hover:text-ink inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
