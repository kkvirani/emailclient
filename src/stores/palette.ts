import { create } from "zustand";

export type PaletteMode = "actions" | "goto" | "search" | "cleanup";

interface PaletteState {
  open: boolean;
  mode: PaletteMode;
  query: string;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setMode: (mode: PaletteMode) => void;
  setQuery: (query: string) => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  mode: "actions",
  query: "",
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  setMode: (mode) => set({ mode }),
  setQuery: (query) => set({ query }),
}));
