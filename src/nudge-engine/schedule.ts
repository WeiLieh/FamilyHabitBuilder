// =============================================================================
// src/nudge-engine/schedule.ts: school/non-school days and nudge slots
//
// What it does (spec v1.7):
//   - dayTypeFor: is a day a school day or a non-school day?
//   - checkSchedules: are a parent's chosen slots allowed?
//   - availableSlotStarts: which times the setup screen should grey out
//
// A "slot" is a 30-minute block when the parent agrees we MAY send a nudge
// message. Slots belong to the parent and are shared by all their behaviours.
// Each parent has two schedules: school days and non-school days.
// =============================================================================

import {
  MAX_SLOTS_PER_SCHEDULE,
  MIN_SLOT_GAP_MINUTES,
  SLOT_STARTS,
} from "../settings.js";
import { formatTime, weekdayOf } from "../sgt.js";

// A parent's slots: start times in minutes after midnight, Singapore time.
export type Schedules = { school: number[]; nonSchool: number[] };

// Holiday dates uploaded by the owner before launch ("YYYY-MM-DD").
export type Holidays = { publicHolidays: string[]; schoolHolidays: string[] };

export type DayType = "school" | "non_school";

// School day = Monday to Friday, not a public holiday, not an MOE school
// holiday. Everything else is a non-school day (spec v1.7, answer 11).
export function dayTypeFor(date: string, holidays: Holidays): DayType {
  const weekday = weekdayOf(date);
  const isWeekend = weekday === 0 || weekday === 6;
  if (isWeekend) return "non_school";
  if (holidays.publicHolidays.includes(date)) return "non_school";
  if (holidays.schoolHolidays.includes(date)) return "non_school";
  return "school";
}

export type ScheduleCheck = { ok: true } | { ok: false; reasons: string[] };

// Checks one schedule's slots, adding any problems to "reasons".
function checkOneSchedule(slots: number[], label: string, reasons: string[]): void {
  if (slots.length > MAX_SLOTS_PER_SCHEDULE) {
    reasons.push(`You can choose up to ${MAX_SLOTS_PER_SCHEDULE} nudge times for ${label}.`);
  }
  for (const start of slots) {
    if (!SLOT_STARTS.includes(start)) {
      reasons.push(`${formatTime(start)} is not one of the nudge times (7:00am to 9:30pm, on the hour or half hour).`);
    }
  }
  // Compare every pair of slots once.
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i] as number;
      const b = slots[j] as number;
      if (Math.abs(a - b) < MIN_SLOT_GAP_MINUTES) {
        reasons.push(`Nudge times for ${label} must be at least 1 hour apart (${formatTime(a)} and ${formatTime(b)}).`);
      }
    }
  }
}

export function checkSchedules(schedules: Schedules): ScheduleCheck {
  const reasons: string[] = [];
  checkOneSchedule(schedules.school, "school days", reasons);
  checkOneSchedule(schedules.nonSchool, "non-school days", reasons);
  if (schedules.school.length + schedules.nonSchool.length === 0) {
    reasons.push("Please keep at least 1 nudge time. To take a break, use pause instead.");
  }
  return reasons.length > 0 ? { ok: false, reasons } : { ok: true };
}

export type SlotOption =
  | { start: number; available: true }
  | { start: number; available: false; reason: "used" | "too_close" };

// For the setup screen: when the parent edits slot number "editingIndex" of a
// schedule, which times can they pick? Times used by their other slots, or
// less than 1 hour from them, are unavailable (greyed out).
export function availableSlotStarts(slots: number[], editingIndex: number): SlotOption[] {
  const others = slots.filter((_, i) => i !== editingIndex);
  return SLOT_STARTS.map((start): SlotOption => {
    if (others.includes(start)) return { start, available: false, reason: "used" };
    if (others.some((other) => Math.abs(other - start) < MIN_SLOT_GAP_MINUTES)) {
      return { start, available: false, reason: "too_close" };
    }
    return { start, available: true };
  });
}
