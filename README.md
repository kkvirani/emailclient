# Postal — Premium Personal Email Client

A keyboard-first, AI-augmented personal email client. **Superhuman speed × Linear
polish × Notion flexibility.** Browser UI backed by a secure Next.js server.

> Single-user, self-hosted, engineered like a $20/month SaaS.

## Status

**Phase 1 — Foundation architecture: complete.**
- All 10 architecture deliverables in [`docs/`](./docs).
- Running Next.js app: design system, dark/light themes, glassmorphism, app shell,
  command palette (⌘K), keyboard shortcuts + cheat sheet (`?`), selection model.
- Full Prisma data model (`prisma/schema.prisma`) + Postgres/pgvector via Docker.
- Secure AES-256-GCM token vault, Auth.js skeleton, TanStack Query + Zustand wired.

See [`docs/10-ROADMAP.md`](./docs/10-ROADMAP.md) for upcoming phases.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · TanStack Query · Zustand ·
Framer Motion · React Hook Form · Zod · Prisma · PostgreSQL + pgvector ·
Auth.js (NextAuth v5) · OpenAI · Gmail API · Microsoft Graph · IMAP.

## Architecture in one line

The UI runs in the browser; **OAuth tokens, IMAP credentials, encryption keys, and
AI calls stay server-side** in Next.js route handlers. A "pure browser" client
cannot do IMAP or keep secrets safe — see
[`docs/02-SYSTEM-ARCHITECTURE.md`](./docs/02-SYSTEM-ARCHITECTURE.md).

## Getting started

### 1. Prerequisites
- Node 20+ (tested on 22), npm 10+
- Docker (for Postgres + pgvector)

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Generate an auth secret:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  -> AUTH_SECRET
# Generate the token-vault key (must be 32 bytes base64):
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  -> ENCRYPTION_KEY
# Set OWNER_EMAIL to your email (only this address may sign in).
```

### 4. Start the database
```bash
npm run db:up          # starts Postgres + pgvector (docker compose)
npm run db:generate    # prisma generate
npm run db:migrate     # create the schema
npm run db:seed        # owner user + system smart views
```

### 5. Run the app
```bash
npm run dev            # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run db:up` / `db:down` | Postgres container up/down |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Seed the database |

## Keyboard shortcuts

- `⌘K` / `Ctrl+K` — command palette
- `?` — shortcut cheat sheet
- `g i / g t / g d / g e / g s` — go to Inbox / Sent / Drafts / Archive / Starred
- `c` — compose (more land in Phase 4)

## Project layout

See [`docs/05-FOLDER-STRUCTURE.md`](./docs/05-FOLDER-STRUCTURE.md). Key boundaries:
- `src/server/**` is server-only (`import "server-only"`).
- `src/components/**` presentational; `src/features/**` domain logic/hooks.
- `src/stores/**` Zustand UI state; server state lives in TanStack Query.

## Documentation

| Doc | |
| --- | --- |
| [01 PRD](./docs/01-PRD.md) | Product requirements |
| [02 System Architecture](./docs/02-SYSTEM-ARCHITECTURE.md) | Topology, layers, security |
| [03 Database Schema](./docs/03-DATABASE-SCHEMA.md) | Data model |
| [04 API Design](./docs/04-API-DESIGN.md) | Endpoints |
| [05 Folder Structure](./docs/05-FOLDER-STRUCTURE.md) | Code organization |
| [06 UI Component Map](./docs/06-UI-COMPONENT-MAP.md) | Design system + components |
| [07 State Management](./docs/07-STATE-MANAGEMENT.md) | Query + Zustand plan |
| [08 Email Sync](./docs/08-EMAIL-SYNC-ARCHITECTURE.md) | Provider sync |
| [09 AI Integration](./docs/09-AI-INTEGRATION.md) | AI pipeline |
| [10 Roadmap](./docs/10-ROADMAP.md) | Phased delivery |
