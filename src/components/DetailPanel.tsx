import { useEffect } from "react";
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

type Props = {
  taxon: Species;
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

const SECTION_LABEL =
  "text-ink-2 mb-3 text-xs font-semibold uppercase tracking-[0.1em]";
const META_LABEL =
  "text-ink-3 text-[11px] font-semibold uppercase tracking-wider";

export function DetailPanel({ taxon, version, scrollTo, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!scrollTo) return;
    // The panel mounts fresh per selection, so the section is already in the
    // DOM by the time this effect runs.
    const el = document.getElementById(scrollTo);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [scrollTo, taxon]);

  const rank = taxon.rank ?? "species";
  const ancestry = buildLineage(taxon);
  const iucnRaw = taxon.iucn;
  const iucn = baseIucnCode(iucnRaw);
  const info = iucn ? IUCN_INFO[iucn] : undefined;
  const qualifier = iucnQualifier(iucnRaw);
  const iucnLabel =
    info && qualifier ? `${info.label} (${qualifier})` : info?.label;
  const english = taxon.name ?? taxon.nameClements ?? taxon.nameBirdLife;

  const altNames: { source: string; name: string }[] = [];
  if (taxon.nameClements && taxon.nameClements !== taxon.name) {
    altNames.push({
      source: `Clements ${version.clementsVersion}`,
      name: taxon.nameClements,
    });
  }
  if (taxon.nameBirdLife && taxon.nameBirdLife !== taxon.name) {
    altNames.push({
      source: `BirdLife ${version.birdLifeVersion}`,
      name: taxon.nameBirdLife,
    });
  }

  const hasOriginal =
    taxon.authority ||
    taxon.protonym ||
    taxon.citation ||
    taxon.originalDescriptionTitle ||
    taxon.typeLocality;

  const links: { label: string; href: string }[] = [];
  if (taxon.bowUrl)
    links.push({ label: "Birds of the World", href: taxon.bowUrl });
  if (taxon.birdLifeUrl)
    links.push({ label: "BirdLife DataZone", href: taxon.birdLifeUrl });
  const aviUrl = avibaseUrl(taxon.avibaseId);
  if (aviUrl) links.push({ label: "Avibase", href: aviUrl });

  const hasGenusDetails =
    rank === "genus" && (taxon.typeSpecies || taxon.genusGender);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(14,14,12,0.3)]"
      onClick={onClose}
    >
      <aside
        className="bg-surface text-ink font-sans h-full w-[480px] overflow-y-auto px-7 pt-6 pb-9 shadow-[-10px_0_40px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span
            className={`font-sans inline-block min-w-[70px] rounded-[2px] border px-2.5 py-[5px] text-center text-[11px] font-semibold uppercase tracking-[0.1em] rank-badge-${rank}`}
          >
            {rank}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-bg text-ink-2 hover:bg-rule grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
        {english ? (
          <>
            <h2 className="mt-3.5 mb-1.5 text-[32px] font-medium leading-[1.1] tracking-[-0.01em]">
              {english}
            </h2>
            <div
              className={`font-fraunces text-ink-2 mb-7 text-lg ${isItalicRank(rank) ? "italic" : ""}`}
            >
              {taxon.sciName}
            </div>
          </>
        ) : (
          <h2
            className={`font-fraunces mt-3.5 mb-7 text-[36px] leading-[1.1] tracking-[-0.01em] ${isItalicRank(rank) ? "italic" : ""}`}
          >
            {taxon.sciName}
          </h2>
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
                  {taxon.sciName}
                </span>
              </li>
            </ol>
          </section>

          {taxon.decisionSummary && (
            <section
              id="decision-summary"
              className="bg-bg rounded-xl px-5 py-4"
            >
              <div className={SECTION_LABEL}>
                Decision Summary
                {taxon.proposalNumber && (
                  <span className="text-ink-3 ml-2 font-mono text-[11px] tracking-normal normal-case">
                    {parseProposalNumbers(taxon.proposalNumber)
                      .map((n) => formatProposalNumber(version, n))
                      .join(", ")}
                  </span>
                )}
              </div>
              <div
                className="prose-museum text-ink text-sm leading-[1.6]"
                dangerouslySetInnerHTML={{ __html: taxon.decisionSummary }}
              />
            </section>
          )}

          {taxon.range && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>Range</div>
              <p className="text-ink m-0 text-sm leading-relaxed">
                {taxon.range}
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
                {taxon.typeSpecies && (
                  <>
                    <dt className={`m-0 pt-0.5 ${META_LABEL}`}>Type species</dt>
                    <dd className="font-fraunces text-ink m-0 text-sm italic">
                      {taxon.typeSpecies}
                    </dd>
                  </>
                )}
                {taxon.genusGender && (
                  <>
                    <dt className={`m-0 pt-0.5 ${META_LABEL}`}>Gender</dt>
                    <dd className="text-ink m-0 text-sm">
                      {taxon.genusGender}
                    </dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {hasOriginal && (
            <section className="bg-bg rounded-xl px-5 py-4">
              <div className={SECTION_LABEL}>First described</div>

              {(taxon.protonym || taxon.authority) && (
                <div className="mb-4">
                  {taxon.protonym && (
                    <div
                      className={`font-fraunces text-ink text-lg leading-tight ${isItalicRank(rank) ? "italic" : ""}`}
                    >
                      {taxon.protonym}
                    </div>
                  )}
                  {taxon.authority && (
                    <div className="text-ink-3 mt-1 text-xs">
                      {taxon.authority}
                    </div>
                  )}
                </div>
              )}

              {(taxon.originalDescriptionTitle || taxon.citation) && (
                <div className="mb-3.5">
                  {taxon.originalDescriptionTitle && (
                    <div className="text-ink text-sm leading-snug">
                      {taxon.originalDescriptionUrl ? (
                        <a
                          href={taxon.originalDescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink border-rule hover:border-ink inline border-b no-underline"
                        >
                          {taxon.originalDescriptionTitle}
                          <ExternalLink className="text-ink-3 ml-1 inline-block h-3 w-3 align-[-2px]" />
                        </a>
                      ) : (
                        taxon.originalDescriptionTitle
                      )}
                    </div>
                  )}
                  {taxon.citation && (
                    <div className="text-ink-2 mt-1.5 text-xs leading-relaxed">
                      {!taxon.originalDescriptionTitle &&
                      taxon.originalDescriptionUrl ? (
                        <a
                          href={taxon.originalDescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink-2 border-rule hover:border-ink-2 border-b no-underline"
                        >
                          {taxon.citation}
                          <ExternalLink className="text-ink-3 ml-1 inline-block h-3 w-3 align-[-2px]" />
                        </a>
                      ) : (
                        taxon.citation
                      )}
                    </div>
                  )}
                </div>
              )}

              {taxon.typeLocality && (
                <p className="text-ink-2 m-0 text-xs leading-relaxed">
                  <span className={`mr-1 ${META_LABEL}`}>Specimen from:</span>
                  {taxon.typeLocality}
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
      </aside>
    </div>
  );
}
