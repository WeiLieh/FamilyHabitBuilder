// =============================================================================
// src/telegram-bot/handle-update.ts: what the bot does with each update (thin slice 1)
//
// What it does: [2026-11-11] decides the bot's response to one update, already
// made sense of by updates.ts:
//   - /start CODE: sign up with the invite, then show the agreement (rules 1.1, 11.9)
//   - "I agree": record the recording agreement, say when the reminder comes
//   - ✅ Done: save today's log from that nudge, show the fixed receipt (rules 5.4, 7.5)
//   - 😴 Not today: record it, show the comforting note (rule 3.5)
//   [2026-11-12] For both, the nudge keeps its words and loses its buttons, and
//   the receipt or note arrives as a new message below it (rule 5.10).
//   - anything else a person sends: "Unrecognised text." (owner, 11 Nov)
// See src/telegram-bot/SPEC.md, "Build: thin slice 1".
//
// Why it takes its helpers as "deps": the tests pass in a pretend Telegram and
// database, and a fixed time, so every situation can be checked exactly.
// =============================================================================

import type { Store } from "../datastore/store.js";
import { toSgt } from "../sgt.js";
import { THIN_SLICE_NUDGE } from "../settings.js";
import type { TelegramApi } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";
import { logFailure } from "./log-failure.js"; // [2026-11-12] no personal values in logs (P2)

export type BotDeps = { store: Store; telegram: TelegramApi; now: Date };

export async function handleUpdate(incoming: Incoming, deps: BotDeps): Promise<void> {
  const { telegram } = deps;
  switch (incoming.kind) {
    case "ignore":
      return; // not a person's message: stay silent
    case "message":
      await telegram.sendMessage(incoming.chatId, WORDS.unrecognised);
      return;
    case "start":
      await handleStart(incoming, deps);
      return;
    case "tap":
      await handleTap(incoming, deps);
      return;
  }
}

async function handleStart(s: Extract<Incoming, { kind: "start" }>, { store, telegram }: BotDeps): Promise<void> {
  // Someone already signed up sends /start again (e.g. reopens the invite link).
  // [2026-11-12] If the database can't even answer this, say so honestly
  // instead of staying silent (rule 1.3; the sign-up gap found on 11 Nov).
  let existing;
  try {
    existing = await store.findParent(s.telegramId);
  } catch (error) {
    logFailure("Checking for an existing sign-up failed", error);
    await telegram.sendMessage(s.chatId, WORDS.signUpFailed);
    return;
  }
  if (existing) {
    await telegram.sendMessage(s.chatId, WORDS.alreadySignedUp);
    return;
  }
  if (s.code === null) {
    await telegram.sendMessage(s.chatId, WORDS.badCode);
    return;
  }
  // One all-or-nothing step: the parent, the used invite and the event (migration 006).
  let result;
  try {
    result = await store.signUp({ telegramId: s.telegramId, firstName: s.firstName, code: s.code, updateId: s.updateId });
  } catch (error) {
    // Nothing was saved (all or nothing); say so honestly (rule 1.3).
    logFailure("Sign-up failed", error);
    await telegram.sendMessage(s.chatId, WORDS.signUpFailed);
    return;
  }
  if (!result.ok) {
    await telegram.sendMessage(s.chatId, result.reason === "already" ? WORDS.alreadySignedUp : WORDS.badCode);
    return;
  }
  await telegram.sendMessage(s.chatId, WORDS.welcome(s.firstName));
  await telegram.sendMessage(s.chatId, WORDS.agreement, [{ text: WORDS.agreeButton, data: "agree" }]);
}

