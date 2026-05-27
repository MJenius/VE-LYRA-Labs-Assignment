import type { TableSession } from "@/lib/domain/types";

/**
 * Generate a mock session for GitHub Pages static deployment
 * where API routes cannot execute. Uses localStorage for persistence.
 */
export function createMockSession(tableId: string, displayName: string): TableSession {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  return {
    id: `session-${tableId}-${Date.now()}`,
    tableId,
    status: "active",
    preferences: {
      language: "english",
      groupSize: 1
    },
    conversationSummary: `Session for ${displayName} at table ${tableId}`,
    createdAt: now,
    expiresAt,
    activeUsers: [displayName]
  };
}

/**
 * Load or create a session from localStorage
 */
export function getOrCreateSessionFromStorage(tableId: string, displayName: string): TableSession {
  const storageKey = `session-${tableId}`;

  // Try to load existing session from localStorage
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const session = JSON.parse(stored) as TableSession;
      // Add user if not already there
      if (!session.activeUsers.includes(displayName)) {
        session.activeUsers.push(displayName);
      }
      return session;
    } catch {
      // Invalid stored data, create new
    }
  }

  // Create new session and store it
  const session = createMockSession(tableId, displayName);
  localStorage.setItem(storageKey, JSON.stringify(session));
  return session;
}

/**
 * Save session updates to localStorage
 */
export function updateSessionStorage(tableId: string, session: TableSession): void {
  const storageKey = `session-${tableId}`;
  localStorage.setItem(storageKey, JSON.stringify(session));
}
