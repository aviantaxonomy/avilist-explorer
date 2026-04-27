import { useEffect } from "react";
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

          {iucn && info && (
            <section className="mu-panel-section">
              <div className="mu-section-label">Conservation</div>
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

          <section className="mu-panel-section">
            <dl className="mu-refs">
              <dt>Avibase ID</dt>
              <dd className="mu-mono">
                {taxon.AvibaseID ?? <span className="mu-empty">—</span>}
              </dd>
              <dt>Authority</dt>
              <dd>
                {taxon.Authority ?? <span className="mu-empty">—</span>}
              </dd>
              <dt>Protonym</dt>
              <dd className="mu-sci">
                {taxon.Protonym ?? <span className="mu-empty">—</span>}
              </dd>
              <dt>Type locality</dt>
              <dd>
                {taxon.Type_locality ?? <span className="mu-empty">—</span>}
              </dd>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  );
}
