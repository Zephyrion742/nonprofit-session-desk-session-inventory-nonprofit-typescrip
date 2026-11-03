import { z } from "zod";

export const signOutBody = z.object({ session_ids: z.array(z.string().min(1)).max(100) }).strict();

export function otherSessions(sessionIds: string[], currentSessionId: string) {
  return Array.from(new Set(sessionIds)).filter(id => id !== currentSessionId);
}
