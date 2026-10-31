// =============================================================================
// shared/nudge-engine/planner.ts: the Nudge engine's "decisions" brain
//
// What it does: every few minutes the scheduler (Supabase Cron) asks, for each
// parent, "should we send a nudge message right now, and about which
// behaviour?" planNudge answers "send nudge X in this slot" or "don't send"
// with a reason. It only decides; it doesn't send anything or write the words
// (Claude writes the words later, adding the time-of-day context).
//
// The sender must call planNudge again immediately before sending (test 15),
// so a behaviour logged a moment ago is never nudged.
//
// Rules, in the order they are checked (spec v1.7, Batch 2 tests):
//   1. Nothing while paused, or after "Not today" (until tomorrow).
//   2. Only inside one of today's slots (today's schedule: school or
//      non-school day), never after the slot ends; not in a slot that was
//      changed after it started.
//   3. At most 1 nudge message per slot and 3 per day. Replies never count.
//   4. Pick the most important behaviour that is due and allowed today:
//      - not already nudged today
//      - quick, logged on each of the last 7 days: rests if nudged yesterday
//      - deliberate: only on Friday (planning) and Sunday (if still due)
//      Order: quick below the floor (not logged for 2+ days; longest first),
//      then other quick, then deliberate; ties go to the one picked first.
//   5. Nothing due -> nothing sent (never pushy).
//
// No web calls and no clock reading inside: "now" is passed in, so every
// situation can be tested exactly.
// =============================================================================

import type { Target } from "./choices.js";
import { daysSinceLastLog, isDue } from "./due.js";
import { dayTypeFor, type Holidays, type Schedules } from "./schedule.js";
import {
  DELIBERATE_NUDGE_WEEKDAYS,
  MAX_NUDGES_PER_DAY,
  SLOT_LENGTH_MINUTES,
  STREAK_DAYS_FOR_FEWER_NUDGES,
} from "../settings.js";
import { addDays, sgtInstant, toSgt, weekdayOf } from "../sgt.js";

// A message the bot has sent to this parent. Only kind "nudge" counts toward
// the daily cap; "reply" is anything said in answer to the parent.
export type SentMessage = {
  kind: "nudge" | "reply";
  date: string; // Singapore day it was sent
  slotStart?: number; // which slot, for nudge messages
  nudgeId?: number; // which behaviour, for nudge messages
};

// One logged behaviour, stored under the Singapore day it counts for (which
// can be yesterday if the parent logged late).
export type LogEntry = { nudgeId: number; date: string };

export type PlannerInput = {
  now: Date;
  targets: Target[]; // in the order the parent picked them
  schedules: Schedules;
  holidays: Holidays;
  logs: LogEntry[];
  messagesSent: SentMessage[];
  notTodayDate: string | null; // the day the parent last tapped "Not today"
  paused: boolean;
  slotsChangedAt: Date | null; // when the parent last changed their slots
};

export type NoNudgeReason =
  | "paused"
  | "not_today"
  | "no_slot_now"
  | "slot_changed"
  | "slot_already_used"
  | "daily_cap_reached"
  | "nothing_due";

export type PlannerResult =
  | { send: true; nudgeId: number; slotStart: number }
  | { send: false; reason: NoNudgeReason };

export function planNudge(input: PlannerInput): PlannerResult {
  const { date: today, minutes } = toSgt(input.now);

  // ---- 1. The parent's own choices come first ----
  if (input.paused) return { send: false, reason: "paused" };
  if (input.notTodayDate === today) return { send: false, reason: "not_today" };

  // ---- 2. Are we inside one of today's slots? ----
  const slots = dayTypeFor(today, input.holidays) === "school" ? input.schedules.school : input.schedules.nonSchool;
  const slotStart = slots.find((start) => minutes >= start && minutes < start + SLOT_LENGTH_MINUTES);
  if (slotStart === undefined) return { send: false, reason: "no_slot_now" };
  // A slot added or moved after it already started waits until next time.
  if (input.slotsChangedAt !== null && input.slotsChangedAt > sgtInstant(today, slotStart)) {
    return { send: false, reason: "slot_changed" };
  }

  // ---- 3. Limits: 1 per slot, 3 per day (nudge messages only) ----
  const nudgesToday = input.messagesSent.filter((m) => m.kind === "nudge" && m.date === today);
  if (nudgesToday.some((m) => m.slotStart === slotStart)) return { send: false, reason: "slot_already_used" };
  if (nudgesToday.length >= MAX_NUDGES_PER_DAY) return { send: false, reason: "daily_cap_reached" };

  // ---- 4. Which behaviours are due and allowed today? ----
  const yesterday = addDays(today, -1);
  const weekday = weekdayOf(today);
  const nudgedOn = (day: string, nudgeId: number) =>
    input.messagesSent.some((m) => m.kind === "nudge" && m.date === day && m.nudgeId === nudgeId);

  type Candidate = { target: Target; pickedOrder: number; group: number; daysSince: number };
  const candidates: Candidate[] = [];

  input.targets.forEach((target, pickedOrder) => {
    // Logs of this behaviour only (logs of unchosen behaviours are ignored).
    const logDates = input.logs.filter((l) => l.nudgeId === target.nudgeId).map((l) => l.date);
    if (!isDue(target, logDates, today)) return;
    if (nudgedOn(today, target.nudgeId)) return; // at most once a day

    const since = daysSinceLastLog(logDates, today);
    const daysSince = since === null ? Number.POSITIVE_INFINITY : since; // never logged = longest

    if (target.category === "quick") {
      // Logged on each of the last 7 days: give the habit room (every other day).
      const streak = Array.from({ length: STREAK_DAYS_FOR_FEWER_NUDGES }, (_, i) => addDays(today, -(i + 1)));
      const onStreak = streak.every((day) => logDates.includes(day));
      if (onStreak && nudgedOn(yesterday, target.nudgeId)) return;
      // Below the floor = not logged today or yesterday.
      const belowFloor = daysSince >= 2;
      candidates.push({ target, pickedOrder, group: belowFloor ? 0 : 1, daysSince });
    } else {
      // Deliberate: Friday (planning) and Sunday (if still due) only.
      if (!DELIBERATE_NUDGE_WEEKDAYS.includes(weekday)) return;
      candidates.push({ target, pickedOrder, group: 2, daysSince });
    }
  });

  // ---- 5. Most important first ----
  candidates.sort((a, b) => {
    if (a.group !== b.group) return a.group - b.group; // below floor, other quick, deliberate
    if (a.group === 0 && a.daysSince !== b.daysSince) return b.daysSince - a.daysSince; // longest first
    return a.pickedOrder - b.pickedOrder; // tie: the one picked first
  });

  const chosen = candidates[0];
  if (chosen === undefined) return { send: false, reason: "nothing_due" };
  return { send: true, nudgeId: chosen.target.nudgeId, slotStart };
}
