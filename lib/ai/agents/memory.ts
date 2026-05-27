import type { NluResult, UserPreferences } from "@/lib/domain/types";
import { updateSessionPreferences } from "@/lib/services/session";

export function persistContextMemory(sessionId: string, nlu: NluResult): UserPreferences {
  return updateSessionPreferences(sessionId, nlu.preferences).preferences;
}
