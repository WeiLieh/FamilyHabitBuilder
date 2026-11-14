// =============================================================================
// src/telegram-bot/words.ts: every fixed sentence the bot says
//
// What it does: [2026-11-11] keeps the bot's fixed words in one place, so they
// are easy to review and change. None of these are written by Claude: Claude's
// replies come in a later slice (owner's Option A, 11 Nov). Most come from the
// owner's designs (src/telegram-bot/SPEC.md); those marked "draft" are Claude
// Code's suggestions, still open for the owner to change.
// [2026-11-12] Pull request 2 adds the onboarding screens 2 to 11 (owner's
// decisions of 12 Nov, "Recorded: group A finished") and removes the thin-slice
// "all set" line, replaced by screen 11 (CLAUDE.md rule 12).
// [2026-11-13] Pull request 3c: the owner's words W1 to W7 (13 Nov): the
// planner's nudge ("With Mia: …"), the next reminder's real time, the /start
// notice, the 24-hour sign-up reminder and Continue. The fixed "7:00 pm"
// wording (D1) is gone.
// =============================================================================

import { daysBetween, formatTime, toSgt, weekdayOf } from "../sgt.js";
import { DEFAULT_FREQUENCIES, SIGN_UP_DRAFT_KEEP_DAYS } from "../settings.js";

// "7:00pm" from formatTime becomes "7:00 pm", the owner's agreed style.
export const spacedTime = (minutes: number) => formatTime(minutes).replace(/(am|pm)$/, " $1");

// [2026-11-12] Review fix F1: how each frequency is said, so screen 8 always
// matches the defaults in src/settings.ts (rule 1.4). A frequency missing here
// fails the type check, never shows a made-up phrase.
const FREQUENCY_WORDS: Record<(typeof DEFAULT_FREQUENCIES)[keyof typeof DEFAULT_FREQUENCIES], string> = {
  every_2_days: "every 2 days",
  once_a_week: "once a week",
};

// [2026-11-13] W2: when the next reminder is, said the owner's way: "today at
// 7:00 pm", "tomorrow at 9:00 am", "on Friday at 7:00 am" within a week, and
// "on Fri 20 Nov at 7:00 am" further ahead (rule 3.17).
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function whenWords(now: Date, next: { date: string; slotStart: number }): string {
  const time = spacedTime(next.slotStart);
  const today = toSgt(now).date; // today in Singapore
  const ahead = daysBetween(today, next.date);
  const weekday = DAY_NAMES[weekdayOf(next.date)]!;
  if (ahead === 0) return `today at ${time}`;
  if (ahead === 1) return `tomorrow at ${time}`;
  if (ahead < 7) return `on ${weekday} at ${time}`;
  const [, month, day] = next.date.split("-").map(Number);
  return `on ${weekday.slice(0, 3)} ${day} ${MONTHS[month! - 1]} at ${time}`;
}

// Names joined the way people say them: "Mia", "Mia and Leo", "Mia, Leo and Ava".
export const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

