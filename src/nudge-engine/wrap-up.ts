// =============================================================================
// src/nudge-engine/wrap-up.ts: decides when to send the Weekly Wrap Up
//
// What it does: the Weekly Wrap Up (rule 3.12, decision D7) is a different kind
// of message from a nudge message. Once a week, on Sunday, at a time the parent
// can change (default 8:00pm), it sums up "this week so far" and invites the
// parent to save one moment for the family album. The scheduler asks
// planWeeklyWrapUp every few minutes, for each parent: "send it now?" It
// answers "send" or "don't send" with a reason. It only decides; it doesn't
// send anything or write the words.
//
// Why it is separate from planner.ts: the Wrap Up doesn't use the parent's
// nudge slots (parents with no Sunday slots still get it) and never counts
// toward the 3-a-day cap or the 1-per-slot limit (rule 3.4).
//
// Rules, in the order they are checked:
//   1. Not sent if the parent turned it off, or paused (muted) the bot.
//      ("Not today" stops nudge messages only, so it is not an input here.)
//   2. Only on Sunday, from the parent's chosen time until midnight. If the
//      scheduler is late, it still goes out later that Sunday, never Monday.
//   3. At most once a week, even if the parent changes the time after it went.
//   4. Only if the parent logged at least once this week (Monday to Sunday).
//      Any log counts, including behaviours the parent didn't choose.
//
// No web calls and no clock reading inside: "now" is passed in, so every
// situation can be tested exactly.
// =============================================================================

import type { LogEntry, SentMessage } from "./planner.js";
import { SLOT_STARTS, WEEKLY_WRAP_UP_WEEKDAY } from "../settings.js";
import { mondayOf, toSgt, weekdayOf } from "../sgt.js";

// The parent's Wrap Up setting: on or off, and the time (minutes after
// midnight, Singapore time; 1200 = 8:00pm). The day is always Sunday.
export type WrapUpSettings = { enabled: boolean; minutes: number };

export type WrapUpInput = {
  now: Date;
  wrapUp: WrapUpSettings;
  paused: boolean; // paused = muted: one setting (owner, 31 Oct)
  logs: LogEntry[]; // every log, chosen behaviour or not
  messagesSent: SentMessage[];
};

export type NoWrapUpReason = "turned_off" | "paused" | "not_sunday" | "too_early" | "already_sent" | "nothing_logged";

export type WrapUpResult = { send: true } | { send: false; reason: NoWrapUpReason };

export function planWeeklyWrapUp(input: WrapUpInput): WrapUpResult {
  const { date: today, minutes } = toSgt(input.now);

  // ---- 1. The parent's own choices come first ----
  if (!input.wrapUp.enabled) return { send: false, reason: "turned_off" };
  if (input.paused) return { send: false, reason: "paused" };

  // ---- 2. Sunday only, from the chosen time until midnight ----
  if (weekdayOf(today) !== WEEKLY_WRAP_UP_WEEKDAY) return { send: false, reason: "not_sunday" };
  if (minutes < input.wrapUp.minutes) return { send: false, reason: "too_early" };

  // ---- 3. At most once a week ----
  // "This week" = the Monday-to-Sunday week containing today (rule 1.2).
  const thisWeek = mondayOf(today);
  const sentThisWeek = input.messagesSent.some((m) => m.kind === "weekly_wrap_up" && mondayOf(m.date) === thisWeek);
  if (sentThisWeek) return { send: false, reason: "already_sent" };

  // ---- 4. Something to sum up: at least one log this week ----
  const loggedThisWeek = input.logs.some((log) => mondayOf(log.date) === thisWeek);
  if (!loggedThisWeek) return { send: false, reason: "nothing_logged" };

  return { send: true };
}

// Checks a time the parent picks on the setup screen. The choices are the
// same as for nudge slots: any 30-minute block from 7:00am to 9:30pm.
export type WrapUpTimeCheck = { ok: true } | { ok: false; reason: string };

export function checkWrapUpTime(minutes: number): WrapUpTimeCheck {
  if (SLOT_STARTS.includes(minutes)) return { ok: true };
  return { ok: false, reason: "Please pick a time on the hour or half hour, from 7:00am to 9:30pm." };
}
