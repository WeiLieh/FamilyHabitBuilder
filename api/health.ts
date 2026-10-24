import type { IncomingMessage, ServerResponse } from "node:http";

// GET /api/health: a simple "I'm alive" check for Vercel and for us.
// Uses Node's own request/response types, so the same file runs on Vercel and in tests.
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: true, service: "family-habit-builder" }));
}
