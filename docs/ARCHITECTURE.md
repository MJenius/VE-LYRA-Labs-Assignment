# Architecture Notes

## Implementation Boundaries

The codebase separates product behavior into small modules:

| Module | Responsibility |
|---|---|
| `lib/ai/nlu.ts` | Language detection, intent classification, preference extraction |
| `lib/ai/rag.ts` | Menu retrieval, hard filters, ranking |
| `lib/ai/agents/*` | Specialist agent behavior |
| `lib/ai/orchestrator.ts` | Router-Orchestrator control flow and agent trace |
| `lib/services/*` | Session, cart, OTP, order business logic |
| `lib/data/store.ts` | In-memory demo repository |
| `app/api/*` | HTTP/SSE boundary |
| `components/*` | Chat-first table UX |

## Production Migration Path

1. Replace `lib/data/store.ts` with repository adapters backed by PostgreSQL and Redis.
2. Replace local embeddings in `lib/ai/embeddings.ts` with `text-embedding-3-small`.
3. Replace `searchMenuSemantically` vector loop with pgvector SQL:

```sql
SELECT menu_item_id, embedding <=> $1 AS distance
FROM menu_embeddings
ORDER BY distance ASC
LIMIT 10;
```

4. Replace BroadcastChannel with a WebSocket server publishing through Redis channels.
5. Replace mock OTP with Twilio Verify or MSG91.

## Latency Design

- NLU is deterministic and local in demo.
- RAG search is in-process and bounded by 24 seeded items.
- Agent responses are short and structured.
- SSE endpoint streams the latest assistant response token-by-token for streaming clients.

## Security Design

- API inputs are validated with Zod.
- Chat messages are capped at 500 characters.
- OTP attempts are capped at 3 and expire after 5 minutes.
- Phone numbers are hashed in order records.
- Agent tools are only called through the orchestrator route.
