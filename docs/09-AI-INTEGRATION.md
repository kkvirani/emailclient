# AI Integration Plan

All AI runs **server-side** (OpenAI key never reaches the browser). Results are
cached in Postgres so we pay once per message where possible.

## Capabilities → implementation

### 1. Categorization
- Taxonomy: personal, work, newsletter, receipt, invoice, finance, travel, social,
  promotion, spam, other.
- Hybrid approach for cost/latency:
  1. **Heuristics first** (cheap): List-Unsubscribe header → newsletter/promotion;
     known receipt/invoice keywords + sender patterns; calendar/travel domains.
  2. **LLM fallback** for ambiguous mail, batched (many messages per call) using a
     small/cheap model with a strict JSON schema + confidence.
- Store `category` + `categoryConfidence` on Message. Re-run only on demand.

### 2. Inbox & thread summaries
- Thread summary: feed normalized thread (sender, time, trimmed bodies) → model →
  concise summary + key points.
- Inbox summary: cluster unread by category/sender, summarize highlights + suggested
  triage. Computed on request, cached briefly.

### 3. Action item extraction
- Per thread: extract tasks with owner/due hints into structured JSON.

### 4. Reply generation
- Inputs: thread context, desired tone (neutral/friendly/formal), length.
- Output: draft text streamed to the Composer. User edits before sending.
- Premium model for quality here (low volume, high value).

### 5. Folder/label suggestions
- Given a message + existing folders/labels, suggest best destination.

### 6. Cleanup assistant
- Combines DB stats + light AI to propose: archive shipping notifications, delete
  unopened newsletters, remove duplicate promos, delete very old mail. Each
  suggestion carries an estimated count and space saving.

### 7. Semantic / NL search
- **Embeddings**: `text-embedding-3-small` (1536-dim) per message
  (subject + snippet + key body), stored in `MessageEmbedding` (pgvector).
- **Semantic search**: embed query → ANN over embeddings → rank.
- **NL search**: LLM parses "invoices from Amazon last month" into a structured
  filter (sender/date/category) + optional semantic component; combine in one query.

## Cost & performance controls
- Batch classification/embeddings (dozens per request).
- Cache everything in DB; recompute only on explicit user action.
- Tiered models: cheap for bulk classify/embed, premium for compose/summaries.
- Token budgeting: truncate bodies; strip quoted text/signatures before sending.
- Rate-limit + retry with backoff; degrade gracefully (heuristics still work if AI down).

## Prompt & schema discipline
- All structured outputs use JSON schema / function-calling with Zod validation on
  the response. Reject + retry on invalid JSON.
- Prompts versioned in `src/server/services/ai/prompts/` for reproducibility.

## Privacy
- AI calls are opt-in per capability (toggles in Settings → AI).
- Only minimal necessary content sent; no attachments by default.
- Audit log records AI actions (categorize/summarize/reply) without storing prompts
  containing full bodies unless the user enables debug logging.

## Abstraction
`AiService` wraps the provider so the model/vendor can be swapped:
```
AiService.categorize(messages): Classification[]
AiService.summarizeThread(thread): Summary
AiService.generateReply(ctx): AsyncIterable<string>  // streamed
AiService.embed(texts): number[][]
AiService.parseNlQuery(q): StructuredFilter
```
