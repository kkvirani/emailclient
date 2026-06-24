"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Inbox,
  Send,
  Archive,
  Trash2,
  MailX,
  LayoutDashboard,
  Sparkles,
  PenSquare,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePaletteStore } from "@/stores/palette";
import { useUiStore } from "@/stores/ui";

type Item = {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
  run: () => void;
  keywords?: string[];
};

export function CommandPalette() {
  const open = usePaletteStore((s) => s.open);
  const setOpen = usePaletteStore((s) => s.setOpen);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const setComposerOpen = useUiStore((s) => s.setComposerOpen);

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  const items: Item[] = React.useMemo(
    () => [
      { id: "compose", label: "Compose new email", icon: PenSquare, group: "Actions", run: () => { setComposerOpen(true); close(); } },
      { id: "go-inbox", label: "Go to Inbox", icon: Inbox, group: "Navigation", run: () => { router.push("/inbox"); close(); } },
      { id: "go-sent", label: "Go to Sent", icon: Send, group: "Navigation", run: () => { router.push("/sent"); close(); } },
      { id: "go-archive", label: "Go to Archive", icon: Archive, group: "Navigation", run: () => { router.push("/archive"); close(); } },
      { id: "go-trash", label: "Go to Trash", icon: Trash2, group: "Navigation", run: () => { router.push("/trash"); close(); } },
      { id: "go-unsub", label: "Open Unsubscribe Center", icon: MailX, group: "Navigation", keywords: ["newsletter"], run: () => { router.push("/unsubscribe"); close(); } },
      { id: "go-dashboard", label: "Open Dashboard", icon: LayoutDashboard, group: "Navigation", run: () => { router.push("/dashboard"); close(); } },
      { id: "go-settings", label: "Open Settings", icon: Settings, group: "Navigation", run: () => { router.push("/settings"); close(); } },
      { id: "ai-summary", label: "Summarize my inbox", icon: Sparkles, group: "AI", run: () => { close(); } },
      { id: "theme", label: "Toggle theme", icon: resolvedTheme === "dark" ? Sun : Moon, group: "Preferences", run: () => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); close(); } },
    ],
    [router, setTheme, resolvedTheme, setComposerOpen, close]
  );

  const groups = React.useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) {
      if (!m.has(it.group)) m.set(it.group, []);
      m.get(it.group)!.push(it);
    }
    return [...m.entries()];
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-start justify-center pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ scale: 0.97, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass relative w-full max-w-xl overflow-hidden rounded-xl shadow-2xl"
          >
            <Command
              loop
              className="[&_[cmdk-input]]:outline-none"
            >
              <Command.Input
                autoFocus
                placeholder="Type a command or search…"
                className="h-12 w-full bg-transparent px-4 text-sm placeholder:text-muted-foreground"
              />
              <Command.List className="max-h-80 overflow-y-auto border-t border-border/50 p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                {groups.map(([group, groupItems]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/70"
                  >
                    {groupItems.map((it) => {
                      const Icon = it.icon;
                      return (
                        <Command.Item
                          key={it.id}
                          value={`${it.label} ${(it.keywords ?? []).join(" ")}`}
                          onSelect={it.run}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          {it.label}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
