// =============================================================================
// src/nudge-engine/next-reminder.ts: "your next reminder is …" (rule 3.17)
//
// What it does: [2026-11-13] sign-up screens 10 and 11 tell the parent when
// their next reminder comes. nextReminder walks forward through the parent's
// slots, from now on, and asks the planner at each slot's start: "would you
// send a nudge here?" The first yes is the answer. It looks
// NEXT_REMINDER_LOOK_AHEAD_DAYS days ahead (src/settings.ts), assuming nothing more is
// logged; no yes in that time, or paused, means "no next reminder".
//
// Why reuse the planner instead of a second set of rules: the promise on
// screen 11 then always matches what the planner will really do (school and
// non-school days, holidays, due behaviours, Friday and Sunday for deliberate
// ones, a slot that already started is skipped, rule 3.1).
//
// No clock reading and no web calls: "now" is in the input, so every
// situation can be tested exactly. Replaces the temporary "7:00 pm" line (D1)
// once pull request 3c uses it.
// =============================================================================

import { planNudge, type PlannerInput } from "./planner.js";
import { dayTypeFor } from "./schedule.js";
import { NEXT_REMINDER_LOOK_AHEAD_DAYS } from "../settings.js";
import { addDays, sgtInstant, toSgt } from "../sgt.js";

export type NextReminder = { date: string; slotStart: number; nudgeId: number };

export function nextReminder(input: PlannerInput): NextReminder | null {
  if (input.paused) return null; // nothing is sent while paused (rule 3.6)
  const today = toSgt(input.now).date;

  for (let day = 0; day < NEXT_REMINDER_LOOK_AHEAD_DAYS; day++) {
    const date = addDays(today, day);
    // That day's slots: school-day or non-school-day schedule (rule 3.2), earliest first.
    const slots = dayTypeFor(date, input.holidays) === "school" ? input.schedules.school : input.schedules.nonSchool;
    for (const slotStart of [...slots].sort((a, b) => a - b)) {
      const start = sgtInstant(date, slotStart);
      if (start <= input.now) continue; // a slot that has already started is skipped
      // Ask the planner as if it were that slot's start.
      const plan = planNudge({ ...input, now: start });
      if (plan.send) return { date, slotStart, nudgeId: plan.nudgeId };
    }
  }
  return null; // nothing would be sent within the look-ahead (NEXT_REMINDER_LOOK_AHEAD_DAYS)
}
