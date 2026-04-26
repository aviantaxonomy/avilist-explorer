import { useEffect, useState } from "react";
import { SpeciesTable } from "@/components/SpeciesTable";
import { loadSpecies, type Species } from "@/lib/data";
import logo from "@/assets/logo.webp";

export function App() {
  const [data, setData] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpecies().then(setData, (e) => setError(String(e)));
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <img
          src={logo}
          alt="AviList — The Global Avian Checklist"
          className="h-10 w-auto"
        />
        {data && (
          <span className="text-muted-foreground border-l pl-4 text-sm">
            {data.length.toLocaleString()} taxa
          </span>
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
