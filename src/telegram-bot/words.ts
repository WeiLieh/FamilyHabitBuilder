// =============================================================================
// src/telegram-bot/words.ts: every fixed sentence the bot says in thin slice 1
//
// What it does: [2026-11-11] keeps the bot's fixed words in one place, so they
// are easy to review and change. None of these are written by Claude: Claude's
// replies come in a later slice (owner's Option A, 11 Nov). Most come from the
// owner's designs (src/telegram-bot/SPEC.md); those marked "draft" are Claude
// Code's suggestions, still open for the owner to change.
// =============================================================================

import { formatTime } from "../sgt.js";

export const WORDS = {
  welcome: (firstName: string) => `Thanks for joining, ${firstName}!`, // screen 2, group A
  // Draft: the agreement wording is still open (Q8).
  agreement:
    "Before we start: we record what you log and when, so we can see what helps families. Your data is never sold or shared. You need to agree to join.",
  agreeButton: "✅ I agree", // rule 11.9
  agreed: "✅ You agreed.",
  // formatTime gives "7:00pm"; the agreed wording has a space: "7:00 pm".
  allSet: (minutes: number) =>
    `You're all set. Your reminder comes every day at ${formatTime(minutes).replace(/(am|pm)$/, " $1")}.`,
  badCode: "Sorry, that invite code doesn't work. Please check your invite link.", // draft
  alreadySignedUp: "You're already signed up.", // draft
  signUpFirst: "Please sign up with your invite link first.", // draft
  unrecognised: "Unrecognised text.", // owner, 11 Nov
  nudge: (name: string, example: string) => `${name}\n\nIdea: ${example}`, // draft: Claude writes the real words later (step 4)
  doneButton: "✅ Done",
  notTodayButton: "😴 Not today",
  receipt: (name: string) => `✅ Saved: ${name} today.`, // rule 7.5, fixed
  notToday: "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow.", // B1 part 2
  expired: "Reminder has expired. Tap a behaviour on the keyboard to log today.", // owner, 9 Nov
  alreadySaved: "Already saved.", // draft
  didNotSave: "Sorry, that didn't save. Please try again.", // draft, rule 1.3
  signUpFailed: "Sorry, that didn't work. Please try again.", // draft, rule 1.3
  nudgeNotSaved: "Sorry, this reminder couldn't be saved, so its buttons won't work. Your next one comes tomorrow.", // draft, rule 1.3
} as const;
