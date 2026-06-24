"use client";

import { PanelLeft, Search, Sparkles, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useUiStore } from "@/stores/ui";
import { usePaletteStore } from "@/stores/palette";

export function Topbar({ title }: { title: string }) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setComposerOpen = useUiStore((s) => s.setComposerOpen);
  const setAiPanelOpen = useUiStore((s) => s.setAiPanelOpen);
  const openPalette = usePaletteStore((s) => s.setOpen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3">
      <Tooltip content="Toggle sidebar">
        <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
          <PanelLeft />
        </Button>
      </Tooltip>

      <h1 className="text-sm font-semibold">{title}</h1>

      {/* Search trigger (opens palette in search mode) */}
      <button
        onClick={() => openPalette(true)}
        className="group ml-2 flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search mail…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip content="AI Assistant">
          <Button variant="ghost" size="icon-sm" onClick={() => setAiPanelOpen(true)}>
            <Sparkles />
          </Button>
        </Tooltip>
        <ThemeToggle />
        <Button size="sm" className="ml-1" onClick={() => setComposerOpen(true)}>
          <PenSquare />
          Compose
        </Button>
      </div>
    </header>
  );
}
