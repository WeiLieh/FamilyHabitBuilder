// =============================================================================
// src/telegram-bot/handle-update.ts: what the bot does with each update (thin slice 1)
//
// What it does: [2026-11-11] decides the bot's response to one update, already
// made sense of by updates.ts:
//   - [2026-11-12] /start, typed names and sign-up buttons from someone who is
//     not a parent yet: the onboarding screens 2 to 11 (onboarding.ts, rule 8.13).
//     The thin-slice sign-up ("sign up at /start, agree later") is removed
//     (CLAUDE.md rule 12).
//   - Screen 10's buttons from a new parent: "I've started!" and "Not now" (onboarding.ts)
//   - ✅ Done: save today's log from that nudge, show the fixed receipt (rules 5.4, 7.5)
//   - 😴 Not today: record it, show the comforting note (rule 3.5)
//   [2026-11-13] Pull request 3c: nudge buttons name their day and slot (up to
//   3 nudges a day); Continue on the 24-hour sign-up reminder (W5, W7).
//   [2026-11-12] For both, the nudge keeps its words and loses its buttons, and
//   the receipt or note arrives as a new message below it (rule 5.10).
//   - [2026-11-14] B1, log any time (log-any-time.ts, menu.ts): a keyboard
//     button's text ("✅ Showing affection") logs that behaviour; the Menu's
//     commands (/log, /mypage, /settings, /pause, /resume, /help, also typed
//     without the "/"); the Undo, /log and Resume buttons.
//   - anything else a person sends: "Unrecognised text." (owner, 11 Nov)
// See src/telegram-bot/SPEC.md, "Build: thin slice 1".
//
// Why it takes its helpers as "deps": the tests pass in a pretend Telegram and
// database, and a fixed time, so every situation can be checked exactly.
// =============================================================================

import type { Store } from "../datastore/store.js";
import { toSgt } from "../sgt.js";
import type { TelegramApi } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";
import { logFailure } from "./log-failure.js"; // [2026-11-12] no personal values in logs (P2)
import { onboardingTap, onboardingText, startNowTap, startOnboarding } from "./onboarding.js";
import { logBehaviour, logTap, matchKeyboard, sendHelp, sendLogChoice, undoTap } from "./log-any-time.js";
import { parseCommand, resumeTap, runMenuCommand, syncMenu } from "./menu.js";

export type BotDeps = { store: Store; telegram: TelegramApi; now: Date };

export async function handleUpdate(incoming: Incoming, deps: BotDeps): Promise<void> {
  const { telegram } = deps;
  switch (incoming.kind) {
    case "ignore":
      return; // not a person's message: stay silent
    case "message":
      await handleMessage(incoming, deps);
      return;
    case "start":
      await handleStart(incoming, deps);
      return;
    case "tap":
      await handleTap(incoming, deps);
      return;
  }
}

async function handleStart(s: Extract<Incoming, { kind: "start" }>, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
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
  await startOnboarding(s, deps); // [2026-11-12] screens 2 and 3, or "Welcome back!"
}

// [2026-11-12] Something a person typed or sent. During sign-up, a typed name
// (onboarding.ts); otherwise "Unrecognised text." (owner, 11 Nov).
async function handleMessage(m: Extract<Incoming, { kind: "message" }>, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  if (m.text !== null) {
    let draft;
    try {
      // A parent never has a draft (finishing removes it), so one question is enough.
      draft = await store.findDraft(m.telegramId);
    } catch (error) {
      logFailure("Checking for a sign-up in progress failed", error);
      await telegram.sendMessage(m.chatId, WORDS.signUpFailed);
      return;
    }
    if (draft) {
      await onboardingText(m.chatId, m.telegramId, m.text, draft, deps);
      return;
    }
    // [2026-11-14] B1: a parent's command or keyboard button.
    let parent;
    try {
      parent = await store.findParent(m.telegramId);
    } catch (error) {
      logFailure("Finding who sent a message failed", error);
      await telegram.sendMessage(m.chatId, WORDS.signUpFailed);
      return;
    }
    if (parent) {
      await parentText(m, m.text, parent, deps);
      return;
    }
  }
  await telegram.sendMessage(m.chatId, WORDS.unrecognised);
}

