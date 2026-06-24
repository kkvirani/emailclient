# Product Requirements Document — "Postal" (working name)

> A premium, single-user, browser-based email client engineered like a $20/month SaaS.

## 1. Vision

Build the best personal email management application: a keyboard-first, AI-augmented
client that unifies Gmail, Outlook, and IMAP accounts, and makes inbox cleanup,
bulk actions, and unsubscribing effortless. The product should feel like a blend of
**Superhuman** (speed + keyboard), **Linear** (polish + structure), **Notion**
(flexible organization), and **Arc** (delight).

## 2. Target user

A single power user (the owner) with one or more mailboxes and tens of thousands of
emails. The user values speed, control, automation, and a beautiful interface.

## 3. Goals & non-goals

### Goals
- Unified inbox across multiple providers.
- Effortless bulk management at scale (10k+ selection).
- Best-in-class unsubscribe center.
- Deep, useful AI: categorization, summaries, replies, cleanup suggestions, semantic search.
- Premium design with dark/light themes and 60fps interactions.
- Secure handling of OAuth tokens and credentials (never exposed to the browser).

### Non-goals (v1)
- Multi-tenant/team features, billing, sharing.
- Mobile native apps (responsive web only).
- Calendar/contacts management beyond what email needs.
- Sending via marketing/bulk infrastructure.

## 4. Personas & primary jobs-to-be-done

| JTBD | Description |
| --- | --- |
| Triage fast | Burn down the inbox with keyboard shortcuts. |
| Clean up | Find and remove clutter (old mail, newsletters, promos). |
| Unsubscribe | Stop unwanted senders in one place, safely. |
| Automate | Set rules so the inbox stays clean. |
| Find anything | Natural-language + semantic search. |
| Understand | AI summaries of threads and the whole inbox. |

## 5. Feature scope (prioritized)

### P0 — Foundation
- App shell, design system, theming, command palette skeleton.
- Account connection (Gmail OAuth, Microsoft Graph OAuth, IMAP).
- Email sync into local Postgres; unified inbox.
- Core mailbox views: Inbox, Sent, Drafts, Archive, Spam, Trash.
- Message list (virtualized), thread reader, compose/reply/forward.
- Keyboard shortcuts + cheat sheet.

### P1 — Power
- Bulk management (select thousands; delete/archive/read/move/tag/star).
- Unsubscribe center (detection, grouping, one-click + bulk, confidence score).
- Labels, tags, custom folders.
- Rules engine with visual builder.
- Smart views (Requires Reply, VIP, Newsletters, Receipts, etc.).

### P2 — Intelligence
- AI categorization pipeline.
- AI inbox assistant (summaries, action items, reply generation, folder suggestions).
- AI cleanup assistant.
- Semantic / natural-language search (pgvector).
- Smart cleanup suggestions with estimated space savings.

### P3 — Insight & polish
- Analytics dashboard (inbox size, unread, newsletters, storage, top senders,
  response time, subscription trends).
- Performance hardening, accessibility audit, animation polish.

## 6. Functional requirements (selected, testable)

- FR-1: User can connect ≥1 Gmail, Outlook, or IMAP account via secure OAuth/credentials.
- FR-2: Connected accounts sync messages into local DB and appear in a unified inbox.
- FR-3: User can select all messages in a view (including across pages) and apply a
  bulk action; UI updates optimistically and reconciles with the server.
- FR-4: Unsubscribe center lists senders grouped with count, last received, and an
  estimated monthly volume; user can unsubscribe one or many.
- FR-5: User can create a rule (IF conditions THEN actions) via a visual builder; new
  mail matching the rule is processed automatically.
- FR-6: AI categorizes incoming mail into the defined taxonomy with a confidence score.
- FR-7: Search returns full-text results < 500ms for the local corpus and supports a
  natural-language mode powered by embeddings.
- FR-8: Command palette can search mail, jump to folders, and run actions.

## 7. Non-functional requirements

- Initial app load < 2s on warm cache.
- Local search < 500ms for 100k messages.
- Smooth 60fps list scrolling via virtualization.
- Security: OAuth best practices, encrypted token storage at rest, CSRF protection,
  secure sessions, audit logging. No secrets in client bundles.
- Accessibility: WCAG 2.1 AA targets; full keyboard operability.
- Reliability: sync is resumable and idempotent.

## 8. Success metrics (personal)

- Time-to-inbox-zero per session.
- Number of subscriptions removed.
- Storage reclaimed.
- Search satisfaction (results found on first query).

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Provider API quotas/limits | Backoff, incremental sync (historyId/CONDSTORE), batching. |
| Unsubscribe links can be malicious | Confidence scoring, prefer List-Unsubscribe-Post (RFC 8058), sandbox/confirm. |
| AI cost | Cache embeddings/classifications; batch; cheaper models for bulk, premium for compose. |
| 100k+ scale in browser | Server-side pagination + virtualization + indexed queries. |
| "Entirely in browser" vs security | Browser UI + secure server backend (Next.js route handlers). |

## 10. Release plan

See `10-ROADMAP.md`. Phased delivery, each phase shipped with code, tests,
migrations, and docs.
