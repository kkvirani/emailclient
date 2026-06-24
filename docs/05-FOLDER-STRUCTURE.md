# Folder Structure

```
emailclient/
├─ docs/                         # Architecture deliverables (this folder)
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ scripts/                      # dev/ops scripts (db reset, backfill, etc.)
├─ public/                       # static assets, icons
├─ src/
│  ├─ app/                       # Next.js App Router
│  │  ├─ (marketing)/            # sign-in / landing
│  │  ├─ (app)/                  # authenticated app shell
│  │  │  ├─ layout.tsx           # app shell (sidebar + topbar + panels)
│  │  │  ├─ inbox/
│  │  │  ├─ thread/[id]/
│  │  │  ├─ unsubscribe/
│  │  │  ├─ rules/
│  │  │  ├─ views/[id]/
│  │  │  ├─ dashboard/
│  │  │  └─ settings/
│  │  ├─ api/                    # route handlers (see 04-API-DESIGN.md)
│  │  │  ├─ auth/[...nextauth]/
│  │  │  ├─ accounts/
│  │  │  ├─ messages/
│  │  │  ├─ search/
│  │  │  ├─ subscriptions/
│  │  │  ├─ rules/
│  │  │  ├─ ai/
│  │  │  └─ analytics/
│  │  ├─ globals.css             # Tailwind + design tokens
│  │  └─ layout.tsx              # root layout, providers
│  │
│  ├─ components/
│  │  ├─ ui/                     # shadcn/ui primitives (button, dialog, ...)
│  │  ├─ layout/                 # AppShell, Sidebar, Topbar, Panel, Split
│  │  ├─ mail/                   # MessageList, MessageRow, ThreadView, Composer
│  │  ├─ command/                # CommandPalette
│  │  ├─ unsubscribe/            # SubscriptionTable, ConfidenceBadge
│  │  ├─ rules/                  # RuleBuilder
│  │  ├─ dashboard/              # charts, stat cards
│  │  └─ common/                 # EmptyState, Spinner, Kbd, etc.
│  │
│  ├─ features/                  # feature modules (hooks + logic per domain)
│  │  ├─ accounts/
│  │  ├─ mail/
│  │  ├─ bulk/
│  │  ├─ unsubscribe/
│  │  ├─ rules/
│  │  ├─ search/
│  │  ├─ ai/
│  │  └─ analytics/
│  │
│  ├─ server/                    # server-only code (never imported by client)
│  │  ├─ db.ts                   # Prisma client singleton
│  │  ├─ auth.ts                 # Auth.js config
│  │  ├─ crypto.ts               # AES-256-GCM token vault
│  │  ├─ providers/              # gmail.ts, graph.ts, imap.ts + types
│  │  ├─ services/               # MailService, SyncService, AiService, ...
│  │  ├─ rules/                  # rules engine
│  │  ├─ unsubscribe/            # detection + execution
│  │  └─ audit.ts
│  │
│  ├─ lib/                       # isomorphic utils
│  │  ├─ design/                 # tokens, theme helpers
│  │  ├─ query/                  # TanStack Query client + keys
│  │  ├─ validation/             # shared Zod schemas
│  │  ├─ keyboard/               # shortcut registry
│  │  └─ utils.ts                # cn(), formatting
│  │
│  ├─ stores/                    # Zustand stores (UI state)
│  │  ├─ selection.ts
│  │  ├─ palette.ts
│  │  └─ ui.ts
│  │
│  ├─ types/                     # shared TS types
│  └─ test/                      # test setup + helpers
│
├─ docker-compose.yml            # Postgres + pgvector
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
├─ vitest.config.ts
└─ package.json
```

## Rules
- `src/server/**` is server-only (guarded with `import "server-only"`).
- Client never imports provider/crypto/db code.
- `features/**` own React Query hooks + client logic; `components/**` are presentational.
- Shared Zod schemas in `lib/validation` are used by both client forms and server handlers.
