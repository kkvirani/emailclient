import { describe, it, expect, beforeEach } from "vitest";
import { useSelectionStore } from "./selection";

function reset() {
  useSelectionStore.getState().clear();
}

describe("selection store", () => {
  beforeEach(reset);

  it("toggles explicit ids and tracks count", () => {
    const s = useSelectionStore.getState();
    s.toggle("a");
    s.toggle("b");
    expect(useSelectionStore.getState().count()).toBe(2);
    expect(useSelectionStore.getState().isSelected("a")).toBe(true);

    useSelectionStore.getState().toggle("a");
    expect(useSelectionStore.getState().count()).toBe(1);
    expect(useSelectionStore.getState().isSelected("a")).toBe(false);
  });

  it("returns to 'none' mode when last id removed", () => {
    const s = useSelectionStore.getState();
    s.toggle("a");
    expect(useSelectionStore.getState().mode).toBe("some");
    useSelectionStore.getState().toggle("a");
    expect(useSelectionStore.getState().mode).toBe("none");
  });

  it("select-all-matching scales without materializing ids", () => {
    useSelectionStore.getState().selectAllMatching({ folder: "inbox" }, 3412);
    const s = useSelectionStore.getState();
    expect(s.mode).toBe("allMatching");
    expect(s.count()).toBe(3412);
    expect(s.isSelected("anything")).toBe(true);
  });

  it("excludes individual items from an all-matching selection", () => {
    useSelectionStore.getState().selectAllMatching({ folder: "inbox" }, 100);
    useSelectionStore.getState().toggle("x");
    const s = useSelectionStore.getState();
    expect(s.isSelected("x")).toBe(false);
    expect(s.count()).toBe(99);
  });

  it("clear resets everything", () => {
    useSelectionStore.getState().selectAllMatching({ folder: "inbox" }, 10);
    useSelectionStore.getState().clear();
    const s = useSelectionStore.getState();
    expect(s.mode).toBe("none");
    expect(s.count()).toBe(0);
    expect(s.queryDescriptor).toBeNull();
  });
});
