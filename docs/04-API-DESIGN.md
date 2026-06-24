# API Design

Conventions:
- JSON over HTTPS. Auth via session cookie. Mutations require CSRF token.
- All inputs validated with Zod. Errors: `{ error: { code, message, details? } }`.
- Pagination: cursor-based `?cursor=&limit=` returning `{ items, nextCursor }`.
- Single-user: every handler asserts the session user owns the resource.

## Auth
- `GET  /api/auth/[...nextauth]`        Auth.js routes (sign in/out, callback).
- `GET  /api/me`                        Current user + settings.
- `PATCH /api/me/settings`              Update theme/density/shortcuts.

## Accounts
- `GET    /api/accounts`                List connected accounts.
- `POST   /api/accounts/oauth/:provider/start`  Begin OAuth (gmail|outlook).
- `GET    /api/accounts/oauth/:provider/callback`
- `POST   /api/accounts/imap`           Connect IMAP (validated, test connection).
- `DELETE /api/accounts/:id`            Disconnect + purge tokens.
- `POST   /api/accounts/:id/sync`       Trigger sync.
- `GET    /api/accounts/:id/sync/status`

## Folders & labels
- `GET  /api/accounts/:id/folders`
- `GET  /api/labels`                    Across accounts.
- `POST /api/labels` / `PATCH` / `DELETE`

## Messages (unified + per-account)
- `GET  /api/messages`                  Query: accountId?, folder?, view?, q?,
                                         category?, isRead?, cursor, limit.
- `GET  /api/messages/:id`              Full message + body + attachments.
- `GET  /api/threads/:id`               Thread with ordered messages.
- `PATCH /api/messages/:id`             { isRead?, isStarred?, isImportant?, folderId? }
- `POST /api/messages/:id/move`         { folderId }
- `POST /api/messages/:id/archive`
- `DELETE /api/messages/:id`            Move to trash (or permanent with ?hard=1).

## Bulk actions (scale to thousands)
- `POST /api/messages/bulk`
  ```jsonc
  {
    "selection": {                 // either explicit ids OR a query (select-all)
      "ids": ["..."],              // optional
      "query": { "folder": "inbox", "category": "promotion", "q": "..." },
      "excludeIds": ["..."]        // for "select all except"
    },
    "action": { "type": "archive|delete|markRead|markUnread|move|tag|star|unstar|label",
                "value": { "folderId": "...", "tagId": "...", "labelId": "..." } }
  }
  ```
  Returns a job id; UI applies optimistic update and polls `/api/jobs/:id`.

## Compose / send / drafts
- `POST  /api/drafts`  /  `PATCH /api/drafts/:id`  /  `DELETE /api/drafts/:id`
- `POST  /api/send`                    { draftId | inline message }
- `POST  /api/messages/:id/reply`      { body, replyAll? }
- `POST  /api/messages/:id/forward`    { to, body }

## Search
- `GET  /api/search?q=...&mode=fulltext|semantic|nl&...filters`
  - `fulltext`: Postgres tsvector ranking.
  - `semantic`: embed query → pgvector ANN.
  - `nl`: LLM parses query → structured filter + optional semantic.

## Unsubscribe center
- `GET  /api/subscriptions`            Grouped senders + stats + confidence.
- `POST /api/subscriptions/:id/unsubscribe`   { method? }
- `POST /api/subscriptions/bulk-unsubscribe`  { ids[], postAction? }
- `PATCH /api/subscriptions/:id`       { postUnsubscribeAction, labelId, status }

## Rules engine
- `GET/POST /api/rules`  `PATCH/DELETE /api/rules/:id`
- `POST /api/rules/:id/run`            Apply to existing matching mail.
- `POST /api/rules/test`               Dry-run against a sample.

## Smart views & cleanup
- `GET/POST /api/views`  `PATCH/DELETE /api/views/:id`
- `GET  /api/cleanup/suggestions`      Returns suggestions + estimated savings.
- `POST /api/cleanup/apply`            { suggestionId }

## AI
- `POST /api/ai/categorize`            { messageIds[] } (usually internal/batch).
- `POST /api/ai/summarize`             { threadId | inbox }
- `POST /api/ai/reply`                 { messageId, tone?, length? }
- `POST /api/ai/action-items`          { threadId }
- `POST /api/ai/suggest-folder`        { messageId }

## Analytics
- `GET  /api/analytics/overview`       Inbox size, unread, newsletters, storage.
- `GET  /api/analytics/top-senders`
- `GET  /api/analytics/response-time`
- `GET  /api/analytics/subscription-trends`

## Jobs
- `GET  /api/jobs/:id`                 Status/progress for bulk + sync + AI batches.

## Error codes
`UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION, PROVIDER_ERROR,
RATE_LIMITED, CONFLICT, INTERNAL`.
