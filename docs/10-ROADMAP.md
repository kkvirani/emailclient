# Development Roadmap

Each phase ships: decisions explained, code, tests, migrations, documentation.

## Phase 1 — Foundation architecture  ← (this session)
- Architecture docs (this folder).
- Next.js + TS + Tailwind + shadcn scaffold.
- Design system: tokens, theme provider, dark/light, layout primitives, app shell.
- Prisma schema + docker-compose (Postgres + pgvector) + `.env.example`.
- Auth.js skeleton + crypto token-vault module.
- Query/Zustand providers wired; command palette skeleton.
- README with setup. Verify app boots.

**Exit criteria:** `npm run dev` serves a themed app shell; `prisma validate` passes;
Postgres container runs.

## Phase 2 — Authentication & account connections
- Auth.js sign-in (single user).
- Gmail OAuth + Microsoft OAuth flows; IMAP connect form (tested).
- Encrypted token storage; account list + disconnect.
- Tests: crypto round-trip, OAuth callback handling (mocked), IMAP validation.

## Phase 3 — Email synchronization
- Provider adapters (Gmail, Graph, IMAP) + normalizer.
- Bootstrap + incremental sync; SyncState; body fetch-on-open.
- Folder/label mapping; thread alignment.
- Tests: normalizer, idempotent upsert, delta application.

## Phase 4 — Core inbox UI
- Virtualized MessageList, MessageRow, Split reading pane, ThreadView, Composer.
- Read/star/archive/delete/move with optimistic updates.
- Keyboard shortcuts + cheat sheet; command palette go-to/search.
- Tests: optimistic mutation reducers, keyboard registry, list rendering.

## Phase 5 — Bulk management system
- Selection model (ids + select-all-across-pages descriptor).
- BulkActionBar; bulk endpoint + job runner; progress + reconciliation.
- Tests: selection logic, bulk action job, optimistic + rollback.

## Phase 6 — Advanced unsubscribe center
- Subscription aggregation; newsletter/promo detection + confidence score.
- List-Unsubscribe (RFC 2369) + One-Click (RFC 8058) + safe link handling.
- One-click + bulk unsubscribe; post-action (archive/delete/label); future blocking via rules.
- Tests: detection scoring, header parsing, execution method selection.

## Phase 7 — AI features
- AiService + OpenAI; categorization pipeline (heuristics + LLM).
- Summaries, action items, reply generation (streamed), folder suggestions.
- Embeddings + semantic + NL search.
- Cleanup assistant suggestions.
- Tests: schema validation, NL→filter parsing, search ranking (fixtures).

## Phase 8 — Analytics dashboard
- Overview metrics, top senders, storage, response time, subscription trends.
- Charts + cleanup opportunities.
- Tests: aggregation queries.

## Phase 9 — Optimization & polish
- Performance pass (indexes, query budgets, virtualization tuning, bundle).
- Accessibility audit; animation polish; reduced-motion.
- Security review (CSRF, audit log coverage, token handling), rate limits.
- E2E smoke tests; docs finalization.

## Cross-cutting (every phase)
- Type safety end-to-end (Zod at boundaries).
- Unit/integration tests with Vitest; component tests where valuable.
- Migrations committed with the feature.
- Update relevant doc(s) in `docs/`.
