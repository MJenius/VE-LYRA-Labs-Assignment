import { addHours, createId, getDemoStore, nowIso } from "@/lib/data/store";
import type { Message, TableSession, UserPreferences } from "@/lib/domain/types";

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 4);

export function getOrCreateSession(tableId: string): TableSession {
  const store = getDemoStore();
  const existing = [...store.sessions.values()].find(
    (session) =>
      session.tableId === tableId &&
      session.status === "active" &&
      new Date(session.expiresAt).getTime() > Date.now()
  );

  if (existing) return existing;

  const session: TableSession = {
    id: createId("ses"),
    tableId,
    status: "active",
    preferences: {},
    conversationSummary: "",
    createdAt: nowIso(),
    expiresAt: addHours(new Date(), SESSION_TTL_HOURS),
    activeUsers: []
  };

  store.sessions.set(session.id, session);
  store.cartItems.set(session.id, []);
  store.messages.set(session.id, []);
  return session;
}

export function getSession(sessionId: string): TableSession {
  const session = getDemoStore().sessions.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return session;
}

export function updateSessionPreferences(sessionId: string, preferences: UserPreferences): TableSession {
  const store = getDemoStore();
  const session = getSession(sessionId);
  const mergedAllergens = Array.from(
    new Set([...(session.preferences.excludeAllergens ?? []), ...(preferences.excludeAllergens ?? [])])
  );

  const updated: TableSession = {
    ...session,
    preferences: {
      ...session.preferences,
      ...preferences,
      excludeAllergens: mergedAllergens
    }
  };

  store.sessions.set(sessionId, updated);
  return updated;
}

export function markSessionOrdered(sessionId: string): void {
  const store = getDemoStore();
  const session = getSession(sessionId);
  store.sessions.set(sessionId, { ...session, status: "ordered" });
}

export function joinSession(sessionId: string, displayName: string): TableSession {
  const store = getDemoStore();
  const session = getSession(sessionId);
  const activeUsers = Array.from(new Set([...session.activeUsers, displayName]));
  const updated = { ...session, activeUsers };
  store.sessions.set(sessionId, updated);
  return updated;
}

export function appendMessage(message: Omit<Message, "id" | "createdAt">): Message {
  const store = getDemoStore();
  const record: Message = {
    ...message,
    id: createId("msg"),
    createdAt: nowIso()
  };

  store.messages.set(message.sessionId, [...(store.messages.get(message.sessionId) ?? []), record]);
  return record;
}

export function getRecentMessages(sessionId: string, limit = 8): Message[] {
  return (getDemoStore().messages.get(sessionId) ?? []).slice(-limit);
}
