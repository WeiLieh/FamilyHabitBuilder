// =============================================================================
// src/telegram-bot/menu.ts: the Menu and its commands (B1, rule 5.7)
//
// What it does: [2026-11-14] the "Menu" is Telegram's list of commands next to
// the typing box. This file:
//   - says what the Menu holds (menuCommands): /log, /mypage, /settings,
//     /pause, /help for everyone; a paused person sees /resume in place of
//     /pause (owner, B1-D8; Telegram allows a different Menu per chat);
//   - recognises a command, with or without the "/" and in any capitals
//     ("LOG", "/log" and "log" all work; "/log hug" does not, test M4);
//   - answers /mypage, /settings and /pause with a link to the placeholder
//     page (B1-D3: pausing itself happens in Settings, not built yet), /help
//     with the help text and the keyboard (how existing parents get it, M3),
//     and /resume with "Resume your reminders?" and its two buttons (M2).
// /log itself is in log-any-time.ts.
//
// Why: the commands live in one place, so the Menu, the replies and the
// owner's one-time set-up of the default Menu can't drift apart.
// Honest failures (rule 1.3): a resume that didn't save says so and keeps
// its buttons; a Menu change that fails is logged (the reply is still true).
// =============================================================================

import { WEB_PAGES } from "../settings.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import type { MenuCommand } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";

export type Command = "log" | "mypage" | "settings" | "pause" | "resume" | "help";
type Parent = { id: number; paused: boolean };
type Tap = Extract<Incoming, { kind: "tap" }>;

// The Menu, in the owner's order (B1-D8). Paused: /resume takes /pause's place.
export function menuCommands(paused: boolean): MenuCommand[] {
  const order: Command[] = ["log", "mypage", "settings", paused ? "resume" : "pause", "help"];
  return order.map((command) => ({ command, description: WORDS.menu[command] }));
}

// "LOG", "/log", " log " → "log". Anything else (including "/log hug") → null.
const COMMANDS: readonly Command[] = ["log", "mypage", "settings", "pause", "resume", "help"];
export function parseCommand(text: string): Command | null {
  const word = text.trim().toLowerCase().replace(/^\//, "");
  return (COMMANDS as readonly string[]).includes(word) ? (word as Command) : null;
}

// A link button under a message (it opens the web page; nothing is saved).
const link = (text: string, url: string) => [[{ text, url }]];

// The replies to /mypage, /settings, /pause and /resume. /help needs the
// keyboard, so it comes from log-any-time.ts (sendHelp), passed in here.
export async function runMenuCommand(
  command: Exclude<Command, "log" | "help">,
  chatId: number,
  parent: Parent,
  { telegram }: BotDeps,
): Promise<void> {
  switch (command) {
    case "mypage":
      await telegram.sendMessage(chatId, WORDS.myPageLink, link(WORDS.openMyPageButton, WEB_PAGES.myPage));
      return;
    case "settings":
      await telegram.sendMessage(chatId, WORDS.settingsLink, link(WORDS.openSettingsButton, WEB_PAGES.settings));
      return;
    case "pause":
      if (!parent.paused) {
        await telegram.sendMessage(chatId, WORDS.pauseLink, link(WORDS.openSettingsButton, WEB_PAGES.settings));
        return;
      }
      await telegram.sendMessage(chatId, WORDS.alreadyPaused);
      await syncMenu(chatId, parent, telegram); // their Menu should show /resume (B1-D8)
      return;
    case "resume":
      if (!parent.paused) {
        await telegram.sendMessage(chatId, WORDS.alreadyOn);
        return;
      }
      await telegram.sendMessage(chatId, WORDS.resumeQuestion, [
        [
          { text: WORDS.resumeButton, data: "resume:yes" },
          { text: WORDS.cancelButton, data: "resume:no" },
        ],
      ]);
      return;
  }
}

// A paused person gets their own Menu with /resume. Everyone else uses the
// default Menu, so nothing needs changing for them.
export async function syncMenu(chatId: number, parent: Parent, telegram: BotDeps["telegram"]): Promise<void> {
  if (!parent.paused) return;
  await telegram.setMenu(chatId, menuCommands(true)).catch((error) => logFailure("Showing /resume in the Menu failed", error));
}

// The two buttons under "Resume your reminders?".
export async function resumeTap(t: Tap, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));
  if (t.data === "resume:no") {
    await quietly("Removing the resume buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
    await quietly("Sending 'stay paused' failed", () => telegram.sendMessage(t.chatId, WORDS.resumeCancelled));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (!parent.paused) {
    // Already on (resumed in another way since): say so, nothing to save.
    await quietly("Removing the resume buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
    await quietly("Sending 'already on' failed", () => telegram.sendMessage(t.chatId, WORDS.alreadyOn));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  try {
    await store.resumeReminders(parent.id);
  } catch (error) {
    // Not saved: say so, and leave the buttons so they can try again (rule 1.3).
    logFailure("Resuming reminders failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(t.chatId, WORDS.signUpFailed));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  // Saved. From here a Telegram failure is logged, never reported as "didn't work".
  await quietly("Removing the resume buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
  await quietly("Sending 'back on' failed", () => telegram.sendMessage(t.chatId, WORDS.resumed));
  // Back to everyone's default Menu, which shows /pause (B1-D8).
  await quietly("Putting /pause back in the Menu failed", () => telegram.setMenu(t.chatId, null));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}
