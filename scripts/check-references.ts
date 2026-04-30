import { readFile } from "node:fs/promises";

import { COLUMNS } from "../src/columns.ts";

const VERSIONS_FILE = "public/versions.json";
const VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");

type Version = { id: string; label: string };
type Manifest = { versions: Version[] };
type Reference = { short: string; full: string; url?: string; doi?: string };

// Common English / Latin words that begin a sentence with a capital letter
// and would otherwise be mistaken for an author surname before a year.
const TRAP_WORDS = new Set([
  "A", "An", "The", "In", "On", "At", "By", "For", "From", "Of", "To", "With",
  "However", "Although", "Though", "Whereas", "Recently", "Recent", "Currently",
  "Now", "Today", "Yesterday", "When", "While", "After", "Before", "During",
  "Since", "Until", "Until", "Despite", "Both", "Either", "Neither", "All",
  "Most", "Many", "Some", "Few", "Several", "Much", "More", "Each", "Every",
  "Other", "Another", "Such", "This", "That", "These", "Those",
  "Opinion", "Case", "Article", "Code", "Section", "Chapter", "Volume", "No",
  "Decision", "Resolution", "Order", "Family", "Genus", "Species", "Subspecies",
]);

// Author token. Components:
//   • Optional contraction prefix: a lowercase letter + apostrophe glued onto
//     the surname (d'Horta, O'Brien — though O'Brien also works without it).
//   • Mandatory uppercase letter followed by letters/marks.
//   • Optional internal hyphen/apostrophe segments (Sosa-López, Rodríguez-Gómez).
const NAME = String.raw`(?:[a-z]['’])?[\p{Lu}][\p{L}\p{M}]*(?:[\-'’][\p{L}\p{M}]+)*`;
// Lowercase particles allowed before a name (van, de, del, …). Chained
// particles like "van der" are supported by the `*` quantifier on AUTHOR.
const PARTICLE = String.raw`(?:de|del|della|den|der|du|la|le|van|von|zu|da|dos|das|do)`;
const AUTHOR = String.raw`(?:${PARTICLE}\s+)*${NAME}(?:\s+${NAME})*`;
// Year: 4-digit, 1700–2030, optional letter suffix (e.g. "2003a").
const YEAR = String.raw`(?:1[7-9]\d{2}|20[0-2]\d|2030)[a-z]?`;
// Full citation match. Use Unicode-aware lookarounds instead of \b.
//
// Three flavors are accepted between the first author and the year:
//   • "Smith YEAR"
//   • "Smith & Jones YEAR" / "Smith and Jones YEAR"
//   • "Smith et al. YEAR" — note that "et al." is NOT followed by another
//     author, unlike the conjunction case.
const CITE_RE = new RegExp(
  String.raw`(?<![\p{L}\p{M}])` +
    `(${AUTHOR})` +
    String.raw`(?:\s+et\s+al\.|\s+(?:&|and)\s+(${AUTHOR}))?` +
    String.raw`\s+(${YEAR})` +
    String.raw`(?![\p{L}\p{M}])`,
  "gu",
);

/**
 * Normalize for matching: NFC, then unify various punctuation that the data
 * uses inconsistently. Decisions made here:
 *   - Curly/modifier apostrophes → straight ('). Decision summaries and the
 *     References sheet disagree on which form to use.
 *   - All Unicode hyphens / non-breaking hyphens / minus → ASCII hyphen-minus.
 *   - " and " between authors → " & " (the bibliography canonicalizes on `&`).
 *   - Collapse whitespace and remove the optional space after a particle so
 *     "da Silva" matches "daSilva" (bibliography uses both forms).
 */
function normalize(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[‐-―−⁃﹣－]/g, "-")
    .replace(/\s+and\s+/g, " & ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Variant of `normalize` that further collapses optional whitespace inside
 * particle-prefixed surnames ("da Silva" ↔ "daSilva"). Used as a fallback when
 * the strict normalized form misses.
 */
function looseNormalize(s: string): string {
  return normalize(s).replace(
    /\b(de|del|della|den|der|du|la|le|van|von|zu|da|dos|das|do)\s+(\p{Lu})/giu,
    (_m, particle, letter) => particle + letter,
  );
}

/** Strip combining marks for diacritic-insensitive matching. */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}+/gu, "");
}

function deburrNormalize(s: string): string {
  return stripDiacritics(normalize(s)).toLowerCase();
}

