# AviList Explorer

Browseable, searchable, filterable client-side viewer for the [AviList](https://avilist.org/) global avian taxonomic checklist. No backend, the entire dataset is shipped as a gzipped JSON file fetched on first load.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack Table v8 + TanStack Virtual (virtualised table for 33k rows)

## Setup

```
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/`. Data is loaded from the latest version declared in `public/versions.json`.

## Scripts

| Command           | What it does                                                                           |
| ----------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                                                               |
| `npm run build`   | Typecheck + production build                                                           |
| `npm run preview` | Preview the production build locally                                                   |
| `npm run extract` | Read every xlsx listed in `versions.json`, emit gzipped compact JSON to `public/data/` |

## How the data pipeline works

1. AviList publishes a `.xlsx` file (e.g. `AviList-v2025-11Jun-extended.xlsx`).
2. `npm run extract` reads each xlsx, applies the column mapping, and writes one compact gzipped JSON per version to `public/data/avilist-<id>.json.gz`.
3. The client fetches `versions.json`, picks a version, fetches that version's gzipped JSON. The browser decompresses it transparently.
4. The compact format is an array of positional arrays, no keys per row. Index 0 is `sequence`, index 1 is `rank`, etc., per the order in `src/columns.ts`. The client unpacks into objects keyed by canonical name.

## Adding a new AviList version

1. Drop the new xlsx into `xlsx/`, e.g. `xlsx/AviList-v2026-XXJan-extended.xlsx`.
2. Open `public/versions.json` and append an entry to the `versions` array (most recent goes last — the picker defaults to the last entry):

   ```json
   {
     "id": "2026.01",
     "label": "v2026.01",
     "released": "15 Jan 2026",
     "inputXlsx": "xlsx/AviList-v2026-XXJan-extended.xlsx",
     "sheet": "AviList v2026 extended",
     "clementsVersion": "v2024",
     "birdLifeVersion": "v9"
   }
   ```

3. **Only if AviList renamed any columns in the new xlsx**: update the top-level `columnMap` to add the new xlsx name as the _first_ alias for the affected canonical field. Example — if `Family_English_name` was renamed to `Family_English`:

   ```json
   "familyEn": ["Family_English", "Family_English_name"]
   ```

   The extractor uses the first match found, so leaving the old name in keeps prior versions working.

4. Run the extractor:

   ```
   npm run extract
   ```

5. Commit the new xlsx, the manifest update, and the generated data file together:

   ```
   git add xlsx/AviList-v2026-XXJan-extended.xlsx public/versions.json public/data/avilist-2026.01.json.gz
   git commit -m "Add v2026.01"
   ```

6. Push and redeploy. The version picker in the header shows the new entry. No code changes required.

The xlsx files live under `xlsx/` and are committed to git so the source data is reproducible. The generated `*.json.gz` is what actually ships to the client.

## Adding a new column

If AviList adds a brand-new field that we want to surface:

1. Append the canonical name to the `COLUMNS` array in `src/columns.ts`.
2. Add an entry in `public/versions.json` under `columnMap` mapping the canonical name to the xlsx column name(s).
3. `npm run extract` to regenerate gzipped data.
4. Reference the new field in components as `taxon.<canonicalName>`.

The TypeScript `Column` type is derived from `COLUMNS`, so adding to the array gives you autocomplete for the new field everywhere.
