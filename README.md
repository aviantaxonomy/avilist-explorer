# AviList Explorer

A searchable, filterable viewer for the [AviList](https://avilist.org/) global avian checklist. It runs entirely in the browser, with each checklist version shipped as a static JSON file.

Built with Vite, React, TypeScript, Tailwind, shadcn/ui and TanStack Table.

## Setup

```
npm install
npm run dev
```

Common names in other languages come from the eBird API. To enable them, copy `.env.example` to `.env` and add an eBird API key.

## Adding a new AviList version

1. Put the extended xlsx in `xlsx/`.
2. Add an entry to the `versions` array in `public/versions.json`. The last entry is the default version.
3. If any column headers changed, add the new header as the first alias for that field in `columnMap`. Older headers can stay as fallbacks.
4. Run `npm run extract` to regenerate the JSON in `public/data/`.
5. Commit the xlsx and the generated JSON.

`npm run check-references` lists citations in the decision summaries that have no matching entry in the bibliography.
