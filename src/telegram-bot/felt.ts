// =============================================================================
// src/telegram-bot/felt.ts: "Add how you felt", a line on a saved log (rule 5.3)
//
// What it does: [2026-11-24] owner-approved tests F1 to F9 (24 Nov; the
// design of 8 and 9 Nov in src/telegram-bot/SPEC.md):
//   - Every receipt (✅ Done, keyboard, /log) has an "Add how you felt"
//     button (feltButton, used by handle-update.ts and log-any-time.ts).
//   - The tap asks "How did it feel? Type a line (up to 280 characters), or
//     ignore this to skip." and saves nothing yet. A log that already has a
//     line, or was undone, says so instead.
//   - The next typed line within 10 minutes (LINE_WAIT_SECONDS) is saved on
//     that log, once: "✅ Added to today's log." Over 280 characters, nothing is
//     saved and the parent is asked to shorten it (still waiting). After 10
//     minutes, nothing waits: typed text gets "Unrecognised text." as before.
//   - Keyboard buttons and commands are never taken as a line: handle-update.ts
//     checks them first (F6).
// The database decides the wait and that a line is set once (migration 013).
// Honest failures (rule 1.3): a failed save says so, never "Added". The
// line's words never go into a log line (F9): only "what failed" and the
// database's cleaned error text.
// =============================================================================

import { LINE_MAX_CHARS } from "../settings.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import type { Button } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";

type Parent = { id: number };
type Tap = Extract<Incoming, { kind: "tap" }>;

const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));

// The button under a receipt (F1): it names the log it belongs to.
export const feltButton = (logId: number): Button => ({ text: WORDS.feltButton, data: `felt:${logId}` });

// The tap on "Add how you felt" (F2, F7).
export async function feltTap(t: Tap, parent: Parent, logId: number, { store, telegram }: BotDeps): Promise<void> {
  let result: "asked" | "has_line" | "not_allowed";
  try {
    result = await store.askForLine(parent.id, logId);
  } catch (error) {
    logFailure("Asking for a line failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(t.chatId, WORDS.signUpFailed));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (result === "not_allowed") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.lineUndone)));
  const text = result === "has_line" ? WORDS.lineHasOne : WORDS.feltPrompt;
  await quietly("Sending the line prompt failed", () => telegram.sendMessage(t.chatId, text));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// A parent's typed text that is not a command or a keyboard button: is it the
// line a log is waiting for? Returns true if it was handled here (saved, too
// long, already saved, or a failure said so); false if no log is waiting.
export async function typedLine(chatId: number, parent: Parent, text: string, updateId: number, { store, telegram }: BotDeps): Promise<boolean> {
  // [2026-11-24, review] Anything that looks like a command ("/delete", "/log@Bot") is never a line.
  if (text.trimStart().startsWith("/")) return false;
  const length = [...text].length; // characters as a person counts them (an emoji is one)
  try {
    if (length > LINE_MAX_CHARS) {
      // Too long: say so only if a log is waiting for it (F4); otherwise it is just unrecognised.
      if (!(await store.lineWaiting(parent.id))) return false;
      await quietly("Sending 'please shorten it' failed", () => telegram.sendMessage(chatId, WORDS.lineTooLong(length)));
      return true;
    }
    const result = await store.addLogLine(parent.id, text, updateId);
    if (result === "none") return false;
    if (result === "saved") await quietly("Line saved, but sending the reply failed", () => telegram.sendMessage(chatId, WORDS.lineAdded));
    return true; // "duplicate": Telegram resent a message already saved; say nothing more (F8)
  } catch (error) {
    logFailure("Saving a line failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(chatId, WORDS.didNotSave));
    return true;
  }
}
