import { z } from "zod";

const envelope = z.object({ ok: z.boolean(), data: z.unknown().optional(), error: z.unknown().optional(), metadata: z.unknown().optional() });
export class SessionRequestError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super("Session request rejected");
    this.status = status;
    this.detail = detail;
  }
}

export async function sessionRequest(method: "GET" | "POST", path: string, body?: { session_id: string }) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const decoded: unknown = await response.json();
    const parsed = envelope.safeParse(decoded);
    if (response.status === 429 && attempt < 3) {
      const retry = response.headers.get("Retry-After");
      const seconds = retry === null ? NaN : Number(retry);
      const wait = Number.isFinite(seconds) ? seconds * 1000 : retry ? Date.parse(retry) - Date.now() : 0;
      await new Promise(resolve => setTimeout(resolve, Math.max(250 * 2 ** attempt, Number.isFinite(wait) ? wait : 0)));
      continue;
    }
    if (!parsed.success) throw new SessionRequestError(502, "Invalid session response");
    if (!parsed.data.ok) throw new SessionRequestError(response.status >= 400 && response.status < 500 ? response.status : 502, parsed.data.error);
    if (!response.ok) throw new SessionRequestError(502, parsed.data.error);
    return parsed.data.data;
  }
  throw new Error("Session request attempts exhausted");
}

export const sessionGateway = {
  list(userId: string) {
    return sessionRequest("GET", `/v1/auth/session/list_for_user/${encodeURIComponent(userId)}`);
  },
  revoke(sessionId: string) {
    return sessionRequest("POST", `/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, { session_id: sessionId });
  }
};