// [2026-11-14] B1: a Menu command (rule 5.7), a keyboard button (rule 5.1), or
// "Unrecognised text." (typed messages come later, with Claude).
async function parentText(m: Extract<Incoming, { kind: "message" }>, text: string, parent: { id: number; paused: boolean }, deps: BotDeps): Promise<void> {
  const { telegram } = deps;
  const command = parseCommand(text);
  if (command === "log") return sendLogChoice(m.chatId, parent, deps);
  if (command === "help") {
    await sendHelp(m.chatId, parent, deps);
    await syncMenu(m.chatId, parent, telegram);
    return;
  }
  if (command !== null) return runMenuCommand(command, m.chatId, parent, deps);
  let behaviour;
  try {
    behaviour = await matchKeyboard(text, parent, deps);
  } catch (error) {
    logFailure("Reading the chosen behaviours failed", error);
    await telegram.sendMessage(m.chatId, WORDS.didNotSave);
    return;
  }
  if (!behaviour) {
    await telegram.sendMessage(m.chatId, WORDS.unrecognised); // K7
    return;
  }
  await logBehaviour(m.chatId, parent, behaviour, "keyboard", m.updateId, deps);
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
    // [2026-11-12] Not a parent yet: a sign-up button, if they have a sign-up in progress.
    let draft;
    try {
      draft = await store.findDraft(t.telegramId);
    } catch (error) {
      logFailure("Checking for a sign-up in progress failed", error);
      await telegram.sendMessage(t.chatId, WORDS.signUpFailed).catch(() => undefined);
      await telegram.answerTap(t.tapId).catch(() => undefined);
      return;
    }
    if (draft) await onboardingTap(t, draft, deps);
    // [2026-11-13] Continue on the sign-up reminder after the draft was cut down (W7).
    else if (t.data === "signup:continue") {
      await telegram.sendMessage(t.chatId, WORDS.signUpExpired).catch((error) => logFailure("Sending 'sign-up expired' failed", error));
      await telegram.answerTap(t.tapId).catch(() => undefined);
    } else await telegram.answerTap(t.tapId, WORDS.signUpFirst);
    return;
  }

  // [2026-11-12] Screen 10's buttons (onboarding.ts).
  if (t.data === "start:done" || t.data === "start:notnow") {
    await startNowTap(t, parent, deps);
    return;
  }

  // [2026-11-13] The sign-up reminder's Continue, from someone who has since finished.
  if (t.data === "signup:continue") {
    await telegram.sendMessage(t.chatId, WORDS.alreadySignedUp).catch((error) => logFailure("Sending 'already signed up' failed", error));
    await telegram.answerTap(t.tapId).catch(() => undefined);
    return;
  }

  // [2026-11-14] B1: Undo, /log's buttons, and Resume or Cancel.
  const undo = /^undo:(\d+)$/.exec(t.data);
  if (undo) return undoTap(t, parent, Number(undo[1]), deps);
  const log = /^log:(\d+)$/.exec(t.data);
  if (log) return logTap(t, parent, Number(log[1]), deps);
  if (t.data === "resume:yes" || t.data === "resume:no") return resumeTap(t, parent, deps);

  // [2026-11-13] Nudge buttons carry the day and slot they were sent for:
  // "done:2026-11-11:1140" or "skip:2026-11-11:1140" (up to 3 nudges a day).
  // A button from before pull request 3c (no slot) is treated as unknown.
  const button = /^(done|skip):(\d{4}-\d{2}-\d{2}):(\d{1,4})$/.exec(t.data);
  if (!button) {
    await telegram.answerTap(t.tapId); // an old or unknown button: just stop Telegram's loading spinner
    return;
  }
  const [, action, day, slotText] = button as unknown as [string, "done" | "skip", string, string];
  const slot = Number(slotText);

  // [2026-11-12] The questions this tap asks the database before saving anything.
  // If any of them can't be answered, say so honestly and stop the button's
  // spinner, rather than stay silent (rule 1.3; review finding P1, 12 Nov).
  let found;
  try {
    found = await lookUpNudge(parent.id, day, slot, deps);
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
async function lookUpNudge(parentId: number, day: string, slot: number, { store, now }: BotDeps) {
  if (day !== toSgt(now).date) return null;
  const nudge = await store.findNudgeMessage(parentId, day, slot);
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
