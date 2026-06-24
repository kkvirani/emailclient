# State Management Plan

Two clearly separated kinds of state:

## 1. Server state — TanStack Query
Anything that originates on the server (messages, threads, folders, counts,
subscriptions, rules, analytics). Source of truth = server; Query caches it.

### Query key conventions (`lib/query/keys.ts`)
```
qk.me()
qk.accounts()
qk.folders(accountId)
qk.messages(filter)            // filter object is part of the key
qk.message(id)
qk.thread(id)
qk.subscriptions(filter)
qk.rules()
qk.views()
qk.analytics(metric)
qk.job(id)
```

### Patterns
- **Infinite queries** for message/subscription lists (cursor pagination).
- **Optimistic updates** for read/star/archive/delete/move and bulk actions:
  - `onMutate`: snapshot, apply optimistic change to caches.
  - `onError`: rollback to snapshot.
  - `onSettled`: invalidate affected keys.
- **Bulk select-all-across-pages**: store a *query descriptor* (not 10k ids) in
  Zustand; send the descriptor to `/api/messages/bulk`; optimistically mark cached
  pages, then reconcile from the job result.
- **Background sync**: poll `sync/status`; on new data, invalidate lists.
- Sensible `staleTime` (lists 30s, counts 15s, analytics 5m); `refetchOnWindowFocus`.

## 2. Client/UI state — Zustand
Ephemeral, device-local UI concerns. Never the source of truth for data.

### Stores (`src/stores`)
- `selectionStore`
  ```ts
  {
    mode: 'none' | 'some' | 'allMatching',
    ids: Set<string>,
    excludeIds: Set<string>,
    queryDescriptor: MessageFilter | null,
    count: number,
    toggle(id), selectRange(a,b), selectAllMatching(filter,total), clear()
  }
  ```
- `paletteStore` — open, mode, query.
- `uiStore` — sidebar collapsed, reading-pane layout, density, focused pane,
  composer open/minimized, AI panel open.
- `themeStore` — handled via `next-themes`; tokens read from CSS variables.

### Why split this way
- Selection of thousands must be O(1) to toggle and must survive scrolling/refetch
  → lives in Zustand as a set/descriptor, decoupled from the virtualized list.
- TanStack Query handles caching/invalidation/optimism for server data; Zustand
  handles fast, local interactions without re-fetch churn.

## 3. Forms — React Hook Form + Zod
- Composer, IMAP connect, rule builder, settings.
- Zod schemas shared with server validation (`lib/validation`).

## 4. URL state
- Current folder/view, search query, selected thread reflected in the URL for
  deep-linking and back/forward. Filters serialized to query params.

## 5. Data flow example (bulk archive of a filtered selection)
1. User clicks "Select all 3,412 in Promotions" → `selectionStore.selectAllMatching`.
2. User hits Archive → mutation sends `{ selection: { query, excludeIds }, action }`.
3. `onMutate` optimistically marks cached rows archived; BulkActionBar shows progress.
4. Server enqueues job, returns jobId; client polls `qk.job(id)`.
5. On done → invalidate `qk.messages(*)` + folder counts; clear selection.
6. On error → rollback caches, toast with retry.
