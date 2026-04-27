export type IucnCode =
  | "LC"
  | "NT"
  | "VU"
  | "EN"
  | "CR"
  | "EW"
  | "EX"
  | "DD"
  | "NE";

export const IUCN_INFO: Record<
  IucnCode,
  { label: string; bg: string; fg: string }
> = {
  LC: { label: "Least Concern", bg: "#5a7a32", fg: "#f3efe6" },
  NT: { label: "Near Threatened", bg: "#a8a83a", fg: "#1a1a17" },
  VU: { label: "Vulnerable", bg: "#d99a2b", fg: "#1a1a17" },
  EN: { label: "Endangered", bg: "#c25a28", fg: "#1a1a17" },
  CR: { label: "Critically Endangered", bg: "#8a2a1c", fg: "#f3efe6" },
  EW: { label: "Extinct in the Wild", bg: "#3d2418", fg: "#f3efe6" },
  EX: { label: "Extinct", bg: "#1a1a17", fg: "#f3efe6" },
  DD: { label: "Data Deficient", bg: "#cfc6b3", fg: "#4a3f30" },
  NE: { label: "Not Evaluated", bg: "#f3efe6", fg: "#7a6a55" },
};

export const IUCN_BAR_ORDER: IucnCode[] = [
  "LC",
  "NT",
  "VU",
  "EN",
  "CR",
  "EW",
  "EX",
];

/**
 * Strip parenthetical qualifiers from an IUCN value.
 * "CR (PE)" → "CR", "EN" → "EN". Returns undefined if the prefix isn't a
 * known IUCN code.
 */
export function baseIucnCode(raw?: string): IucnCode | undefined {
  if (!raw) return undefined;
  const prefix = raw.trim().split(/[\s(]/)[0].toUpperCase();
  return prefix in IUCN_INFO ? (prefix as IucnCode) : undefined;
}

const QUALIFIER_LABELS: Record<string, string> = {
  PE: "possibly extinct",
  PEW: "possibly extinct in the wild",
};

/**
 * Pull a humanized qualifier from an IUCN value.
 * "CR (PE)" → "possibly extinct". Unknown qualifiers fall through verbatim.
 */
export function iucnQualifier(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\(([^)]+)\)/);
  if (!match) return undefined;
  return QUALIFIER_LABELS[match[1].toUpperCase()] ?? match[1];
}
