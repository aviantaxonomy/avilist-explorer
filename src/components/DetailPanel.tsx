import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Species } from "@/lib/data";
import {
  baseIucnCode,
  iucnQualifier,
  IUCN_BAR_ORDER,
  IUCN_INFO,
} from "@/lib/iucn";
import {
  formatProposalNumber,
  parseProposalNumbers,
  type Version,
} from "@/lib/versions";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog as SheetPrimitive, VisuallyHidden } from "radix-ui";

type Props = {
  taxon: Species | null;
  version: Version;
  scrollTo?: string | null;
  onClose: () => void;
};

type Lineage = { rank: string; name: string };

const RANK_ORDER = ["order", "family", "genus", "species", "subspecies"];

const isItalicRank = (rank?: string) =>
  rank === "genus" || rank === "species" || rank === "subspecies";

function buildLineage(t: Species): Lineage[] {
  const rank = t.rank ?? "";
  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) return [];
  const out: Lineage[] = [];
  if (t.order && idx > 0) out.push({ rank: "order", name: t.order });
  if (t.family && idx > 1) out.push({ rank: "family", name: t.family });
  const parts = (t.sciName ?? "").split(/\s+/).filter(Boolean);
  if (parts[0] && idx > 2) out.push({ rank: "genus", name: parts[0] });
  if (parts.length >= 2 && idx > 3) {
    out.push({ rank: "species", name: parts.slice(0, 2).join(" ") });
  }
  return out;
}

function avibaseUrl(id?: string): string | null {
  if (!id) return null;
  const hash = id.replace(/^avibase-/i, "");
  return `https://avibase.bsc-eoc.org/species.jsp?avibaseid=${hash}`;
}

function ebirdUrl(code?: string): string | null {
  if (!code) return null;
  return `https://ebird.org/species/${code}`;
}

const SECTION_LABEL =
  "text-ink-2 mb-3 text-xs font-semibold uppercase tracking-[0.1em]";
const META_LABEL =
  "text-ink-3 text-[11px] font-semibold uppercase tracking-wider";

