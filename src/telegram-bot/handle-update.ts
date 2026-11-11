// =============================================================================
// src/telegram-bot/handle-update.ts: what the bot does with each update (thin slice 1)
//
// What it does: [2026-11-11] decides the bot's response to one update, already
// made sense of by updates.ts:
//   - /start CODE: sign up with the invite, then show the agreement (rules 1.1, 11.9)
//   - "I agree": record the recording agreement, say when the reminder comes
//   - ✅ Done: save today's log from that nudge, show the fixed receipt (rules 5.4, 7.5)
//   - 😴 Not today: record it, show the comforting note (rule 3.5)
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
  if (await store.findParent(s.telegramId)) {
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
    console.error("Sign-up failed:", error instanceof Error ? error.message : error);
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
  const parent = await store.findParent(t.telegramId);
  if (!parent) {
    await telegram.answerTap(t.tapId, WORDS.signUpFirst);
    return;
  }

  if (t.data === "agree") {
    await saveOrSaySorry(t, deps, async () => {
      await store.recordAgreement(parent.id);
      await telegram.editMessage(t.chatId, t.messageId, `${WORDS.agreement}\n\n${WORDS.agreed}`); // removes the button
      await telegram.sendMessage(t.chatId, WORDS.allSet(THIN_SLICE_NUDGE.slotMinute));
      await telegram.answerTap(t.tapId);
    });
    return;
  }

  // Nudge buttons carry the day they were sent for: "done:2026-11-11" or "skip:2026-11-11".
  const button = /^(done|skip):(\d{4}-\d{2}-\d{2})$/.exec(t.data);
  if (!button) {
    await telegram.answerTap(t.tapId); // an old or unknown button: just stop Telegram's loading spinner
    return;
  }
  const [, action, day] = button as unknown as [string, "done" | "skip", string];

  // Logging is for today only (rule 5.4): a tap on an earlier day's nudge saves nothing.
  const today = toSgt(deps.now).date;
  const nudge = day === today ? await store.findNudgeMessage(parent.id, day, THIN_SLICE_NUDGE.slotMinute) : null;
  if (!nudge) {
    await telegram.answerTap(t.tapId, WORDS.expired);
    return;
  }

  if (action === "done") {
    if (await store.logExistsFor(nudge.messageId)) {
      await telegram.answerTap(t.tapId, WORDS.alreadySaved);
      return;
    }
    await saveOrSaySorry(t, deps, async () => {
      const saved = await store.saveDoneLog({ parentId: parent.id, nudgeId: nudge.nudgeId, day, messageId: nudge.messageId, updateId: t.updateId });
      if (saved === "duplicate") {
        await telegram.answerTap(t.tapId, WORDS.alreadySaved);
        return;
      }
      // The receipt replaces the nudge, which also removes its buttons (rule 7.5).
      await telegram.editMessage(t.chatId, t.messageId, WORDS.receipt(nudge.nudgeName));
      await telegram.answerTap(t.tapId);
    });
    return;
  }

  await saveOrSaySorry(t, deps, async () => {
    await store.recordNotToday(parent.id, t.updateId);
    await telegram.editMessage(t.chatId, t.messageId, WORDS.notToday);
    await telegram.answerTap(t.tapId);
  });
}

// If saving fails, say so honestly and leave the buttons, so the parent can try
// again. Never show a receipt for something that wasn't saved (rule 1.3).
async function saveOrSaySorry(t: Extract<Incoming, { kind: "tap" }>, { telegram }: BotDeps, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    console.error("Saving a tap failed:", error instanceof Error ? error.message : error);
    await telegram.sendMessage(t.chatId, WORDS.didNotSave);
    await telegram.answerTap(t.tapId).catch(() => undefined);
  }
}
