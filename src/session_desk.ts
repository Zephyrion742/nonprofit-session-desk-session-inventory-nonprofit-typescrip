import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { sessionGateway, SessionRequestError } from "./session_gateway.ts";
import { otherSessions, signOutBody } from "./session_policy.ts";

// Run behind a Next.js server route that supplies the authenticated account context.
const userId = process.env.NONPROFIT_USER_ID;
const currentSessionId = process.env.CURRENT_SESSION_ID;
const routeToken = process.env.DESK_ROUTE_TOKEN;
if (!userId || !currentSessionId || !routeToken) throw new Error("Set NONPROFIT_USER_ID, CURRENT_SESSION_ID and DESK_ROUTE_TOKEN");
const context = { userId, currentSessionId, routeToken };

createServer(async (request, response) => {
  const send = (status: number, value: unknown) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(value));
  };
  const supplied = Buffer.from(request.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${context.routeToken}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return send(401, { error: "Authentication required" });
  try {
    if (request.method === "GET" && request.url === "/sessions") {
      return send(200, { currentSessionId: context.currentSessionId, inventory: await sessionGateway.list(context.userId) });
    }
    if (request.method === "POST" && request.url === "/sessions/sign-out-others") {
      let raw = "";
      for await (const chunk of request) {
        raw += chunk.toString();
        if (Buffer.byteLength(raw) > 16384) return send(413, { error: "Request too large" });
      }
      const body = signOutBody.parse(JSON.parse(raw));
      const revoked: string[] = [];
      // Stable session identifiers make each repeated revoke target the same resource.
      for (const id of otherSessions(body.session_ids, context.currentSessionId)) {
        await sessionGateway.revoke(id);
        revoked.push(id);
      }
      return send(200, { kept: context.currentSessionId, revoked });
    }
    send(404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return send(400, { error: "Invalid request body" });
    if (error instanceof SessionRequestError) return send(error.status, { error: error.detail });
    send(502, { error: "Session request could not complete" });
  }
}).listen(3100, "127.0.0.1", () => console.log("Session desk: http://127.0.0.1:3100"));
