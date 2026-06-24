"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command/command-palette";
import { ShortcutCheatSheet } from "@/components/common/shortcut-cheatsheet";
import { usePaletteStore } from "@/stores/palette";

/** Returns true when focus is in an input/textarea/contenteditable. */
function isTyping(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable
  );
}

export function AppShell({
  title,
  children,
  user,
}: {
  title: string;
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const togglePalette = usePaletteStore((s) => s.toggle);
  const router = useRouter();
  const [cheatOpen, setCheatOpen] = React.useState(false);
  const [pendingG, setPendingG] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Command palette: ⌘K / Ctrl+K — always available.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (isTyping(e.target)) return;

      // "g then x" navigation.
      if (pendingG) {
        const map: Record<string, string> = {
          i: "/inbox",
          t: "/sent",
          d: "/drafts",
          e: "/archive",
          s: "/starred",
        };
        const dest = map[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        setPendingG(false);
        return;
      }

      if (e.key === "g") {
        setPendingG(true);
        window.setTimeout(() => setPendingG(false), 800);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setCheatOpen((v) => !v);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        togglePalette();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingG, router, togglePalette]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <CommandPalette />
      <ShortcutCheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
    </div>
  );
}
