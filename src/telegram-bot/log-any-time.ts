// =============================================================================
// src/telegram-bot/log-any-time.ts: logging without waiting for a reminder (B1)
//
// What it does: [2026-11-14] the parent can log a behaviour whenever they did
// it (src/telegram-bot/SPEC.md, "Build: B1"; rules 5.1, 5.8, 5.10):
//   - the keyboard: one "✅ <name>" button per chosen behaviour, kept under the
//     chat. A tap arrives as that exact text and is matched exactly against
//     the parent's current choices, so no Claude call is needed (K2, K7);
//   - /log: the same choice as buttons under a message (L1); a /log log gets
//     no Undo (two deliberate steps, B1-D5);
//   - if today's nudge for that behaviour is still waiting, the log answers it:
//     the log is linked to the nudge and the nudge loses its buttons (K3, L2);
//   - the receipt: "✅ Saved: <name> today." or, the second time today,
//     "…, again today. It counts once for your week." (K4);
//   - Undo under a keyboard log's receipt, for 10 minutes (B1-D1). A late tap
//     removes the button and says "Undo expired." (U2). The database decides,
//     by its own clock, so the app can't be fooled by a wrong phone time.
//   - /help: the help text with the keyboard (M3).
//
// Analogy: the keyboard is a row of tally buttons by the door; each press is
// written in the diary, and Undo is a 10-minute "oops" eraser that only
// crosses the line out (the line is kept, flagged as undone).
//
// Honest failures (rule 1.3): nothing saved means "Sorry, that didn't save",
// never a receipt; once saved, a Telegram failure is logged, not reported.
// =============================================================================

import { toSgt } from "../sgt.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";

type Parent = { id: number; paused: boolean };
type Tap = Extract<Incoming, { kind: "tap" }>;
type Behaviour = { id: number; name: string };

const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));

// The keyboard's labels for this parent's choices, in the order picked.
export const keyboardLabels = (chosen: Behaviour[]) => chosen.map((b) => WORDS.keyboardLabel(b.name));

// A typed text from a parent: is it one of their keyboard buttons? Returns the
// behaviour, or null (not a label, or a behaviour they no longer have, K7).
// A failed read is thrown, so the caller can say so honestly.
export async function matchKeyboard(text: string, parent: Parent, { store }: BotDeps): Promise<Behaviour | null> {
  if (!text.startsWith("✅ ")) return null; // only our labels start like this: no database question needed
  const chosen = await store.chosenBehaviours(parent.id);
  return chosen.find((b) => WORDS.keyboardLabel(b.name) === text) ?? null;
}

