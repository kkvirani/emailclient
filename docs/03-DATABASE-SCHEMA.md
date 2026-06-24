# Database Schema

PostgreSQL + pgvector, managed by Prisma. This document is the conceptual model;
the source of truth is `prisma/schema.prisma`.

## Entity overview

```
User 1───* Account 1───* Folder
                 │           │
                 │           *
                 1───────────* Message *───* MessageLabel *───1 Label
                 │           ▲      │
                 │           │      1───* Attachment
                 │           │      │
                 │           │      1───1 MessageBody (html/text)
                 │           │      │
                 │           │      1───1 MessageEmbedding (vector)
                 │           │      │
                 │           │      *───* MessageTag *───1 Tag
                 │           │
Thread 1─────────┼───────────* Message
                 │
Sender 1─────────* Message   (denormalized sender stats live in Subscription)
                 │
Account 1───* Subscription   (unsubscribe center: grouped senders)
Account 1───* Rule 1───* RuleCondition / RuleAction
User    1───* SmartView
User    1───* AuditLog
Account 1───1 OAuthToken (encrypted)  |  ImapCredential (encrypted)
Account 1───* SyncState
```

## Core tables

### User
Single user, but modeled properly for auth.
- id, email, name, image, createdAt, settings (jsonb: theme, density, shortcuts).

### Account (connected mailbox)
- id, userId, provider (`gmail|outlook|imap`), emailAddress, displayName,
  status (`active|error|disconnected`), color, isUnifiedDefault, createdAt.

### OAuthToken / ImapCredential
- Encrypted blobs (AES-256-GCM): ciphertext, iv, authTag, keyVersion.
- OAuth: accessToken, refreshToken, expiresAt, scope.
- IMAP: host, port, secure, username, password (encrypted), smtpHost/port.

### Folder
- id, accountId, providerFolderId, name, type
  (`inbox|sent|drafts|archive|spam|trash|custom`), parentId, unreadCount, totalCount.

### Thread
- id, accountId, subject, lastMessageAt, messageCount, snippet,
  hasUnread, isStarred, participants (jsonb).

### Message (canonical)
- id, accountId, threadId, providerMessageId (unique per account), folderId,
  fromName, fromEmail, to/cc/bcc (jsonb), subject, snippet, sentAt, receivedAt,
  isRead, isStarred, isImportant, hasAttachments, sizeBytes,
  listUnsubscribe (text), listUnsubscribePost (text),
  category (enum, AI), categoryConfidence (float),
  searchVector (tsvector, generated), createdAt, updatedAt.
- Indexes: (accountId, folderId, receivedAt desc), (accountId, isRead),
  (accountId, fromEmail), GIN(searchVector).

### MessageBody
- messageId (1:1), html, text. Stored separately to keep list queries lean.

### Attachment
- id, messageId, filename, mimeType, sizeBytes, providerAttachmentId, contentId.

### MessageEmbedding
- messageId (1:1), embedding `vector(1536)`, model, createdAt.
- ivfflat/hnsw index for ANN search.

### Label  /  MessageLabel
- Label: id, accountId, providerLabelId, name, color, type (`system|user`).
- MessageLabel: messageId, labelId (composite PK).

### Tag / MessageTag
- App-level tags (provider-independent), many-to-many with messages.

### Subscription (unsubscribe center)
- id, accountId, senderEmail, senderDomain, senderName,
  messageCount, lastReceivedAt, firstReceivedAt, estMonthlyVolume (float),
  isNewsletter (bool), confidence (float),
  unsubscribeUrl, unsubscribeMailto, supportsOneClick (bool),
  status (`active|unsubscribed|blocked|failed`),
  postUnsubscribeAction (`none|archive|delete|label`), labelId.

### Rule / RuleCondition / RuleAction
- Rule: id, accountId, name, enabled, matchType (`all|any`), order, createdAt.
- RuleCondition: ruleId, field (`from|to|subject|body|hasAttachment|listId|...`),
  operator (`contains|equals|matches|gt|lt`), value.
- RuleAction: ruleId, type (`move|archive|delete|label|tag|markImportant|markRead`),
  value (folderId/labelId/tagId/etc).

### SmartView
- id, userId, name, icon, query (jsonb: structured filter), order, isSystem.

### SyncState
- id, accountId, folderId, provider cursor (historyId/deltaLink/uidValidity+modSeq),
  lastSyncedAt, status, error.

### AuditLog
- id, userId, action, target (jsonb), result, ip, userAgent, createdAt.

## Enums
- `Provider = gmail | outlook | imap`
- `FolderType = inbox | sent | drafts | archive | spam | trash | custom`
- `Category = personal | work | newsletter | receipt | invoice | finance | travel | social | promotion | spam | other`
- `SubscriptionStatus = active | unsubscribed | blocked | failed`
- `RuleActionType = move | archive | delete | label | tag | mark_important | mark_read`

## Indexing & performance
- Composite indexes on hot list paths (folder + receivedAt).
- GIN index on `searchVector` for full-text.
- pgvector index on `MessageEmbedding.embedding`.
- Partial index on `isRead = false` for unread counts.

## Encryption
Credentials stored only as ciphertext. Decryption happens in-memory on the server
when contacting a provider, never persisted in plaintext, never sent to the client.
