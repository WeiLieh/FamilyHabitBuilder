// =============================================================================
// src/telegram-bot/log-failure.ts: writing a failure to the log, without personal values
//
// What it does: [2026-11-12] every failure in the bot is written to Vercel's
// logs (rule 1.3: a failure is shown as a failure, so the owner can find out
// why). The error text comes from Supabase or Telegram, and it can repeat a
// value from the request, such as a Telegram ID or a name. Before the line is
// written, long numbers become [number] and anything in double quotes (how
// databases quote a value they refused) becomes [text]
// (privacy review of the sign-up gap fix, finding P2).
//
// [2026-11-24] Also long codes (20 or more letters, digits, "-" or "_"):
// Telegram's file numbers and a photo's name in our store (test PH10).
//
// Its limit: a name in error text without quotes would still get through; as far
// as we know, Supabase and Telegram don't word their errors that way.
// =============================================================================

// The error's own words, with personal-looking values blanked out, cut to 300 characters.
export function safeErrorText(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/"[^"]*"/g, "[text]") // anything in double quotes, e.g. a refused value
    .replace(/[A-Za-z0-9_-]{20,}/g, "[code]") // [2026-11-24] long codes: Telegram file numbers, a photo's name in storage (PH10)
    .replace(/\d{5,}/g, "[number]") // 5 or more digits: Telegram IDs, phone numbers
    .slice(0, 300);
}

// One line in the log: what we were doing, then the cleaned error text.
export function logFailure(what: string, error: unknown): void {
  console.error(`${what}: ${safeErrorText(error)}`);
}
