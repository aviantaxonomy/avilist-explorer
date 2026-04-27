// Canonical column order — index in this array IS the positional index
// in the compact JSON output (avilist-<id>.json.gz). Hand-maintained.
//
// To add or rename a field: update this array AND, if the xlsx column name
// differs, add an entry in public/versions.json `columnMap` so the converter
// knows where to read it from.

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
