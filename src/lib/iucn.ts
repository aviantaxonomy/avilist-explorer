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
