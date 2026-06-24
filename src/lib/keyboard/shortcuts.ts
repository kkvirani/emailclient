/**
 * Central keyboard shortcut registry.
 * See docs/06-UI-COMPONENT-MAP.md (keyboard-first workflow).
 * Phase 4 wires these to actions; here we define the canonical map + cheat sheet.
 */
export type Shortcut = {
  id: string;
  keys: string[]; // display form, e.g. ["⌘", "K"] or ["g", "i"]
  description: string;
  group: "Navigation" | "Actions" | "Compose" | "Selection" | "Global";
};

export const SHORTCUTS: Shortcut[] = [
  // Global
  { id: "palette", keys: ["⌘", "K"], description: "Open command palette", group: "Global" },
  { id: "search", keys: ["/"], description: "Search", group: "Global" },
  { id: "help", keys: ["?"], description: "Show shortcuts", group: "Global" },
  { id: "compose", keys: ["c"], description: "Compose", group: "Compose" },

  // Navigation (g then key)
  { id: "go-inbox", keys: ["g", "i"], description: "Go to Inbox", group: "Navigation" },
  { id: "go-sent", keys: ["g", "t"], description: "Go to Sent", group: "Navigation" },
  { id: "go-drafts", keys: ["g", "d"], description: "Go to Drafts", group: "Navigation" },
  { id: "go-archive", keys: ["g", "e"], description: "Go to Archive", group: "Navigation" },
  { id: "go-starred", keys: ["g", "s"], description: "Go to Starred", group: "Navigation" },
  { id: "next", keys: ["j"], description: "Next email", group: "Navigation" },
  { id: "prev", keys: ["k"], description: "Previous email", group: "Navigation" },

  // Actions
  { id: "archive", keys: ["e"], description: "Archive", group: "Actions" },
  { id: "delete", keys: ["#"], description: "Delete", group: "Actions" },
  { id: "reply", keys: ["r"], description: "Reply", group: "Actions" },
  { id: "reply-all", keys: ["a"], description: "Reply all", group: "Actions" },
  { id: "forward", keys: ["f"], description: "Forward", group: "Actions" },
  { id: "toggle-read", keys: ["u"], description: "Toggle read/unread", group: "Actions" },
  { id: "star", keys: ["s"], description: "Star", group: "Actions" },

  // Selection
  { id: "select", keys: ["x"], description: "Select email", group: "Selection" },
  { id: "select-all", keys: ["⌘", "A"], description: "Select all", group: "Selection" },
  { id: "clear-selection", keys: ["Esc"], description: "Clear selection", group: "Selection" },
];

export function shortcutsByGroup() {
  const groups = new Map<Shortcut["group"], Shortcut[]>();
  for (const s of SHORTCUTS) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group)!.push(s);
  }
  return groups;
}