export const WORDS = {
  // ---- Screens 1 to 3: invite, first name, children (Q7, Q10) ----
  // Screen 2, with the 7-day line at /start (owner, 12 Nov, review finding P1).
  // [2026-11-13] W4 (owner, PDPA): the notice also says one reminder may come.
  welcome: (firstName: string) =>
    `Thanks for joining, ${firstName}!\n\nWe'll keep your answers for ${SIGN_UP_DRAFT_KEEP_DAYS} days while you set up, and may send you one reminder to finish. Nothing is saved for good until you agree.`,
  changeNameButton: "Change name",
  askFirstName: "What should we call you? Type your first name.",
  thanksName: (firstName: string) => `Thanks, ${firstName}!`,
  childQuestion: "What's your child's name? Type their first name, a nickname works too.",
  otherChildQuestion: "What's your other child's name?",
  anyOtherChildren: (names: string[]) => `${joinNames(names)}. Any other children?`,
  addChildButton: "+ Add another child",
  thatsAllButton: "That's all",
  // Told once, to parents of 2 or 3 children (Q4, owner's wording).
  takingTurns: (names: string[]) =>
    `${joinNames(names)}. Lovely! To keep things fresh, we'll take turns naming one of them in each reminder. It's just a suggestion: do it with whoever you like.`,
  nameTooLong: (max: number) => `Please type a name of up to ${max} characters.`, // draft
  welcomeBack: "Welcome back! Let's carry on.", // Q10e
  // [2026-11-13] W5 (owner's edit of Q11b): the one 24-hour sign-up reminder.
  signUpReminder: "You're almost there! Tap below to continue where you left off.",
  continueButton: "Continue",
  // [2026-11-13] W7: Continue tapped after the draft was cut down (7 quiet days).
  signUpExpired: "This sign-up has expired. Please open your invite link again to start over.",
  noCode: "Hi! This app is invite-only for now. Please use the invite link you were sent.", // Q10d
  badCode: "Sorry, that invite code doesn't work. Please ask the person who invited you for your own link.", // Q10c
  alreadySignedUp: "You're already signed up.", // draft
  signUpFirst: "Please sign up with your invite link first.", // draft

  // ---- Screens 4 and 5: behaviours ----
  greetOneChild: (child: string, firstName: string) => `Nice to meet you, ${child}'s parent, ${firstName}!`,
  greetManyChildren: (firstName: string) => `Nice to meet you, ${firstName}!`, // Q4
  quickIntro: "These are quick behaviours. Pick up to 2 to work on.",
  ticked: (name: string) => `✓ ${name}`,
  nextButton: "Next",
  pickLimit: "You can pick up to 2.",
  deliberateIntro: "Now pick 1 deliberate behaviour. These take some planning. So we've made it optional.",
  // Owner's decision D2, 12 Nov: with no quick pick, the deliberate one is needed (rule 2.1).
  deliberateNeeded: "Now pick 1 deliberate behaviour. Pick 1 to get started.",
  skipButton: "Skip for now",
  picked: (names: string[]) => `Picked: ${names.length > 0 ? names.join(", ") : "none"}`, // draft: shown once the screen is done
  skipped: "Skipped for now.", // draft

  // ---- Screens 6 to 8: times and plan (Q7: no Change during sign-up) ----
  schoolTimes: (minutes: number[]) =>
    `For school days, we'll suggest reminders at these 3 times.\n${minutes.map(spacedTime).join(" · ")}\n1 reminder each time. A maximum of 3 in total a day.\nYou can change these anytime in Settings.`,
  weekendTimes: (minutes: number[]) =>
    `For weekends and school holidays, we'll remind you at these times.\n${minutes.map(spacedTime).join(" · ")}\n1 reminder each time. A maximum of 3 in total a day.\nYou can change these anytime in Settings.`,
  okButton: "OK",
  // Screen 8 (rule 3.14): owner's title, 12 Nov (D3); one line per kind of behaviour.
  plan: (quick: string[], deliberate: string | null, wrapUpMinute: number) =>
    [
      "From what you chose, your reminders are:",
      ...(quick.length > 0 ? [`${quick.join(", ")}: ${FREQUENCY_WORDS[DEFAULT_FREQUENCIES.quick]}`] : []),
      ...(deliberate ? [`${deliberate}: ${FREQUENCY_WORDS[DEFAULT_FREQUENCIES.deliberate]}`] : []),
      `A wrap up for the week will be sent on Sunday at ${spacedTime(wrapUpMinute)}.`,
      "Change these anytime in Settings.",
    ].join("\n"),

  // ---- Screen 9: the agreement (rule 11.9) ----
  // Draft: the agreement wording is still open (Q8); a placeholder until the PDPA review.
  agreement:
    "Before we start: we record what you log and when, so we can see what helps families. Your data is never sold or shared. You need to agree to join.",
  agreeButton: "✅ I agree", // rule 11.9
  agreed: "✅ You agreed.",

  // ---- Screens 10 and 11: Start right now, All set (Q3) ----
  startedButton: "✅ I've started!",
  notNowButton: "Not now",
  // "when" is e.g. "today at 7:00 pm", from whenWords (W2, rule 3.17).
  notNow: (when: string) => `No problem. Your first reminder is ${when}.`,
  allSet: (firstName: string, when: string) => `You're all set, ${firstName}. Your next reminder is ${when}.`,
  // [2026-11-13] W3: no next reminder (paused, or nothing due in 14 days): never a made-up time.
  notNowNoReminder: "No problem. We'll remind you when one of your habits is next due.",
  allSetNoReminder: (firstName: string) => `You're all set, ${firstName}. We'll remind you when one of your habits is next due.`,
  // [2026-11-13] Draft (rule 1.3): the next reminder couldn't be worked out (a failed read).
  allSetUnknown: (firstName: string) => `You're all set, ${firstName}. Sorry, we couldn't check when your next reminder is.`,
  notNowUnknown: "No problem. Sorry, we couldn't check when your first reminder is.", // draft, rule 1.3
  myPage: "Your page is here whenever you want to look back. It's empty for now.",
  openMyPageButton: "Open my page ↗",
  startNowNotSaved: "Sorry, this couldn't be saved, so its buttons won't work.", // draft, rule 1.3
  startNowNotShown: "Sorry, Start right now couldn't be shown. You're signed up.", // [2026-11-12] draft, review fix F3

  // ---- The daily loop ----
  unrecognised: "Unrecognised text.", // owner, 11 Nov
  // [2026-11-13] W1 (owner, option c): one child, taking turns (rule 3.16), then
  // an idea (rule 3.13). Claude writes the words in a later slice (rule 3.11).
  nudge: (name: string, child: string | null, example: string) => `With ${child ?? "your child"}: ${name}\n\nIdea: ${example}`,
  doneButton: "✅ Done",
  notTodayButton: "😴 Not today",
  receipt: (name: string) => `✅ Saved: ${name} today.`, // rule 7.5, fixed
  notToday: "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow.", // B1 part 2
  expired: "Reminder has expired. Tap a behaviour on the keyboard to log today.", // owner, 9 Nov
  alreadySaved: "Already saved.", // draft
  alreadyAnswered: "Already answered.", // [2026-11-12] draft, rule 5.10
  didNotSave: "Sorry, that didn't save. Please try again.", // draft, rule 1.3
  signUpFailed: "Sorry, that didn't work. Please try again.", // draft, rule 1.3
  nudgeNotSaved: "Sorry, this reminder couldn't be saved, so its buttons won't work.", // [2026-11-13] W6, rule 1.3
} as const;
