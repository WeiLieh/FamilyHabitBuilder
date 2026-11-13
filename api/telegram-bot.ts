// =============================================================================
// api/telegram-bot.ts: the bot's one web address, /api/telegram-bot (thin slice 1)
//
// What it does: [2026-11-11] a thin file (rule S3: files in api/ are named
// after a module). The same address serves two callers, told apart by the kind
// of request:
//   - POST: Telegram delivering a message or a button tap (the "webhook").
//     Refused without our webhook secret (rule 5.9).
//   - GET: [2026-11-13] the alarm run every 10 minutes, called by Supabase
//     Cron with our CRON_SECRET (pull request 3c; Vercel's 7:00 pm alarm is removed).
// The real work is in src/telegram-bot/web-handlers.ts. If a secret is missing
// in Vercel's settings, every request is refused rather than run
// half-configured (rule 1.3).
// =============================================================================

import type { IncomingMessage, ServerResponse } from "node:http";
import { createSupabaseStore } from "../src/datastore/supabase-store.js";
import { createTelegramApi } from "../src/telegram-bot/telegram-api.js";
import { createSchedulerHandler, createWebhookHandler } from "../src/telegram-bot/web-handlers.js";

const env = process.env;
const configured = Boolean(
  env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET && env.CRON_SECRET && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
);

// A fresh connection to Supabase and Telegram, and the current time, for each request.
const makeDeps = () => ({
  store: createSupabaseStore(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!),
  telegram: createTelegramApi(env.TELEGRAM_BOT_TOKEN!),
  now: new Date(),
});

const webhook = createWebhookHandler({ webhookSecret: env.TELEGRAM_WEBHOOK_SECRET ?? "", makeDeps });
const alarm = createSchedulerHandler({ cronSecret: env.CRON_SECRET ?? "", makeDeps });

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!configured) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Not configured: a secret is missing in Vercel" }));
    return;
  }
  // GET = the alarm (Supabase Cron); anything else goes to the webhook (which accepts only POST).
  if (req.method === "GET") return alarm(req, res);
  return webhook(req, res);
}
