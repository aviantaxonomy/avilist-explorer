import { useEffect, useState } from "react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { loadSpecies, type Species } from "@/lib/data";

export function App() {
  const [data, setData] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpecies().then(setData, (e) => setError(String(e)));
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">AviList Explorer</h1>
        {data && (
          <p className="text-muted-foreground mt-1 text-sm">
            {data.length.toLocaleString()} taxa
          </p>
        )}
      </header>
      <main className="p-6">
        {error && <p className="text-destructive">{error}</p>}
        {!data && !error && (
          <p className="text-muted-foreground">Loading…</p>
        )}
        {data && <SpeciesTable data={data} />}
      </main>
    </div>
  );
}
