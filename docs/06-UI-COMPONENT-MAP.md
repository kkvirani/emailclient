# UI Component Map

## Design language
Premium, calm, dense-but-legible. Inspired by Linear/Superhuman/Raycast/Notion/Vercel.
Glassmorphism on overlays (command palette, popovers, compose). Motion is quick and
purposeful (120–220ms, spring for panels).

## Layout primitives (`components/layout`)
- `AppShell` — grid: Sidebar | (Topbar / Content / optional Reading pane).
- `Sidebar` — accounts, folders, smart views, labels; collapsible.
- `Topbar` — search entry, view switcher, account filter, AI button, avatar.
- `Split` — resizable list/reading panes (Superhuman-style).
- `Panel` — glass surface used by palette, compose, AI assistant.
- `ScrollArea` — styled, virtualization-friendly.

## UI primitives (`components/ui`, shadcn)
Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Tabs, Dialog,
Sheet, Popover, DropdownMenu, Tooltip, Badge, Avatar, Separator, Skeleton,
Toast/Sonner, Command (cmdk), Progress, Slider, ContextMenu, HoverCard, Kbd.

## Mail components (`components/mail`)
- `MessageList` — virtualized; supports range/shift select, select-all-across-pages.
- `MessageRow` — sender, subject, snippet, time, badges (category, attachment,
  star), hover quick-actions (archive/delete/snooze), selection checkbox.
- `BulkActionBar` — appears when ≥1 selected; shows count, select-all banner,
  action buttons. Sticky, glass.
- `ThreadView` — collapsed message cards, expand on click, quoted-text fold.
- `MessageHeader` — avatar, from/to, time, actions menu.
- `Composer` — RHF + Zod; to/cc/bcc chips, subject, rich body, attachments,
  send/schedule; AI "improve/reply" affordances.
- `CategoryBadge`, `ConfidenceBadge`, `LabelChip`, `TagChip`.

## Command palette (`components/command`)
- `CommandPalette` — cmdk + glass Panel; modes: actions, go-to, search mail,
  run cleanup. Fuzzy, keyboard-first, recent + suggested.

## Unsubscribe (`components/unsubscribe`)
- `SubscriptionTable` — virtualized rows: sender, count, last received,
  est. monthly volume, confidence, method, status.
- `UnsubscribeDialog` — confirm, choose post-action (archive/delete/label),
  shows method + confidence.
- `BulkUnsubscribeBar`.

## Rules (`components/rules`)
- `RuleBuilder` — visual IF/THEN; condition rows (field/operator/value),
  action rows; match all/any; live preview count; drag to reorder.

## Dashboard (`components/dashboard`)
- `StatCard`, `TrendChart` (area/line), `TopSendersList`, `StorageBar`,
  `SubscriptionTrend`, `CleanupOpportunities`.

## Common (`components/common`)
- `EmptyState`, `LoadingState`, `ErrorState`, `Kbd`, `Hotkey`,
  `ShortcutCheatSheet`, `ThemeToggle`, `AccountSwitcher`, `ConfidenceMeter`.

## Screen → component composition
| Screen | Composed of |
| --- | --- |
| Inbox | AppShell + Sidebar + Topbar + Split(MessageList, ThreadView) + BulkActionBar |
| Thread | ThreadView + Composer |
| Unsubscribe | SubscriptionTable + BulkUnsubscribeBar + UnsubscribeDialog |
| Rules | RuleBuilder list + editor |
| Dashboard | grid of StatCard/Charts |
| Settings | Tabs: Accounts, Appearance, Shortcuts, AI, Rules, Privacy |
| Command palette | global overlay |

## Accessibility
- Radix-based primitives (focus management, ARIA).
- Visible focus rings; full keyboard reachability.
- Color contrast AA in both themes; motion respects `prefers-reduced-motion`.