export function DetailPanel({ taxon, version, scrollTo, onClose }: Props) {
  // Hold onto the last non-null taxon so the close animation can still render
  // its content while Radix unmounts.
  const [displayed, setDisplayed] = useState<Species | null>(taxon);
  if (taxon && taxon !== displayed) setDisplayed(taxon);

  useEffect(() => {
    if (!scrollTo || !taxon) return;
    const el = document.getElementById(scrollTo);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [scrollTo, taxon]);

  if (!displayed) return null;

  const rank = displayed.rank ?? "species";
  const ancestry = buildLineage(displayed);
  const iucnRaw = displayed.iucn;
  const iucn = baseIucnCode(iucnRaw);
  const info = iucn ? IUCN_INFO[iucn] : undefined;
  const qualifier = iucnQualifier(iucnRaw);
  const iucnLabel =
    info && qualifier ? `${info.label} (${qualifier})` : info?.label;
  const english = displayed.name ?? displayed.nameClements ?? displayed.nameBirdLife;

  const altNames: { source: string; name: string }[] = [];
  if (displayed.nameClements && displayed.nameClements !== displayed.name) {
    altNames.push({
      source: `Clements ${version.clementsVersion}`,
      name: displayed.nameClements,
    });
  }
  if (displayed.nameBirdLife && displayed.nameBirdLife !== displayed.name) {
    altNames.push({
      source: `BirdLife ${version.birdLifeVersion}`,
      name: displayed.nameBirdLife,
    });
  }

  const hasOriginal =
    displayed.authority ||
    displayed.protonym ||
    displayed.citation ||
    displayed.originalDescriptionTitle ||
    displayed.typeLocality;

  const links: { label: string; href: string }[] = [];
  if (displayed.bowUrl)
    links.push({ label: "Birds of the World", href: displayed.bowUrl });
  if (rank === "species") {
    const ebirdHref = ebirdUrl(displayed.cornellCode);
    if (ebirdHref) links.push({ label: "eBird", href: ebirdHref });
  }
  if (displayed.birdLifeUrl)
    links.push({ label: "BirdLife DataZone", href: displayed.birdLifeUrl });
  const aviUrl = avibaseUrl(displayed.avibaseId);
  if (aviUrl) links.push({ label: "Avibase", href: aviUrl });

  const hasGenusDetails =
    rank === "genus" && (displayed.typeSpecies || displayed.genusGender);

  return (
    <Sheet open={!!taxon} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="bg-surface text-ink font-sans gap-0 overflow-y-auto px-5 pt-6 pb-9 sm:px-7 data-[side=right]:w-full data-[side=right]:sm:w-[540px] data-[side=right]:sm:max-w-[540px]"
      >
        <VisuallyHidden.Root>
          <SheetPrimitive.Title>
            {english ?? displayed.sciName}
          </SheetPrimitive.Title>
        </VisuallyHidden.Root>
        <div>
          <span
            className={`font-sans inline-block min-w-[70px] rounded-[2px] border px-2.5 py-[5px] text-center text-[11px] font-semibold uppercase tracking-[0.1em] rank-badge-${rank}`}
          >
            {rank}
          </span>
        </div>
        {english ? (
          <>
            <h2 className="mt-3.5 mb-1.5 text-[32px] font-medium leading-[1.1] tracking-[-0.01em]">
              {english}
            </h2>
            <div className="text-ink-2 mb-7 text-lg">
              <span
                className={`font-fraunces ${isItalicRank(rank) ? "italic" : ""}`}
              >
                {displayed.sciName}
              </span>
              {displayed.authority && (
                <span className="text-ink-3 ml-2 text-sm">
                  {displayed.authority}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="mt-3.5 mb-7">
            <h2
              className={`font-fraunces text-[36px] leading-[1.1] tracking-[-0.01em] ${isItalicRank(rank) ? "italic" : ""}`}
            >
              {displayed.sciName}
            </h2>
            {displayed.authority && (
              <div className="text-ink-3 mt-1 text-sm">{displayed.authority}</div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <section className="bg-bg rounded-xl px-5 py-4">
            <div className={SECTION_LABEL}>Lineage</div>
            <ol className="m-0 list-none p-0">
              {ancestry.map((a, i) => (
                <li
                  key={`${a.rank}-${i}`}
                  className="flex items-baseline gap-3 py-1.5"
                  style={{ paddingLeft: i * 16 }}
                >
                  <span className="text-ink-3 w-[70px] flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider">
                    {a.rank}
                  </span>
                  <span
                    className={`font-fraunces text-sm ${isItalicRank(a.rank) ? "italic" : ""}`}
                  >
                    {a.name}
                  </span>
                </li>
              ))}
              <li
                className="flex items-baseline gap-3 py-1.5"
                style={{ paddingLeft: ancestry.length * 16 }}
              >
                <span className="text-ink-3 w-[70px] flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider">
                  {rank}
                </span>
                <span
                  className={`font-fraunces text-accent-2 text-sm font-semibold ${isItalicRank(rank) ? "italic" : ""}`}
                >
                  {displayed.sciName}
                </span>
              </li>
            </ol>
          </section>

          {displayed.decisionSummary && (
            <section
              id="decision-summary"
              className="bg-bg rounded-xl px-5 py-4"
            >
              <div className={SECTION_LABEL}>
                Decision Summary
                {displayed.proposalNumber && (
                  <span className="text-ink-3 ml-2 font-mono text-[11px] tracking-normal normal-case">
                    {parseProposalNumbers(displayed.proposalNumber)
                      .map((n) => formatProposalNumber(version, n))
                      .join(", ")}
                  </span>
                )}
              </div>
              <div
                className="prose-museum text-ink text-sm leading-[1.6]"
                dangerouslySetInnerHTML={{ __html: displayed.decisionSummary }}
              />
            </section>
          )}

          {displayed.range && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>Range</div>
              <p className="text-ink m-0 text-sm leading-relaxed">
                {displayed.range}
              </p>
            </section>
          )}

          {iucn && info && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>Conservation Status</div>
              <div className="mb-3 flex gap-[3px]">
                {IUCN_BAR_ORDER.map((c) => {
                  const ci = IUCN_INFO[c];
                  const active = c === iucn;
                  return (
                    <div
                      key={c}
                      className={`font-mono flex-1 rounded py-2 text-center text-[11px] font-semibold transition-opacity ${active ? "scale-[1.08] opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "opacity-40"}`}
                      style={{ background: ci.bg, color: ci.fg }}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>
              <div className="font-fraunces text-ink flex items-center gap-2.5 text-lg font-medium italic">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-[rgba(0,0,0,0.1)]"
                  style={{ background: info.bg }}
                />
                {iucnLabel}
              </div>
              <div className="text-ink-3 mt-1 text-xs">IUCN Red List</div>
            </section>
          )}

          {altNames.length > 0 && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>Other names</div>
              <dl className="m-0 flex flex-col gap-2">
                {altNames.map((n) => (
                  <div
                    key={n.source}
                    className="grid grid-cols-[110px_1fr] items-baseline gap-4"
                  >
                    <dt className={`m-0 ${META_LABEL}`}>{n.source}</dt>
                    <dd className="text-ink m-0 text-sm">{n.name}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {hasGenusDetails && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>Genus</div>
              <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-4 gap-y-2">
                {displayed.typeSpecies && (
                  <>
                    <dt className={`m-0 pt-0.5 ${META_LABEL}`}>Type species</dt>
                    <dd className="font-fraunces text-ink m-0 text-sm italic">
                      {displayed.typeSpecies}
                    </dd>
                  </>
                )}
                {displayed.genusGender && (
                  <>
                    <dt className={`m-0 pt-0.5 ${META_LABEL}`}>Gender</dt>
                    <dd className="text-ink m-0 text-sm">
                      {displayed.genusGender}
                    </dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {hasOriginal && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>First described as</div>

              {(displayed.protonym || displayed.authority) && (
                <div className="mb-4">
                  {displayed.protonym && (
                    <div
                      className={`font-fraunces text-ink text-lg leading-tight ${isItalicRank(rank) ? "italic" : ""}`}
                    >
                      {displayed.protonym}
                    </div>
                  )}
                  {displayed.authority && (
                    <div className="text-ink-3 mt-1 text-xs">
                      {/* Brackets only apply to names AFTER the protonym
                          (combinatio nova) — never to the original. */}
                      {displayed.authority.replace(/^\((.*)\)$/, "$1")}
                    </div>
                  )}
                </div>
              )}

              {(displayed.originalDescriptionTitle || displayed.citation) && (
                <div className="mb-3.5">
                  {displayed.originalDescriptionTitle && (
                    <div className="text-ink text-sm leading-snug">
                      {displayed.originalDescriptionUrl ? (
                        <a
                          href={displayed.originalDescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink border-rule hover:border-ink inline border-b no-underline"
                        >
                          {displayed.originalDescriptionTitle}
                          <ExternalLink className="text-ink-3 ml-1 inline-block h-3 w-3 align-[-2px]" />
                        </a>
                      ) : (
                        displayed.originalDescriptionTitle
                      )}
                    </div>
                  )}
                  {displayed.citation && (
                    <div className="text-ink-2 mt-1.5 text-xs leading-relaxed">
                      {!displayed.originalDescriptionTitle &&
                      displayed.originalDescriptionUrl ? (
                        <a
                          href={displayed.originalDescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink-2 border-rule hover:border-ink-2 border-b no-underline"
                        >
                          {displayed.citation}
                          <ExternalLink className="text-ink-3 ml-1 inline-block h-3 w-3 align-[-2px]" />
                        </a>
                      ) : (
                        displayed.citation
                      )}
                    </div>
                  )}
                </div>
              )}

              {displayed.typeLocality && (
                <p className="text-ink-2 m-0 text-xs leading-relaxed">
                  <span className={`mr-1 ${META_LABEL}`}>
                    Type specimen(s) from:
                  </span>
                  {displayed.typeLocality}
                </p>
              )}
            </section>
          )}


          {links.length > 0 && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>External resources</div>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:bg-surface -mx-2.5 flex items-center justify-between rounded px-2.5 py-2 text-sm no-underline"
                    >
                      <span>{l.label}</span>
                      <ExternalLink className="text-ink-3 h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
