// =============================================================================
// api/web-app.ts: the Web app's one web address, /api/web-app
//
// What it does: [2026-11-15] a thin file (rule S3: files in api/ are named
// after a module). It reads the request from Vercel, hands it to
// src/web-app/handler.ts and writes the answer back. It uses only the public
// key and the pass-signing secret, never the master key (rule 9.8, test W9).
// If a setting is missing in Vercel, every request is refused rather than run
// half-configured (rule 1.3).
// =============================================================================

import type { IncomingMessage, ServerResponse } from "node:http";
import { createWebAppStore } from "../src/datastore/web-app-store.js";
import { createWebAppHandler, WEB_SAFE_HEADERS } from "../src/web-app/handler.js";

const env = process.env;
const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_JWT_SECRET);
// A form from our own pages is tiny; anything bigger is refused.
const MAX_BODY_BYTES = 4096;

const handle = configured
  ? createWebAppHandler({
      db: createWebAppStore(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!),
      jwtSecret: env.SUPABASE_JWT_SECRET!,
      now: () => new Date(),
      // [2026-11-24] Photos load only from our own Supabase project (PH11).
      photoOrigin: new URL(env.SUPABASE_URL!).origin,
    })
  : null;

// Read the request's body as text, up to the limit.
async function readBody(req: IncomingMessage): Promise<string | null> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += piece.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(piece);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // [2026-11-15, privacy review] Even these plain answers carry the safe
  // headers, and say no more than that something didn't work.
  const refuse = (status: number, text: string) => {
    res.statusCode = status;
    for (const [name, value] of Object.entries(WEB_SAFE_HEADERS)) res.setHeader(name, value);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(text);
  };
  if (!handle) {
    console.error("Web app not configured: a setting is missing in Vercel");
    return refuse(500, "Sorry, that didn't work.");
  }
  try {
    const body = await readBody(req);
    if (body === null) return refuse(413, "Too large");
    const headers: Record<string, string | undefined> = {};
    for (const [name, value] of Object.entries(req.headers)) headers[name] = Array.isArray(value) ? value.join(", ") : value;
    const answer = await handle({ method: req.method ?? "GET", url: req.url ?? "/", headers, body });
    res.statusCode = answer.status;
    for (const [name, value] of Object.entries(answer.headers)) res.setHeader(name, value);
    res.end(answer.body);
  } catch {
    // Something unexpected (a broken request): a failure, with no details in the log that could hold a secret.
    console.error("Web app request failed unexpectedly");
    refuse(503, "Sorry, that didn't work.");
  }
}
