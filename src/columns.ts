// Order matters: the index here is the position in each row of the compact JSON.
// New fields also need a columnMap entry in public/versions.json.

export const COLUMNS = [
  "sequence",
  "rank",
  "order",
  "family",
  "familyEn",
  "sciName",
  "authority",
  "citation",
  "name",
  "nameClements",
  "nameBirdLife",
  "proposalNumber",
  "decisionSummary",
  "range",
  "extinct",
  "iucn",
  "birdLifeUrl",
  "cornellCode",
  "bowUrl",
  "avibaseId",
  "genusGender",
  "typeSpecies",
  "typeLocality",
  "originalDescriptionTitle",
  "originalDescriptionUrl",
  "protonym",
] as const;

export type Column = (typeof COLUMNS)[number];
