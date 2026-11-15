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
// [2026-11-14] B1, log any time: the keyboard's labels and receipts, Undo, /log,
// the Menu and /help (src/telegram-bot/SPEC.md, "Build: B1"). The owner's
// words are marked "owner"; the rest are drafts, refined with the readability
// work in Claude Chat.
// [2026-11-15] House style C (owner, 15 Nov; preview in
// docs/handoffs/2026-11-15-readability-style-c-preview.html): line breaks
// between ideas, short lines, <b>bold</b> for the habit and section names, at
// most one emoji per section. Messages are sent in Telegram's formatting mode
// (HTML), so anything a person typed or the database holds goes through esc()
// first: "Tom & <Jerry>" shows exactly as typed and can't add formatting or
// break the message. Pop-ups (pickLimit, expired, undoExpired, alreadySaved,
// alreadyAnswered) and Menu descriptions are plain text: Telegram shows them as is.
// =============================================================================

import { daysBetween, formatTime, toSgt, weekdayOf } from "../sgt.js";
import { DEFAULT_FREQUENCIES, SIGN_UP_DRAFT_KEEP_DAYS, WEB_PAGES } from "../settings.js";

// [2026-11-15] Make text safe for Telegram's formatting mode: the three
// characters it treats as special become their written-out forms.
export const esc = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// "7:00pm" from formatTime becomes "7:00 pm", the owner's agreed style.
export const spacedTime = (minutes: number) => formatTime(minutes).replace(/(am|pm)$/, " $1");

