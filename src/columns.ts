// Canonical column order — index in this array IS the positional index
// in the compact JSON output (avilist-<id>.json.gz). Hand-maintained.
//
// To add or rename a field: update this array AND, if the xlsx column name
// differs, add an entry in public/versions.json `columnMap` so the converter
// knows where to read it from.

export const COLUMNS = [
  "Sequence",
  "Taxon_rank",
  "Order",
  "Family",
  "Family_English_name",
  "Scientific_name",
  "Authority",
  "Bibliographic_details",
  "English_name_AviList",
  "English_name_Clements_v2024",
  "English_name_BirdLife_v9",
  "Proposal_number",
  "Decision_summary",
  "Range",
  "Extinct_or_possibly_extinct",
  "IUCN_Red_List_Category",
  "BirdLife_DataZone_URL",
  "Species_code_Cornell_Lab",
  "Birds_of_the_World_URL",
  "AvibaseID",
  "Gender_of_genus",
  "Type_species_of_genus",
  "Type_locality",
  "Title_of_original_description",
  "Original_description_URL",
  "Protonym",
] as const;

export type Column = (typeof COLUMNS)[number];
