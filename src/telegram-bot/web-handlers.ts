// =============================================================================
// src/telegram-bot/web-handlers.ts: the bot's two web addresses (thin slice 1)
//
// What it does: [2026-11-11] the code behind the two thin files in api/:
//   - createWebhookHandler: Telegram's doorway (POST /api/telegram-bot). Refuses
//     any request without our secret (rule 5.9), then hands the update to
//     handle-update.ts. It answers Telegram "received" (200) for every real
//     update, even one we ignore, or Telegram would keep resending it.
//   - createNudgeHandler: the daily nudge (GET on the same address), started
//     by Vercel's alarm (a "cron job"), which sends our cron secret.
// Why it is separate from api/: the tests run these exact handlers with a
// pretend Telegram and database.
// =============================================================================

import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { runDailyNudge } from "./daily-nudge.js";
import { handleUpdate, type BotDeps } from "./handle-update.js";
import { parseUpdate } from "./updates.js";
import { logFailure } from "./log-failure.js"; // [2026-11-12] no personal values in logs (P2)

// Compare two secrets in a way that doesn't leak, through timing, how much of a guess was right.
function sameSecret(given: string | undefined, expected: string): boolean {
  if (!given || expected === "") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function reply(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export function createWebhookHandler(opts: { webhookSecret: string; makeDeps: () => BotDeps }) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== "POST") return reply(res, 405, { ok: false });
    // Rule 5.9: Telegram sends our secret in this header; anyone else is refused.
    const given = req.headers["x-telegram-bot-api-secret-token"];
    if (!sameSecret(typeof given === "string" ? given : undefined, opts.webhookSecret)) {
      return reply(res, 401, { ok: false });
    }
    let body: unknown = null;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return reply(res, 200, { ok: true }); // not JSON: nothing we can act on
    }
    try {
      await handleUpdate(parseUpdate(body), opts.makeDeps());
    } catch (error) {
      // Logged, then still "received": retrying a broken update for hours helps no one.
      logFailure("Handling a Telegram update failed", error);
    }
    reply(res, 200, { ok: true });
  };
}

export function createNudgeHandler(opts: { cronSecret: string; makeDeps: () => BotDeps }) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    // Vercel's alarm sends "Authorization: Bearer <CRON_SECRET>"; anyone else is refused.
    const auth = req.headers.authorization;
    const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!sameSecret(token, opts.cronSecret)) return reply(res, 401, { ok: false });
    const result = await runDailyNudge(opts.makeDeps());
    // A failure shows as a failure (rule 1.3): Vercel marks the run red.
    reply(res, result.failed > 0 ? 500 : 200, result);
  };
}
