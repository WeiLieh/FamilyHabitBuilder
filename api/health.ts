// =============================================================================
// api/health.ts: the "health check" web address, GET /api/health
//
// What it does: answers "I'm alive" so we (and Vercel) can confirm the app is
// deployed and running. It reads nothing and changes nothing.
//
// How Vercel uses this file: every file in the api/ folder becomes a web
// address. This one is /api/health. When a request arrives, Vercel calls the
// function below (the "handler") with the request (req) and a blank response
// (res) that we fill in and send back.
// =============================================================================

// "import type" brings in only the *descriptions* (types) of Node's request and
// response objects, so TypeScript can check we use them correctly. Using Node's
// own types (instead of a Vercel-specific library) means this same file also
// runs unchanged inside our tests.
import type { IncomingMessage, ServerResponse } from "node:http";

// "export default" makes this function the main thing this file offers, so
// Vercel (and our test) can find it.
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  // Guard: this address only supports GET (reading). Anything else, such as
  // POST (sending data), is refused with status 405 "Method Not Allowed".
  if (req.method !== "GET") {
    res.statusCode = 405;
    // The "Allow" header tells the caller which method *is* allowed.
    res.setHeader("Allow", "GET");
    // We always reply in JSON (a simple, structured text format).
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return; // Stop here: don't run the "success" code below.
  }

  // Success: status 200 means "OK".
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // "no-store" tells browsers and Vercel not to keep a saved copy, so every
  // health check really reaches the app instead of getting an old answer.
  res.setHeader("Cache-Control", "no-store");
  // JSON.stringify turns the object into JSON text; res.end sends it and
  // finishes the response.
  res.end(JSON.stringify({ ok: true, service: "family-habit-builder" }));
}
