import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Density = "comfortable" | "compact";
export type ReadingPane = "right" | "bottom" | "off";

interface UiState {
  sidebarCollapsed: boolean;
  density: Density;
  readingPane: ReadingPane;
  composerOpen: boolean;
  aiPanelOpen: boolean;
  toggleSidebar: () => void;
  setDensity: (d: Density) => void;
  setReadingPane: (p: ReadingPane) => void;
  setComposerOpen: (open: boolean) => void;
  setAiPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      density: "comfortable",
      readingPane: "right",
      composerOpen: false,
      aiPanelOpen: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setDensity: (density) => set({ density }),
      setReadingPane: (readingPane) => set({ readingPane }),
      setComposerOpen: (composerOpen) => set({ composerOpen }),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
    }),
    { name: "postal-ui" }
  )
);
