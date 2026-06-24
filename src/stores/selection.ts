import { create } from "zustand";
import type { MessageFilter } from "@/lib/query/keys";

/**
 * Selection model that scales to thousands of emails.
 * See docs/07-STATE-MANAGEMENT.md.
 *
 * Two modes:
 *  - explicit: a Set of ids the user picked.
 *  - allMatching: "select all N in this view" — stored as a query descriptor
 *    plus an exclude set, so we never materialize 10k ids client-side.
 */
export type SelectionMode = "none" | "some" | "allMatching";

interface SelectionState {
  mode: SelectionMode;
  ids: Set<string>;
  excludeIds: Set<string>;
  queryDescriptor: MessageFilter | null;
  matchingTotal: number;
  lastAnchorId: string | null;

  count: () => number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  setAnchor: (id: string) => void;
  selectAllMatching: (filter: MessageFilter, total: number) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  mode: "none",
  ids: new Set(),
  excludeIds: new Set(),
  queryDescriptor: null,
  matchingTotal: 0,
  lastAnchorId: null,

  count: () => {
    const s = get();
    if (s.mode === "allMatching") {
      return Math.max(0, s.matchingTotal - s.excludeIds.size);
    }
    return s.ids.size;
  },

  isSelected: (id) => {
    const s = get();
    if (s.mode === "allMatching") return !s.excludeIds.has(id);
    return s.ids.has(id);
  },

  toggle: (id) =>
    set((s) => {
      if (s.mode === "allMatching") {
        const excludeIds = new Set(s.excludeIds);
        if (excludeIds.has(id)) excludeIds.delete(id);
        else excludeIds.add(id);
        return { excludeIds, lastAnchorId: id };
      }
      const ids = new Set(s.ids);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return {
        ids,
        mode: ids.size > 0 ? "some" : "none",
        lastAnchorId: id,
      };
    }),

  setAnchor: (id) => set({ lastAnchorId: id }),

  selectAllMatching: (filter, total) =>
    set({
      mode: "allMatching",
      queryDescriptor: filter,
      matchingTotal: total,
      excludeIds: new Set(),
      ids: new Set(),
    }),

  clear: () =>
    set({
      mode: "none",
      ids: new Set(),
      excludeIds: new Set(),
      queryDescriptor: null,
      matchingTotal: 0,
      lastAnchorId: null,
    }),
}));
