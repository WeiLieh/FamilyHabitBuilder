// =============================================================================
// src/telegram-bot/daily-nudge.ts: the one fixed nudge at 7:00 pm (thin slice 1)
//
// What it does: [2026-11-11] runs once a day (Vercel's alarm, see
// web-handlers.ts). It sends every parent who agreed and isn't paused the
// fixed nudge "Showing affection" with one example and two buttons, then
// records it as sent. It returns a count: sent, failed, skipped.
//
// Why "send first, record after": a nudge is recorded only once Telegram has
// really delivered it. A failed send is counted as a failure, never as sent
// (rule 1.3), and one parent's failure doesn't stop the others.
// Running it twice in one evening sends nothing new: anyone already recorded
// is skipped, and the database refuses a second nudge per day and slot (rule 8.6).
// =============================================================================

import { toSgt } from "../sgt.js";
import { THIN_SLICE_NUDGE } from "../settings.js";
import type { BotDeps } from "./handle-update.js";
import { WORDS } from "./words.js";

export type NudgeRunResult = { sent: number; failed: number; skipped: number };

export async function runDailyNudge({ store, telegram, now }: BotDeps): Promise<NudgeRunResult> {
  const day = toSgt(now).date;
  const slot = THIN_SLICE_NUDGE.slotMinute;
  const nudge = await store.fixedNudge(day);
  const result: NudgeRunResult = { sent: 0, failed: 0, skipped: 0 };

  for (const c of await store.nudgeCandidates(day, slot)) {
    // Only parents who agreed and aren't paused (the one Pause switch, rule 3.12).
    if (c.paused || c.recordingConsent !== "agreed") continue;
    if (c.alreadySent) {
      result.skipped++;
      continue;
    }
    try {
      await telegram.sendMessage(c.telegramId, WORDS.nudge(nudge.name, nudge.example), [
        { text: WORDS.doneButton, data: `done:${day}` },
        { text: WORDS.notTodayButton, data: `skip:${day}` },
      ]);
      await store.recordNudgeSent({ parentId: c.parentId, nudgeId: nudge.nudgeId, exampleId: nudge.exampleId, day, slotMinute: slot });
      result.sent++;
    } catch (error) {
      // Logged with the parent's number only, never their name or Telegram ID.
      console.error(`Daily nudge failed for parent ${c.parentId}:`, error instanceof Error ? error.message : error);
      result.failed++;
    }
  }
  return result;
}