// Save a log of this behaviour for today and send the receipt.
// "via" says how: the keyboard (with Undo) or /log (without, B1-D5).
// "logMessage" is the /log message tapped, which loses its buttons once saved (L1).
export async function logBehaviour(
  chatId: number,
  parent: Parent,
  behaviour: Behaviour,
  via: "keyboard" | "log_command",
  updateId: number,
  deps: BotDeps,
  logMessage?: number,
): Promise<"saved" | "duplicate" | "failed"> {
  const { store, telegram, now } = deps;
  const day = toSgt(now).date; // logs are for today only (rule 5.4)
  let waiting: { messageId: number; telegramMessageId: number | null } | null;
  let before: boolean;
  let saved: { logId: number } | "duplicate";
  try {
    waiting = await store.waitingNudge(parent.id, day, behaviour.id);
    before = await store.loggedToday(parent.id, behaviour.id, day);
    saved = await store.saveLog({ parentId: parent.id, nudgeId: behaviour.id, day, messageId: waiting?.messageId ?? null, via, updateId });
  } catch (error) {
    // Nothing was saved: say so, never a receipt (K6, rule 1.3).
    logFailure("Saving a log failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(chatId, WORDS.didNotSave));
    return "failed";
  }
  if (saved === "duplicate") return "duplicate"; // already saved (Telegram resent it, or a tap at the same instant)
  // It answered a waiting nudge: the nudge keeps its words and loses its buttons
  // (rule 5.10). A nudge sent before migration 010 has no number, so its buttons
  // stay; a tap on them then says "Already saved.".
  const nudgeMessage = waiting?.telegramMessageId ?? null;
  if (nudgeMessage !== null) await quietly("Saved, but removing the nudge's buttons failed", () => telegram.removeButtons(chatId, nudgeMessage));
  if (logMessage !== undefined) await quietly("Saved, but removing the /log buttons failed", () => telegram.removeButtons(chatId, logMessage));
  // The receipt, as a new message; with Undo only for a keyboard log.
  const text = before ? WORDS.receiptAgain(behaviour.name) : WORDS.receipt(behaviour.name);
  const buttons = via === "keyboard" ? [[{ text: WORDS.undoButton, data: `undo:${saved.logId}` }]] : [];
  await quietly("Saved, but sending the receipt failed", () => telegram.sendMessage(chatId, text, buttons));
  return "saved";
}

// /log: the chosen behaviours as buttons, one per row (L1).
export async function sendLogChoice(chatId: number, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  let chosen: Behaviour[];
  try {
    chosen = await store.chosenBehaviours(parent.id);
  } catch (error) {
    logFailure("Reading the chosen behaviours failed", error);
    await telegram.sendMessage(chatId, WORDS.signUpFailed);
    return;
  }
  if (chosen.length === 0) {
    await telegram.sendMessage(chatId, WORDS.noBehaviours);
    return;
  }
  await telegram.sendMessage(chatId, WORDS.logPrompt, chosen.map((b) => [{ text: b.name, data: `log:${b.id}` }]));
}

// A tap on one of /log's buttons ("log:<behaviour>").
export async function logTap(t: Tap, parent: Parent, nudgeId: number, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  let behaviour: Behaviour | undefined;
  try {
    behaviour = (await store.chosenBehaviours(parent.id)).find((b) => b.id === nudgeId);
  } catch (error) {
    logFailure("Reading the chosen behaviours failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(t.chatId, WORDS.didNotSave));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  // Not one of their behaviours (any more): nothing to save (L3).
  if (!behaviour) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId)));
  const result = await logBehaviour(t.chatId, parent, behaviour, "log_command", t.updateId, deps, t.messageId);
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, result === "duplicate" ? WORDS.alreadySaved : undefined));
}

// A tap on Undo ("undo:<log>") under a keyboard log's receipt (rule 5.8).
export async function undoTap(t: Tap, parent: Parent, logId: number, { store, telegram }: BotDeps): Promise<void> {
  let result: "undone" | "expired" | "not_allowed";
  try {
    result = await store.undoLog(parent.id, logId);
  } catch (error) {
    // Nothing changed: say so, and leave Undo so they can try again (U3, rule 1.3).
    logFailure("Undoing a log failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(t.chatId, WORDS.signUpFailed));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (result === "not_allowed") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId))); // U4
  // Undone or too late: either way the button goes now, so it never looks usable (B1-D1).
  await quietly("Removing the Undo button failed", () => telegram.removeButtons(t.chatId, t.messageId));
  if (result === "expired") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.undoExpired)));
  await quietly("Undone, but sending the reply failed", () => telegram.sendMessage(t.chatId, WORDS.undone));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// /help: the help text, and the keyboard back under the chat (M3). Without
// the parent's choices (a failed read), the help is sent without the keyboard.
export async function sendHelp(chatId: number, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  let chosen: Behaviour[] | null = null;
  try {
    chosen = await store.chosenBehaviours(parent.id);
  } catch (error) {
    logFailure("Reading the chosen behaviours for /help failed", error);
  }
  if (chosen && chosen.length > 0) await telegram.sendWithKeyboard(chatId, WORDS.help, keyboardLabels(chosen));
  else await telegram.sendMessage(chatId, WORDS.help);
}