/**
 * Classify the citation form: "solo" = "Smith 2020", "etal" = "Smith et al.
 * 2020", "amp" = "Smith & Jones 2020". Used to avoid fuzzy-matching across
 * different citation shapes (e.g. "Scott et al. 2022" should never resolve
 * to a single-author "Scott 2022").
 */
function citationShape(norm: string): "solo" | "etal" | "amp" {
  if (/\bet al\.\s+\d{4}/.test(norm)) return "etal";
  if (/\s(?:&|and)\s/.test(norm)) return "amp";
  return "solo";
}

/**
 * Pull the leading-author surname out of a normalized citation, peeling off
 * trailing year, "et al.", and "& Other Author" so we have the actual
 * surname rather than fragments like "al." or "Jones".
 */
function leadingSurname(norm: string): string {
  const stripped = norm
    .replace(/\s+\d{4}[a-z]?$/, "")
    .replace(/\s+et\s+al\.$/, "")
    .replace(/\s+(?:&|and)\s+.+$/, "")
    .trim();
  if (!stripped) return "";
  return stripped.split(/\s+/).pop() ?? "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isLikelyFalsePositive(firstToken: string): boolean {
  // The first token is the first capitalized word of the matched span. If
  // it's a common English word, the match is almost certainly a sentence
  // start, not a real citation.
  return TRAP_WORDS.has(firstToken);
}

async function loadJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

type CitationHit = {
  raw: string;            // the full matched span as it appears in text
  normalized: string;     // normalized form for lookup
  taxon: string;          // "rank sciName" of the species this came from
  context: string;        // ±40 char window around the match
};

type UnknownCategory =
  | "false_positive"
  | "regex_clipped"
  | "ambiguous_year"
  | "typo_or_variant"
  | "missing";

type CategorizedUnknown = {
  normalized: string;
  raw: string;
  category: UnknownCategory;
  occurrences: number;
  example: { taxon: string; context: string };
  closestKnown?: string;
};

async function main() {
  const manifest = JSON.parse(await readFile(VERSIONS_FILE, "utf8")) as Manifest;

  for (const v of manifest.versions) {
    console.log(`\n=== ${v.id} (${v.label}) ===`);
    await checkVersion(v);
  }
}

