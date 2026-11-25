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
//   - [2026-11-25] answers /settings with a one-time sign-in link that opens
//     Settings on My page (rule 9.9), /pause with "Pause your reminders?" and
//     its two buttons (owner, 25 Nov: pause and resume both ways, PZ1), /help
//     with the help text and the keyboard (how existing parents get it, M3),
//     and /resume with "Resume your reminders?" and its two buttons (M2);
//   - tells a parent in Telegram when they pause or resume in Settings, and
//     switches their Menu to match (tellPauseChange, PZ3).
// /log itself is in log-any-time.ts.
// [2026-11-15] /mypage sends a new one-time sign-in link to the Web app (rule
// 9.3): a random secret goes after the "#" in the link, and only its
// fingerprint is stored. If it can't be stored, the parent is told it didn't
// work and gets no link (rule 1.3).
//
// Why: the commands live in one place, so the Menu, the replies and the
// owner's one-time set-up of the default Menu can't drift apart.
// Honest failures (rule 1.3): a resume that didn't save says so and keeps
// its buttons; a Menu change that fails is logged (the reply is still true).
// =============================================================================

import { fingerprintOf, newSecret } from "../datastore/sign-in-secrets.js";
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
  { store, telegram }: BotDeps,
): Promise<void> {
  switch (command) {
    case "mypage": {
      const secret = newSecret();
      try {
        await store.createSignInLink(parent.id, fingerprintOf(secret));
      } catch (error) {
        logFailure("Making a sign-in link failed", error);
        await telegram.sendMessage(chatId, WORDS.signUpFailed);
        return;
      }
      await telegram.sendMessage(chatId, WORDS.myPageLink, link(WORDS.openMyPageButton, `${WEB_PAGES.signIn}#${secret}`));
      return;
    }
    case "settings": {
      // [2026-11-25] The same one-time link as /mypage, landing on Settings (rule 9.9).
      const secret = newSecret();
      try {
        await store.createSignInLink(parent.id, fingerprintOf(secret));
      } catch (error) {
        logFailure("Making a sign-in link failed", error);
        await telegram.sendMessage(chatId, WORDS.signUpFailed);
        return;
      }
      await telegram.sendMessage(chatId, WORDS.settingsLink, link(WORDS.openSettingsButton, `${WEB_PAGES.signIn}&next=settings#${secret}`));
      return;
    }
    case "pause":
      if (!parent.paused) {
        await telegram.sendMessage(chatId, WORDS.pauseQuestion, [
          [
            { text: WORDS.pauseButton, data: "pause:yes" },
            { text: WORDS.cancelButton, data: "pause:no" },
          ],
        ]);
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

// [2026-11-25] The two buttons under "Pause your reminders?" (PZ2, PZ4): the
// mirror of resumeTap.
export async function pauseTap(t: Tap, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));
  if (t.data === "pause:no") {
    await quietly("Removing the pause buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
    await quietly("Sending 'stay on' failed", () => telegram.sendMessage(t.chatId, WORDS.pauseCancelled));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (parent.paused) {
    // Already paused (paused in another way since): say so, nothing to save.
    await quietly("Removing the pause buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
    await quietly("Sending 'already paused' failed", () => telegram.sendMessage(t.chatId, WORDS.alreadyPaused));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  try {
    await store.pauseReminders(parent.id);
  } catch (error) {
    // Not saved: say so, and leave the buttons so they can try again (rule 1.3).
    logFailure("Pausing reminders failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(t.chatId, WORDS.signUpFailed));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  await quietly("Removing the pause buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
  await quietly("Sending 'paused' failed", () => telegram.sendMessage(t.chatId, WORDS.paused));
  await quietly("Showing /resume in the Menu failed", () => telegram.setMenu(t.chatId, menuCommands(true)));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// [2026-11-25] After a pause or resume on My page's Settings (already saved):
// the short line in Telegram, and the Menu switched to match (PZ3). A failure
// is passed back, so the Settings page can say Telegram wasn't told (rule 1.3).
export async function tellPauseChange(telegram: BotDeps["telegram"], chatId: number, paused: boolean): Promise<void> {
  await telegram.sendMessage(chatId, paused ? WORDS.paused : WORDS.resumed);
  await telegram.setMenu(chatId, paused ? menuCommands(true) : null);
}