async function handleTap(t: Extract<Incoming, { kind: "tap" }>, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  // [2026-11-12] "Who tapped this?" If the database can't answer, say so
  // honestly and stop the button's spinner, rather than stay silent (rule 1.3).
  let parent;
  try {
    parent = await store.findParent(t.telegramId);
  } catch (error) {
    logFailure("Finding who tapped a button failed", error);
    await telegram.sendMessage(t.chatId, WORDS.signUpFailed).catch(() => undefined);
    await telegram.answerTap(t.tapId).catch(() => undefined);
    return;
  }
  if (!parent) {
    await telegram.answerTap(t.tapId, WORDS.signUpFirst);
    return;
  }

  if (t.data === "agree") {
    // [2026-11-12] Save first; only a failed save gets "didn't save" (rule 1.3).
    if (!(await saveOrSaySorry(t, deps, () => store.recordAgreement(parent.id)))) return;
    // Saved. A Telegram failure from here on is logged, never reported as "didn't save".
    try {
      await telegram.editMessage(t.chatId, t.messageId, `${WORDS.agreement}\n\n${WORDS.agreed}`); // removes the button
    } catch (error) {
      logFailure("Saved, but updating the agreement message failed", error);
    }
    await telegram
      .sendMessage(t.chatId, WORDS.allSet(THIN_SLICE_NUDGE.slotMinute))
      .catch((error) => logFailure("Saved, but sending 'all set' failed", error));
    await telegram.answerTap(t.tapId).catch(() => undefined);
    return;
  }

  // Nudge buttons carry the day they were sent for: "done:2026-11-11" or "skip:2026-11-11".
  const button = /^(done|skip):(\d{4}-\d{2}-\d{2})$/.exec(t.data);
  if (!button) {
    await telegram.answerTap(t.tapId); // an old or unknown button: just stop Telegram's loading spinner
    return;
  }
  const [, action, day] = button as unknown as [string, "done" | "skip", string];

  // [2026-11-12] The questions this tap asks the database before saving anything.
  // If any of them can't be answered, say so honestly and stop the button's
  // spinner, rather than stay silent (rule 1.3; review finding P1, 12 Nov).
  let found;
  try {
    found = await lookUpNudge(parent.id, day, deps);
  } catch (error) {
    logFailure("Looking up a tapped nudge failed", error);
    await telegram.sendMessage(t.chatId, WORDS.signUpFailed).catch(() => undefined);
    await telegram.answerTap(t.tapId).catch(() => undefined);
    return;
  }
  if (!found) {
    await telegram.answerTap(t.tapId, WORDS.expired);
    return;
  }
  const { nudge, doneAlready, notTodayAlready } = found;

  // [2026-11-12] Rule 5.10: once a nudge is answered one way, a tap on its other
  // button saves nothing (its buttons may still show if removing them failed).
  if ((action === "skip" && (doneAlready || notTodayAlready)) || (action === "done" && notTodayAlready)) {
    await telegram.answerTap(t.tapId, WORDS.alreadyAnswered);
    return;
  }

  if (action === "done") {
    if (doneAlready) {
      await telegram.answerTap(t.tapId, WORDS.alreadySaved);
      return;
    }
    let saved: "saved" | "duplicate" | undefined; // what the database said
    const ok = await saveOrSaySorry(t, deps, async () => {
      saved = await store.saveDoneLog({ parentId: parent.id, nudgeId: nudge.nudgeId, day, messageId: nudge.messageId, updateId: t.updateId });
    });
    if (!ok) return;
    if (saved === "duplicate") {
      await telegram.answerTap(t.tapId, WORDS.alreadySaved);
      return;
    }
    // [2026-11-12] The receipt is a new message below the nudge (rules 5.10, 7.5).
    await replyBelowNudge(t, deps, WORDS.receipt(nudge.nudgeName));
    return;
  }

  const ok = await saveOrSaySorry(t, deps, () => store.recordNotToday(parent.id, t.updateId));
  if (ok) await replyBelowNudge(t, deps, WORDS.notToday); // [2026-11-12] rule 5.10
}

// [2026-11-12] Which nudge was tapped, and has it been answered already? Nothing
// (null) if it isn't today's nudge: logging is for today only (rule 5.4), so a
// tap on an earlier day's nudge saves nothing. Any database failure is thrown.
async function lookUpNudge(parentId: number, day: string, { store, now }: BotDeps) {
  if (day !== toSgt(now).date) return null;
  const nudge = await store.findNudgeMessage(parentId, day, THIN_SLICE_NUDGE.slotMinute);
  if (!nudge) return null;
  const doneAlready = await store.logExistsFor(nudge.messageId);
  const notTodayAlready = await store.notTodayOn(parentId, day);
  return { nudge, doneAlready, notTodayAlready };
}

// [2026-11-12] Rule 5.10: once a tap is saved, the nudge keeps its words and
// loses its buttons (first, so it can't be tapped again), then the reply arrives
// as a new message. The answer is already saved, so a Telegram failure here is
// written to the log but never reported to the parent as "didn't save" (rule 1.3:
// that would be untrue, and they would tap again).
async function replyBelowNudge(t: Extract<Incoming, { kind: "tap" }>, { telegram }: BotDeps, text: string): Promise<void> {
  try {
    await telegram.removeButtons(t.chatId, t.messageId);
  } catch (error) {
    logFailure("Saved, but removing the nudge's buttons failed", error);
  }
  try {
    await telegram.sendMessage(t.chatId, text);
  } catch (error) {
    logFailure("Saved, but sending the reply failed", error);
  }
  // Stop Telegram's loading spinner on the button.
  await telegram.answerTap(t.tapId).catch((error) => logFailure("Answering the tap failed", error));
}

// If saving fails, say so honestly and leave the buttons, so the parent can try
// again. Never show a receipt for something that wasn't saved (rule 1.3).
// [2026-11-12] Returns true when the work succeeded, so the caller replies only then.
async function saveOrSaySorry(t: Extract<Incoming, { kind: "tap" }>, { telegram }: BotDeps, work: () => Promise<unknown>): Promise<boolean> {
  try {
    await work();
    return true;
  } catch (error) {
    logFailure("Saving a tap failed", error);
    await telegram.sendMessage(t.chatId, WORDS.didNotSave);
    await telegram.answerTap(t.tapId).catch(() => undefined);
    return false;
  }
}