async function checkVersion(version: Version): Promise<void> {
  const speciesPath = `public/data/avilist-${version.id}.json`;
  const refsPath = `public/data/avilist-${version.id}-references.json`;

  const compact = await loadJson<(string | null)[][]>(speciesPath);
  const refs = await loadJson<Reference[]>(refsPath);

  const decisionIdx = COLUMNS.indexOf("decisionSummary");
  const rankIdx = COLUMNS.indexOf("rank");
  const sciIdx = COLUMNS.indexOf("sciName");

  // Build the lookup indexes. Multiple keys per reference handle the various
  // ways a citation in the wild can deviate from the canonical short form.
  const refByNormalized = new Map<string, Reference>();
  const refByLoose = new Map<string, Reference>();
  const refByDeburr = new Map<string, Reference>();
  // Without the year suffix letter — "Smith et al. 2023a" → "Smith et al. 2023".
  // Stores all matching refs; if there's exactly one, we can resolve a bare
  // "Smith et al. 2023" to it. If there are several (a, b, …) we don't.
  const refsByYearStem = new Map<string, Reference[]>();
  const refsByConnectiveSuffix = new Map<string, Reference[]>();
  for (const r of refs) {
    const n = normalize(r.short);
    refByNormalized.set(n, r);
    refByLoose.set(looseNormalize(r.short), r);
    refByDeburr.set(deburrNormalize(r.short), r);

    const stem = n.replace(/(\d{4})[a-z]$/, "$1");
    if (stem !== n) {
      let bucket = refsByYearStem.get(stem);
      if (!bucket) refsByYearStem.set(stem, (bucket = []));
      bucket.push(r);
    }

    // Capture suffix following "& " or "al. " — that's the canonical cutoff
    // a clipped regex would land on.
    const m = n.match(/(?:&|al\.)\s+(.+\s+\d{4}[a-z]?)$/);
    if (m) {
      const sfx = m[1];
      let bucket = refsByConnectiveSuffix.get(sfx);
      if (!bucket) refsByConnectiveSuffix.set(sfx, (bucket = []));
      bucket.push(r);
    }
  }

  // Walk every decision summary, collecting hits.
  let totalSummaries = 0;
  let totalMatches = 0;
  const knownHits = new Map<string, number>(); // ref.short → occurrence count
  const unknownHits = new Map<string, CitationHit[]>();

  for (const row of compact) {
    const html = row[decisionIdx];
    if (!html) continue;
    totalSummaries++;
    const text = stripHtml(html);
    const taxon = `${row[rankIdx] ?? "?"} ${row[sciIdx] ?? "?"}`;

    for (const m of text.matchAll(CITE_RE)) {
      totalMatches++;
      const raw = m[0];
      const norm = normalize(raw);
      const loose = looseNormalize(raw);
      const deburr = deburrNormalize(raw);
      // Resolution attempts, in order of strictness. The deburr fallback only
      // kicks in for refs that lack diacritic-only siblings.
      let ref =
        refByNormalized.get(norm) ??
        refByLoose.get(loose) ??
        refByDeburr.get(deburr);

      // Year-suffix tolerance: a summary writing "Smith et al. 2023" should
      // match a sole bibliography entry "Smith et al. 2023a", but only if
      // there's no ambiguity (no 2023b/c/… alongside it).
      if (!ref) {
        const stemBucket = refsByYearStem.get(norm);
        if (stemBucket && stemBucket.length === 1) ref = stemBucket[0];
      }

      if (ref) {
        knownHits.set(ref.short, (knownHits.get(ref.short) ?? 0) + 1);
      } else {
        const start = Math.max(0, m.index! - 40);
        const end = Math.min(text.length, m.index! + raw.length + 40);
        const context = text.slice(start, end).replace(/\s+/g, " ");
        let bucket = unknownHits.get(norm);
        if (!bucket) unknownHits.set(norm, (bucket = []));
        bucket.push({ raw, normalized: norm, taxon, context });
      }
    }
  }

  // Categorize unknowns.
  const categorized: CategorizedUnknown[] = [];
  for (const [norm, hits] of unknownHits) {
    const sample = hits[0];
    const firstToken = sample.raw.split(/\s+/)[0];
    let category: UnknownCategory;
    let closestKnown: string | undefined;

    if (isLikelyFalsePositive(firstToken)) {
      category = "false_positive";
    } else if (refsByConnectiveSuffix.get(norm)?.length) {
      // Regex-clipped: the unknown matches the tail of a multi-author ref,
      // following "&" or "et al.". Covers cases where a Unicode word boundary
      // failed and we captured only the trailing author.
      const cand = refsByConnectiveSuffix
        .get(norm)!
        .find((r) => normalize(r.short) !== norm);
      category = "regex_clipped";
      closestKnown = cand?.short;
    } else if ((refsByYearStem.get(norm)?.length ?? 0) >= 2) {
      // Ambiguous year suffix: bibliography has 2023a AND 2023b, but the
      // summary writes a bare 2023.
      category = "ambiguous_year";
      closestKnown = refsByYearStem
        .get(norm)!
        .map((r) => r.short)
        .join(" / ");
    } else {
      let nearMatch: Reference | undefined;
      // Suffix match first: the bibliography entry ends with the unknown
      // after a space — e.g. "Ó Marcaigh et al. 2023" ends with " Marcaigh
      // et al. 2023". Catches dropped leading particles ("Earl of Cranbrook"
      // → "Cranbrook", "Marques Almeida" → "Almeida") cleanly without fuzzy
      // matching.
      for (const r of refs) {
        const rn = normalize(r.short);
        if (rn === norm) continue;
        if (rn.endsWith(" " + norm)) {
          nearMatch = r;
          break;
        }
      }
      // Fuzzy/typo match second: same year + same citation shape + nearly
      // identical surname (edit distance ≤ 2). Citation shape comparison
      // prevents nonsense pairings like "Scott et al. 2022" → "Scott 2022".
      // Edit distance 2 catches typos like Ferriera↔Ferreira; in exchange
      // we tolerate a small chance of coincidental matches (e.g. Zhao↔Zhang)
      // which the reviewer can dismiss.
      if (!nearMatch) {
        const surname = leadingSurname(norm);
        const yearMatch = norm.match(/(\d{4}[a-z]?)$/);
        const year = yearMatch?.[1];
        const shape = citationShape(norm);
        if (year && surname.length >= 4) {
          const surnameLc = stripDiacritics(surname).toLowerCase();
          const surnameStart = surnameLc.slice(0, 3);
          for (const r of refs) {
            const rn = normalize(r.short);
            if (!rn.endsWith(year)) continue;
            if (citationShape(rn) !== shape) continue;
            const rSurnameLc = stripDiacritics(
              leadingSurname(rn),
            ).toLowerCase();
            if (!rSurnameLc) continue;
            if (rSurnameLc === surnameLc) {
              nearMatch = r;
              break;
            }
            if (
              rSurnameLc.startsWith(surnameStart) &&
              editDistance(rSurnameLc, surnameLc) <= 1
            ) {
              nearMatch = r;
              break;
            }
          }
        }
      }
      if (nearMatch) {
        category = "typo_or_variant";
        closestKnown = nearMatch.short;
      } else {
        category = "missing";
      }
    }

    categorized.push({
      normalized: norm,
      raw: sample.raw,
      category,
      occurrences: hits.length,
      example: { taxon: sample.taxon, context: sample.context },
      closestKnown,
    });
  }

  categorized.sort(
    (a, b) =>
      orderForCategory(a.category) - orderForCategory(b.category) ||
      b.occurrences - a.occurrences,
  );

  // Summary stats.
  const distinctKnown = knownHits.size;
  const totalKnownOccurrences = [...knownHits.values()].reduce(
    (s, n) => s + n,
    0,
  );
  const unknownOccurrences = categorized.reduce(
    (s, u) => s + u.occurrences,
    0,
  );
  console.log(`Summaries: ${totalSummaries}`);
  console.log(`Matches: ${totalMatches} (${totalKnownOccurrences} resolved, ${unknownOccurrences} unresolved)`);
  console.log(`Bibliography: ${refs.length} (${distinctKnown} cited)`);

  // Unresolved citations, grouped by category.
  const groups: Record<UnknownCategory, CategorizedUnknown[]> = {
    missing: [],
    ambiguous_year: [],
    typo_or_variant: [],
    regex_clipped: [],
    false_positive: [],
  };
  for (const u of categorized) groups[u.category].push(u);

  printList("Missing", groups.missing);
  printGroup("Ambiguous year", groups.ambiguous_year);
  printGroup("Typo / variant", groups.typo_or_variant);
  printGroup("Regex clipped", groups.regex_clipped);
  printList("False positive", groups.false_positive);
}

