# Email Sync Architecture

Goal: keep a local Postgres mirror of each mailbox that is fast to query, correct,
idempotent, resumable, and respectful of provider limits.

## Principles
- **Local-first reads**: the UI reads from our DB, never directly from providers.
- **Idempotent upserts**: keyed by `(accountId, providerMessageId)`.
- **Incremental**: use each provider's native delta mechanism.
- **Resumable**: cursors persisted in `SyncState`; crashes resume cleanly.
- **Backpressure**: batch + rate-limit + exponential backoff.

## Phases of a sync
1. **Bootstrap (initial full sync)**
   - Enumerate folders/labels.
   - Page through message metadata (ids + headers) newest-first.
   - Insert message rows + bodies lazily (fetch body on open or in background batches).
2. **Incremental sync**
   - Pull deltas since last cursor; apply create/update/delete.
3. **Realtime-ish**
   - Gmail: push via Pub/Sub (later) or short-interval polling.
   - Graph: subscriptions/webhooks (later) or delta polling.
   - IMAP: IDLE where supported, else polling.

## Provider specifics

### Gmail API
- `users.history.list` with `startHistoryId` for deltas.
- `users.messages.list` for bootstrap; `messages.get` (format=metadata then full) batched.
- Labels map to our Folder/Label model (INBOX, SENT, etc. → folder types).
- Store `historyId` in `SyncState`.

### Microsoft Graph
- `/me/mailFolders/{id}/messages/delta` per folder; persist `@odata.deltaLink`.
- Use `$select` to fetch only needed fields; fetch body on demand.

### IMAP (custom)
- `UIDVALIDITY` + `UID` for stable identity; `MODSEQ` (CONDSTORE/QRESYNC) for deltas.
- `FETCH` headers/envelope for lists; fetch `BODY[]` on open.
- SMTP for sending.

## Normalization
Each adapter maps raw payloads → `NormalizedMessage`:
```
{ providerMessageId, threadId, from, to, cc, bcc, subject, snippet,
  sentAt, receivedAt, flags{read,starred,important}, folderRef, labels[],
  headers{ listUnsubscribe, listUnsubscribePost, listId, messageId },
  hasAttachments, sizeBytes }
```
Threads are derived/aligned by provider thread id (Gmail) or References/In-Reply-To
(IMAP/Graph fallback).

## Write-back (actions → provider)
User actions update our DB optimistically, then a writer reconciles with the provider:
- archive/read/star/move/delete map to provider modify calls.
- Conflicts resolved provider-wins on next delta.
- Failed writes retried; surfaced via job status.

## Jobs & scheduling
- Phase 1: route-handler-triggered + cron-style interval (per account).
- Later: durable queue (pg-boss on Postgres) with job types:
  `sync.bootstrap`, `sync.delta`, `message.fetchBody`, `ai.categorize`,
  `ai.embed`, `bulk.apply`, `unsubscribe.execute`, `rules.run`.
- Concurrency caps + per-provider rate limiters.

## Failure handling
- Token refresh on 401; re-auth prompt if refresh fails.
- Exponential backoff on 429/5xx.
- Partial-progress checkpointing so reruns don't duplicate work.
- `SyncState.status` + `error` surfaced in Settings → Accounts.

## Post-sync processing pipeline
For each new message: rules engine → AI categorize (batched) → embed (batched) →
subscription aggregation update → counts refresh.
