import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import type { Species } from "@/lib/data";
import { IUCN_BAR_ORDER, IUCN_INFO, type IucnCode } from "@/lib/iucn";

type Props = {
  taxon: Species;
  onClose: () => void;
};

type Lineage = { rank: string; name: string };

const RANK_ORDER = ["order", "family", "genus", "species", "subspecies"];

function buildLineage(t: Species): Lineage[] {
  const rank = t.Taxon_rank ?? "";
  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) return [];
  const out: Lineage[] = [];
  if (t.Order && idx > 0) out.push({ rank: "order", name: t.Order });
  if (t.Family && idx > 1) out.push({ rank: "family", name: t.Family });
  const parts = (t.Scientific_name ?? "").split(/\s+/).filter(Boolean);
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

export function DetailPanel({ taxon, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rank = taxon.Taxon_rank ?? "species";
  const ancestry = buildLineage(taxon);
  const iucn = taxon.IUCN_Red_List_Category as IucnCode | undefined;
  const info = iucn ? IUCN_INFO[iucn] : undefined;
  const english =
    taxon.English_name_AviList ??
    taxon.English_name_Clements_v2024 ??
    taxon.English_name_BirdLife_v9;

  const altNames: { source: string; name: string }[] = [];
  if (
    taxon.English_name_Clements_v2024 &&
    taxon.English_name_Clements_v2024 !== taxon.English_name_AviList
  ) {
    altNames.push({
      source: "Clements 2024",
      name: taxon.English_name_Clements_v2024,
    });
  }
  if (
    taxon.English_name_BirdLife_v9 &&
    taxon.English_name_BirdLife_v9 !== taxon.English_name_AviList
  ) {
    altNames.push({
      source: "BirdLife v9",
      name: taxon.English_name_BirdLife_v9,
    });
  }

  const hasOriginal =
    taxon.Authority ||
    taxon.Protonym ||
    taxon.Bibliographic_details ||
    taxon.Title_of_original_description ||
    taxon.Type_locality;

  const links: { label: string; href: string }[] = [];
  if (taxon.Birds_of_the_World_URL)
    links.push({
      label: "Birds of the World",
      href: taxon.Birds_of_the_World_URL,
    });
  if (taxon.BirdLife_DataZone_URL)
    links.push({
      label: "BirdLife DataZone",
      href: taxon.BirdLife_DataZone_URL,
    });
  const aviUrl = avibaseUrl(taxon.AvibaseID);
  if (aviUrl) links.push({ label: "AviBase", href: aviUrl });

  const hasGenusDetails =
    rank === "genus" &&
    (taxon.Type_species_of_genus || taxon.Gender_of_genus);

  return (
    <div className="mu-panel-backdrop" onClick={onClose}>
      <aside className="mu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mu-panel-head">
          <span
            className={`mu-rank-badge mu-rank-badge-${rank} mu-rank-badge-detail`}
          >
            {rank}
          </span>
          <button className="mu-close" onClick={onClose} aria-label="Close">
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
            <h2 className="mu-panel-en-heading">{english}</h2>
            <div className="mu-panel-sci-secondary">
              {taxon.Scientific_name}
            </div>
          </>
        ) : (
          <h2 className="mu-panel-sci">{taxon.Scientific_name}</h2>
        )}

        <div className="mu-panel-grid">
          <section className="mu-panel-section">
            <div className="mu-section-label">Lineage</div>
            <ol className="mu-anc">
              {ancestry.map((a, i) => (
                <li key={`${a.rank}-${i}`} style={{ paddingLeft: i * 16 }}>
                  <span className="mu-anc-rank">{a.rank}</span>
                  <span className="mu-anc-name">{a.name}</span>
                </li>
              ))}
              <li
                className="is-current"
                style={{ paddingLeft: ancestry.length * 16 }}
              >
                <span className="mu-anc-rank">{rank}</span>
                <span className="mu-anc-name">{taxon.Scientific_name}</span>
              </li>
            </ol>
          </section>

          {taxon.Range && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Range</div>
              <p className="mu-range">{taxon.Range}</p>
            </section>
          )}

          {iucn && info && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Conservation Status</div>
              <div className="mu-cons-bar">
                {IUCN_BAR_ORDER.map((c) => {
                  const ci = IUCN_INFO[c];
                  return (
                    <div
                      key={c}
                      className={`mu-cons-step ${c === iucn ? "is-current" : ""}`}
                      style={{ background: ci.bg, color: ci.fg }}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>
              <div className="mu-cons-label">
                <span className="mu-cons-dot" style={{ background: info.bg }} />
                {info.label}
              </div>
              <div className="mu-cons-meta">
                IUCN Red List · {iucn} ({info.label})
              </div>
            </section>
          )}

          {altNames.length > 0 && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Other names</div>
              <dl className="mu-alt-names">
                {altNames.map((n) => (
                  <div key={n.source} className="mu-alt-row">
                    <dt>{n.source}</dt>
                    <dd>{n.name}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {hasGenusDetails && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Genus</div>
              <dl className="mu-refs">
                {taxon.Type_species_of_genus && (
                  <>
                    <dt>Type species</dt>
                    <dd className="mu-sci">{taxon.Type_species_of_genus}</dd>
                  </>
                )}
                {taxon.Gender_of_genus && (
                  <>
                    <dt>Gender</dt>
                    <dd>{taxon.Gender_of_genus}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {hasOriginal && (
            <section className="mu-panel-section">
              <div className="mu-section-label">First described</div>

              {(taxon.Protonym || taxon.Authority) && (
                <div className="mu-orig-head">
                  {taxon.Protonym && (
                    <div className="mu-orig-protonym">{taxon.Protonym}</div>
                  )}
                  {taxon.Authority && (
                    <div className="mu-orig-authority">{taxon.Authority}</div>
                  )}
                </div>
              )}

              {(taxon.Title_of_original_description ||
                taxon.Bibliographic_details) && (
                <div className="mu-orig-pub">
                  {taxon.Title_of_original_description && (
                    <div className="mu-orig-title">
                      {taxon.Original_description_URL ? (
                        <a
                          href={taxon.Original_description_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {taxon.Title_of_original_description}
                          <ExternalLink className="mu-link-icon" />
                        </a>
                      ) : (
                        taxon.Title_of_original_description
                      )}
                    </div>
                  )}
                  {taxon.Bibliographic_details && (
                    <div className="mu-orig-cite">
                      {!taxon.Title_of_original_description &&
                      taxon.Original_description_URL ? (
                        <a
                          href={taxon.Original_description_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {taxon.Bibliographic_details}
                          <ExternalLink className="mu-link-icon" />
                        </a>
                      ) : (
                        taxon.Bibliographic_details
                      )}
                    </div>
                  )}
                </div>
              )}

              {taxon.Type_locality && (
                <p className="mu-orig-typeloc">
                  <span className="mu-orig-typeloc-label">Specimen from:</span>{" "}
                  {taxon.Type_locality}
                </p>
              )}
            </section>
          )}

          {taxon.Decision_summary && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Taxonomic notes</div>
              <div
                className="mu-prose"
                dangerouslySetInnerHTML={{ __html: taxon.Decision_summary }}
              />
            </section>
          )}

          {links.length > 0 && (
            <section className="mu-panel-section">
              <div className="mu-section-label">External resources</div>
              <ul className="mu-resources">
                {links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      <span>{l.label}</span>
                      <ExternalLink className="mu-link-icon" />
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