function orderForCategory(c: UnknownCategory): number {
  return {
    missing: 0,
    ambiguous_year: 1,
    typo_or_variant: 2,
    regex_clipped: 3,
    false_positive: 4,
  }[c];
}

/** Plain list — used for groups where the bibliography column is meaningless
 * (Missing has nothing to suggest, False positive isn't actually a citation). */
function printList(title: string, items: CategorizedUnknown[]) {
  console.log(`\n--- ${title} (${items.length}) ---`);
  if (items.length === 0) return;
  const countWidth = Math.max(
    ...items.map((u) => String(u.occurrences).length),
  );
  for (const u of items) {
    console.log(`  ${String(u.occurrences).padStart(countWidth)} × ${u.raw}`);
    if (VERBOSE) {
      console.log(`     ${" ".repeat(countWidth)}  [${u.example.taxon}] …${u.example.context}…`);
    }
  }
}

function printGroup(title: string, items: CategorizedUnknown[]) {
  console.log(`\n--- ${title} (${items.length}) ---`);
  if (items.length === 0) return;

  const COUNT_HEADER = "#";
  const SUMMARY_HEADER = "In summary";
  const BIB_HEADER = "Bibliography match";

  const countWidth = Math.max(
    COUNT_HEADER.length,
    ...items.map((u) => String(u.occurrences).length),
  );
  const summaryWidth = Math.max(
    SUMMARY_HEADER.length,
    ...items.map((u) => u.raw.length),
  );

  const fmt = (count: string, summary: string, bib: string) =>
    `  ${count.padStart(countWidth)}  ${summary.padEnd(summaryWidth)}  ${bib}`;

  console.log(fmt(COUNT_HEADER, SUMMARY_HEADER, BIB_HEADER));
  console.log(
    fmt(
      "─".repeat(countWidth),
      "─".repeat(summaryWidth),
      "─".repeat(BIB_HEADER.length),
    ),
  );
  for (const u of items) {
    console.log(fmt(String(u.occurrences), u.raw, u.closestKnown ?? "—"));
    if (VERBOSE) {
      console.log(`     ${" ".repeat(countWidth)}  [${u.example.taxon}] …${u.example.context}…`);
    }
  }
}

/**
 * Optimal String Alignment (Damerau-Levenshtein restricted to adjacent
 * transpositions, no further edits to the transposed pair). Matters here
 * because letter swaps like "Ferriera"↔"Ferreira" count as one edit instead
 * of two — letting us tighten the typo-match threshold.
 */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 4) return 99;
  const m = a.length;
  const n = b.length;
  // d[i][j] = OSA distance between a[0..i] and b[0..j].
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

await main();
