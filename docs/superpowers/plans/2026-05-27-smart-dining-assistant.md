# Smart Dining Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, demo-ready AI-first smart dining assistant with multi-agent routing, RAG recommendations, shared cart state, OTP checkout, docs, and tests.

**Architecture:** The app uses Next.js App Router for the UI and API routes. Server modules expose typed services for session/cart/order state, an in-memory demo repository shaped like Redis/PostgreSQL adapters, deterministic local embeddings for RAG, and a Router-Orchestrator that dispatches to specialist agents. The frontend is chat-first, with a menu rail, shared cart, real-time cross-tab updates, and checkout modal.

**Tech Stack:** Next.js, React, TypeScript, Vitest, CSS modules/global CSS, in-memory demo services, PostgreSQL/Redis/pgvector production schema documentation.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [x] Define scripts for `dev`, `build`, `test`, and `typecheck`.
- [x] Configure TypeScript strict mode and `@/*` path alias.
- [x] Add App Router layout and global design tokens.

### Task 2: Domain, Data, and RAG

**Files:**
- Create: `lib/domain/types.ts`
- Create: `lib/data/menu.ts`
- Create: `lib/data/store.ts`
- Create: `lib/ai/embeddings.ts`
- Create: `lib/ai/nlu.ts`
- Create: `lib/ai/rag.ts`
- Test: `tests/rag.test.ts`

- [x] Seed a realistic menu with categories, tags, allergens, popularity, calories, and complement links.
- [x] Implement deterministic local embeddings so the demo works without API keys.
- [x] Implement top-k semantic retrieval with hard filters for allergens, availability, and cart exclusions.

### Task 3: Services and Agents

**Files:**
- Create: `lib/services/session.ts`
- Create: `lib/services/cart.ts`
- Create: `lib/services/otp.ts`
- Create: `lib/services/order.ts`
- Create: `lib/ai/agents/greeter.ts`
- Create: `lib/ai/agents/recommendation.ts`
- Create: `lib/ai/agents/upsell.ts`
- Create: `lib/ai/agents/memory.ts`
- Create: `lib/ai/agents/group-coordinator.ts`
- Create: `lib/ai/agents/order-validation.ts`
- Create: `lib/ai/orchestrator.ts`
- Test: `tests/cart.test.ts`
- Test: `tests/orchestrator.test.ts`
- Test: `tests/checkout.test.ts`

- [x] Implement table sessions with TTL-shaped metadata.
- [x] Implement shared cart mutations, tax totals, ownership, and cart snapshots.
- [x] Implement mock OTP and order validation.
- [x] Implement agent separation and route traces.

### Task 4: API Routes

**Files:**
- Create: `app/api/table/[tableId]/session/route.ts`
- Create: `app/api/menu/route.ts`
- Create: `app/api/menu/search/route.ts`
- Create: `app/api/session/[sessionId]/ai/chat/route.ts`
- Create: `app/api/session/[sessionId]/ai/stream/route.ts`
- Create: `app/api/session/[sessionId]/cart/route.ts`
- Create: `app/api/session/[sessionId]/cart/[cartItemId]/route.ts`
- Create: `app/api/otp/send/route.ts`
- Create: `app/api/otp/verify/route.ts`
- Create: `app/api/session/[sessionId]/order/route.ts`

- [x] Expose JSON APIs matching the PRD.
- [x] Return structured AI responses, carts, OTP results, and order status.
- [x] Add an SSE endpoint for streamed assistant text in compatible clients.

### Task 5: Frontend Experience

**Files:**
- Create: `app/page.tsx`
- Create: `app/table/[tableId]/page.tsx`
- Create: `components/SmartDiningApp.tsx`
- Create: `components/ChatPanel.tsx`
- Create: `components/MenuGrid.tsx`
- Create: `components/SharedCart.tsx`
- Create: `components/CheckoutModal.tsx`
- Create: `public/food/*.png`

- [x] Build the usable app as the first screen.
- [x] Support chat-first ordering, quick chips, recommendation cards, menu search, shared cart, and checkout.
- [x] Use BroadcastChannel/localStorage events for multi-tab demo sync while preserving a WebSocket-ready event model.

### Task 6: Documentation and Verification

**Files:**
- Create: `README.md`
- Create: `docs/PRD.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `prisma/schema.prisma`
- Create: `docker-compose.yml`

- [x] Document the assignment-grade PRD and production-quality README.
- [x] Include Mermaid architecture diagrams, setup, agent design, RAG design, tradeoffs, and future work.
- [x] Run `npm install`, `npm test`, `npm run typecheck`, and `npm run build`.