// [2026-11-12] Review fix F1: how each frequency is said, so screen 8 always
// matches the defaults in src/settings.ts (rule 1.4). A frequency missing here
// fails the type check, never shows a made-up phrase.
// [2026-11-15] Now said as headings in the plan (style C), e.g. "Every 2 days".
const FREQUENCY_TITLES: Record<(typeof DEFAULT_FREQUENCIES)[keyof typeof DEFAULT_FREQUENCIES], string> = {
  every_2_days: "Every 2 days",
  once_a_week: "Once a week",
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
// [2026-11-15] Each name is made safe (esc), as names are typed by a parent.
export const joinNames = (names: string[]) =>
  names.length <= 1 ? esc(names[0] ?? "") : `${names.slice(0, -1).map(esc).join(", ")} and ${esc(names.at(-1)!)}`;

export const WORDS = {
  // ---- Sign-up ----
  welcome: (firstName: string) =>
    `<b>Thanks for joining, ${esc(firstName)}!</b> 👋\n\nWe'll keep your answers for ${SIGN_UP_DRAFT_KEEP_DAYS} days while you set up, and may send you one reminder to finish.\n\nNothing is saved for good until you agree.`,
  changeNameButton: "Change name",
  askFirstName: "<b>What should we call you?</b>\nType your first name.",
  thanksName: (firstName: string) => `Thanks, ${esc(firstName)}!`,
  childQuestion: "<b>What's your child's name?</b>\nType their first name. A nickname works too.",
  otherChildQuestion: "What's your other child's name?",
  anyOtherChildren: (names: string[]) => `<b>${joinNames(names)}.</b> Any other children?`,
  addChildButton: "+ Add another child",
  thatsAllButton: "That's all ➡️",
  takingTurns: (names: string[]) =>
    `<b>${joinNames(names)}.</b> Lovely!\n\nTo keep things fresh, we'll take turns naming one of them in each reminder.\n\nIt's just a suggestion: do it with whoever you like.`,
  nameTooLong: (max: number) => `Please type a name of up to ${max} characters.`, // draft
  welcomeBack: "👋 <b>Welcome back!</b> Let's carry on.", // Q10e, style C
  signUpReminder: "⏳ <b>You're almost there!</b>\nTap below to continue where you left off.",
  continueButton: "Continue ➡️",
  signUpExpired: "This sign-up has expired.\nPlease open your invite link again to start over.",
  noCode: "Hi! This app is invite-only for now.\nPlease use the invite link you were sent.", // Q10d
  badCode: "Sorry, that invite code doesn't work.\nPlease ask the person who invited you for your own link.", // Q10c
  alreadySignedUp: "You're already signed up.", // draft
  signUpFirst: "Please sign up with your invite link first.", // draft
  greetOneChild: (child: string, firstName: string) => `Nice to meet you, ${esc(child)}'s parent, ${esc(firstName)}!`,
  greetManyChildren: (firstName: string) => `Nice to meet you, ${esc(firstName)}!`, // Q4
  quickIntro: "⚡ <b>Quick behaviours</b>\nPick up to 2 to work on.",
  // [2026-11-15] A picked option shows ✅, the same mark as Done (owner). Button words are plain text.
  ticked: (name: string) => `✅ ${name}`,
  nextButton: "Next ➡️",
  pickLimit: "You can pick up to 2.", // pop-up
  deliberateIntro: "📅 <b>Deliberate behaviours</b>\nNow pick 1. These take some planning, so it's optional.",
  deliberateNeeded: "📅 <b>Deliberate behaviours</b>\nNow pick 1 to get started.",
  skipButton: "Skip for now ➡️",
  // [2026-11-15] Picks numbered, one per line (owner).
  picked: (names: string[]) =>
    names.length > 0 ? `<b>Picked:</b>\n${names.map((n, i) => `${i + 1}. ${esc(n)}`).join("\n")}` : "<b>Picked:</b> none", // draft
  skipped: "Skipped for now.", // draft
  schoolTimes: (minutes: number[]) =>
    `🏫 <b>School days:</b> ${minutes.length} reminder times\n\n${minutes.map(spacedTime).join(" · ")}\n\nAt most 1 reminder each time, and 3 a day.\nChange these anytime in Settings.`,
  weekendTimes: (minutes: number[]) =>
    `🌤 <b>Weekends and school holidays:</b> ${minutes.length} reminder times\n\n${minutes.map(spacedTime).join(" · ")}\n\nAt most 1 reminder each time, and 3 a day.\nChange these anytime in Settings.`,
  okButton: "OK ➡️",
  plan: (quick: string[], deliberate: string | null, wrapUpMinute: number) =>
    [
      "<b>Your reminders</b>",
      ...(quick.length > 0 ? [`🔁 <b>${FREQUENCY_TITLES[DEFAULT_FREQUENCIES.quick]}</b>\n${quick.map((q) => `• ${esc(q)}`).join("\n")}`] : []),
      ...(deliberate ? [`📅 <b>${FREQUENCY_TITLES[DEFAULT_FREQUENCIES.deliberate]}</b>\n• ${esc(deliberate)}`] : []),
      `📝 <b>Week wrap up:</b> Sunday ${spacedTime(wrapUpMinute)}`,
      "Change these anytime in Settings.",
    ].join("\n\n"),
  // [2026-11-15] With a link to the Terms & Conditions page (a plain page until the owner fills it in).
  agreement: `🔒 <b>Before we start</b>\n\nWe record what you log and when, so we can see what helps families.\n\nYour data is never sold or shared.\n\nYou need to agree to join.\n<a href="${WEB_PAGES.terms}">Read the Terms &amp; Conditions</a>`,
  agreeButton: "✅ I agree", // rule 11.9
  agreed: "✅ You agreed.",
  startedButton: "💪 I've started!", // owner, 15 Nov
  notNowButton: "Not now",
  // [2026-11-15] Screen 10: the behaviour's fixed line from the database ("Start
  // right now, and … with {child}. <idea>"), made safe, with "Start right now" in
  // bold and the idea on its own line after 💡.
  startNow: (line: string, child: string) => {
    const text = esc(line).replaceAll("{child}", esc(child)).replace(/^Start right now,?/, "<b>Start right now</b>");
    const split = text.indexOf(". ");
    return split < 0 ? text : `${text.slice(0, split + 1)}\n\n💡 ${text.slice(split + 2)}`;
  },
  notNow: (when: string) => `No problem. Your first reminder is ${when}.`,
  allSet: (firstName: string, when: string) => `🎉 <b>You're all set, ${esc(firstName)}.</b>\n\nYour next reminder is ${when}.`,
  notNowNoReminder: "No problem. We'll remind you when one of your habits is next due.",
  allSetNoReminder: (firstName: string) => `🎉 <b>You're all set, ${esc(firstName)}.</b>\n\nWe'll remind you when one of your habits is next due.`,
  allSetUnknown: (firstName: string) => `🎉 <b>You're all set, ${esc(firstName)}.</b>\n\n🙇 Sorry, we couldn't check when your next reminder is.`,
  notNowUnknown: "No problem.\n🙇 Sorry, we couldn't check when your first reminder is.", // draft, rule 1.3
  myPage: "Your page is here whenever you want to look back. It's empty for now.",
  openMyPageButton: "Open my page ↗",
  startNowNotSaved: "🙇 Sorry, this couldn't be saved, so its buttons won't work.", // draft, rule 1.3
  startNowNotShown: "🙇 Sorry, Start right now couldn't be shown.\nYou're signed up.", // [2026-11-12] draft, review fix F3
  unrecognised: "Unrecognised text.", // owner, 11 Nov
  // ---- Reminders ----
  // [2026-11-15] The habit first, in bold, then the child; the idea after 💡 (owner, style C).
  nudge: (name: string, child: string | null, example: string) => `<b>${esc(name)}</b> · with ${child ? esc(child) : "your child"}\n\n💡 ${esc(example)}`,
  doneButton: "✅ Done",
  notTodayButton: "😴 Not today",
  receipt: (name: string) => `✅ <b>Saved</b>\n${esc(name)} today.`, // rule 7.5, fixed; "Saved" on its own line (owner)
  notToday: "😴 <b>Not today.</b> That's completely fine.\n\nNo more reminders today.\nWe'll be back tomorrow.", // B1 part 2, style C
  expired: "Reminder has expired. Tap a behaviour on the keyboard to log today.", // owner, 9 Nov; pop-up
  alreadySaved: "Already saved.", // draft; pop-up, or a message for a resent keyboard tap
  alreadyAnswered: "Already answered.", // [2026-11-12] draft, rule 5.10; pop-up
  didNotSave: "🙇 Sorry, that didn't save. Please try again.", // draft, rule 1.3
  signUpFailed: "🙇 Sorry, that didn't work. Please try again.", // draft, rule 1.3
  nudgeNotSaved: "🙇 Sorry, this reminder couldn't be saved, so its buttons won't work.", // [2026-11-13] W6, rule 1.3
  // ---- Logging any time ----
  keyboardLabel: (name: string) => `✅ ${name}`, // a keyboard button: plain text
  receiptAgain: (name: string) => `✅ <b>Saved</b>\n${esc(name)}, again today.\nIt counts once for your week.`,
  undoButton: "Undo",
  undone: "Undone. It won't count.", // rule 5.8
  undoExpired: "Undo expired.", // owner, B1-D1; pop-up
  logPrompt: "<b>Which one did you do today?</b>", // draft
  noBehaviours: "You haven't chosen any habits yet.\nYou can choose them in Settings.", // draft
  // ---- Menu and help ----
  myPageLink: "Here's your page.", // draft
  settingsLink: "Change your times and habits in Settings.", // draft
  openSettingsButton: "Open Settings ↗", // draft
  pauseLink: "To pause your reminders, open Settings.", // draft (B1-D3: pausing happens in Settings)
  alreadyPaused: "Your reminders are already paused.", // draft, B1-D8
  alreadyOn: "Your reminders are already on.", // draft, B1-D8
  resumeQuestion: "<b>Resume your reminders?</b>", // owner, B1 tests
  resumeButton: "✅ Resume",
  cancelButton: "Cancel",
  resumed: "✅ <b>Your reminders are back on.</b>", // draft
  resumeCancelled: "OK, your reminders stay paused.", // draft
  help:
    "<b>How this works</b>\n\n✍️ <b>Log:</b> tap a habit on the keyboard below.\n\n⏰ <b>Reminders</b> come at your chosen times.\nTap ✅ Done or 😴 Not today.\n\n☰ <b>Menu</b>\n/log · log a habit\n/mypage · your page\n/settings · your times and habits\n/pause · /resume · your reminders",
  menu: {
    log: "Log a behaviour for today",
    mypage: "Your page",
    settings: "Your times and habits",
    pause: "Pause your reminders",
    resume: "Resume your reminders",
    help: "How this works",
  },
} as const;
