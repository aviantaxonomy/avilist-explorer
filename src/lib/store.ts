import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { emptyFilters, type FilterState } from "./filters";

type PrefsState = {
  versionId: string | null;
  locale: string | null;
  filters: FilterState;
  setVersionId: (id: string | null) => void;
  setLocale: (code: string | null) => void;
  setFilters: (next: FilterState) => void;
};

const SET_TAG = "__set";

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Set) return { [SET_TAG]: true, items: [...value] };
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    (value as Record<string, unknown>)[SET_TAG] === true
  ) {
    return new Set((value as { items: string[] }).items);
  }
  return value;
}

const setAwareStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
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
      storage: createJSONStorage(() => setAwareStorage, { replacer, reviver }),
      partialize: (s) => ({
        locale: s.locale,
      }),
    },
  ),
);
