"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { shortcutsByGroup } from "@/lib/keyboard/shortcuts";
import { Kbd } from "@/components/ui/kbd";

export function ShortcutCheatSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const groups = React.useMemo(() => [...shortcutsByGroup().entries()], []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass relative w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
              <span className="text-xs text-muted-foreground">
                Press <Kbd>?</Kbd> to toggle
              </span>
            </div>
            <div className="grid max-h-[70vh] grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto p-5">
              {groups.map(([group, list]) => (
                <div key={group}>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group}
                  </div>
                  <div className="space-y-1.5">
                    {list.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-foreground/90">{s.description}</span>
                        <span className="flex items-center gap-1">
                          {s.keys.map((k, i) => (
                            <Kbd key={i}>{k}</Kbd>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
