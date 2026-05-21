import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { emptyFilters, type FilterState } from "./filters";

type PrefsState = {
  versionId: string | null;
  locale: string | null;
  filters: FilterState;
  setVersionId: (id: string | null) => void;
  setLocale: (code: string | null) => void;
  setFilters: (next: FilterState) => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      versionId: null,
      locale: null,
      filters: emptyFilters,
      setVersionId: (id) => set({ versionId: id }),
      setLocale: (code) => set({ locale: code }),
      setFilters: (next) => set({ filters: next }),
    }),
    {
      name: "avilist:prefs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        locale: s.locale,
        filters: s.filters,
      }),
    },
  ),
);
