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
import { logFailure } from "./log-failure.js"; // [2026-11-12] no personal values in logs (P2)

export type NudgeRunResult = { sent: number; failed: number; skipped: number };

export async function runDailyNudge({ store, telegram, now }: BotDeps): Promise<NudgeRunResult> {
  // [2026-11-12] TEMPORARY home (owner's decision D4): the sign-up clean-up runs
  // with this daily job, so "We'll keep your answers for 7 days" is true from
  // day one. It moves to the every-30-minutes scheduler in pull request 3. A
  // failure is logged and the nudges still go out.
  try {
    await store.cleanUpSignUps();
  } catch (error) {
    logFailure("The sign-up clean-up failed", error);
  }
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
    let messageId: number;
    try {
      messageId = await telegram.sendMessage(c.telegramId, WORDS.nudge(nudge.name, nudge.example), [
        { text: WORDS.doneButton, data: `done:${day}` },
        { text: WORDS.notTodayButton, data: `skip:${day}` },
      ]);
    } catch (error) {
      // Logged with the parent's number only, never their name or Telegram ID.
      logFailure(`Daily nudge not sent to parent ${c.parentId}`, error);
      result.failed++;
      continue;
    }
    try {
      await store.recordNudgeSent({ parentId: c.parentId, nudgeId: nudge.nudgeId, exampleId: nudge.exampleId, day, slotMinute: slot });
      result.sent++;
    } catch (error) {
      // Sent but not recorded: its buttons could never save, so say so honestly
      // and remove them (rule 1.3), rather than leave buttons that fail later.
      logFailure(`Daily nudge sent but not recorded for parent ${c.parentId}`, error);
      result.failed++;
      await telegram.editMessage(c.telegramId, messageId, WORDS.nudgeNotSaved).catch(() => undefined);
    }
  }
  return result;
}
