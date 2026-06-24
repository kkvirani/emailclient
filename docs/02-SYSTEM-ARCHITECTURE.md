# System Architecture

## 1. High-level topology

```
┌──────────────────────────────────────────────────────────────────────┐
│                              Browser (UI)                              │
│  Next.js App Router (RSC) + React client islands                       │
│  - Design system / theme                                               │
│  - TanStack Query cache  ─┐                                            │
│  - Zustand UI state       │  (no secrets, no tokens)                   │
│  - Command palette        │                                            │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ HTTPS (session cookie, CSRF-protected)
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Next.js Server (Route Handlers)                    │
│  /api/* REST-ish endpoints + server actions                           │
│  - Auth.js session + provider OAuth                                    │
│  - Token vault (encrypted at rest)                                     │
│  - Mail service layer (provider adapters)                              │
│  - AI service layer (OpenAI)                                           │
│  - Rules engine / unsubscribe engine                                   │
│  - Audit logging                                                       │
└───────┬───────────────────────┬───────────────────────┬──────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌──────────────────┐    ┌──────────────────────┐
│ PostgreSQL    │      │ Background Worker │    │ External APIs        │
│ + pgvector    │◄────►│ (sync, AI batch)  │    │ Gmail / Graph / IMAP │
│ (Prisma)      │      │ queue-driven      │    │ OpenAI               │
└───────────────┘      └──────────────────┘    └──────────────────────┘
```

## 2. Why this shape (challenging "entirely in browser")

A purely client-side email client cannot:
- Keep OAuth refresh tokens secret (they'd live in the browser).
- Speak IMAP/SMTP (raw TCP) from a browser.
- Run server-only secrets (OpenAI key, encryption key).

So we use a **browser-first UI** backed by a **secure Next.js server**. The user
experience is "in the browser"; the trust boundary and secrets stay server-side.

## 3. Layers

### 3.1 Presentation (client)
- React components, design system, Framer Motion.
- TanStack Query for server-state (lists, threads, counts) with optimistic updates.
- Zustand for ephemeral UI state (selection, palette open, panel layout).
- Virtualized lists (`@tanstack/react-virtual`).

### 3.2 API (server)
- Route handlers under `src/app/api/**` + typed server actions.
- Input validation with Zod at every boundary.
- Auth via Auth.js; every handler checks session + (single-user) ownership.

### 3.3 Domain services
- `MailService`: list/get/move/archive/delete/flag, compose/send.
- `SyncService`: provider-specific incremental sync, normalization.
- `UnsubscribeService`: detection, link extraction, execution.
- `RulesEngine`: evaluate conditions, run actions.
- `AiService`: categorize, summarize, reply, embed, semantic search.
- `AuditService`: append-only action log.

### 3.4 Provider adapters (Strategy pattern)
```
interface MailProvider {
  listMessages(cursor): Page<RawMessage>
  getMessage(id): RawMessage
  modify(id, ops): void      // labels/flags/move
  send(draft): SendResult
  watchOrPoll(): SyncToken
  unsubscribe?(headers): UnsubResult
}
```
Concrete: `GmailProvider`, `GraphProvider`, `ImapProvider`. A `NormalizedMessage`
mapper converts each provider's payload to our canonical schema.

### 3.5 Data
- PostgreSQL (canonical store) + pgvector (embeddings).
- Prisma as ORM and migration tool.
- Full-text search via Postgres `tsvector`; semantic via pgvector.

### 3.6 Background processing
- Phase 1: in-process job runner triggered by route handlers / cron.
- Later: durable queue (e.g. pg-boss on the same Postgres) for sync + AI batches,
  keeping infra single-container friendly.

## 4. Sync strategy (summary)
- Gmail: `historyId` incremental sync + batch `messages.get`.
- Graph: delta queries (`/delta`) per folder.
- IMAP: `CONDSTOR`/`QRESYNC` where available, else UID-based incremental.
- All writes are idempotent (upsert by provider message id + account).

## 5. Security boundaries
- Tokens encrypted with AES-256-GCM using a server-only `ENCRYPTION_KEY`.
- Session cookies: httpOnly, secure, sameSite=lax.
- CSRF tokens on mutations (Auth.js + double-submit for custom routes).
- Audit log of all destructive/bulk/unsubscribe actions.

## 6. Scalability notes
- Server-side pagination + DB indexes keep queries fast at 100k+.
- Virtualized rendering keeps the DOM small.
- AI results cached; embeddings computed once per message.
- Stateless server; Postgres + worker scale independently.
