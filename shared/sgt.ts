// =============================================================================
// shared/sgt.ts: Singapore time helpers
//
// What it does: converts between a moment in time and a Singapore calendar day
// plus "minutes after midnight", and does simple calendar maths on days.
//
// Why: everything in the app runs on Singapore days (spec: a day is midnight to
// midnight, Singapore time). Servers and Supabase use UTC (world time), which is
// 8 hours behind. Singapore has no daylight saving, so the offset is always +8h.
//
// Days are written as text "YYYY-MM-DD" (e.g. "2026-11-04"), so they are easy
// to read, compare and store.
// =============================================================================

const SGT_OFFSET_MINUTES = 8 * 60;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

// A moment in time -> its Singapore day and minutes after midnight.
export function toSgt(instant: Date): { date: string; minutes: number } {
  // Shift by +8 hours, then read the result as if it were UTC.
  const shifted = new Date(instant.getTime() + SGT_OFFSET_MINUTES * MS_PER_MINUTE);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

// A Singapore day plus minutes after midnight -> that moment in time.
export function sgtInstant(date: string, minutes: number): Date {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  return new Date(midnightUtc + (minutes - SGT_OFFSET_MINUTES) * MS_PER_MINUTE);
}

// "2026-11-04" plus 2 days -> "2026-11-06" (negative numbers go back).
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Day of the week: 0 = Sunday, 1 = Monday ... 6 = Saturday.
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// The Monday that starts this day's week (weeks run Monday to Sunday).
export function mondayOf(date: string): string {
  const weekday = weekdayOf(date);
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

// Whole days from "earlier" to "later" (e.g. yesterday to today = 1).
export function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / MS_PER_DAY);
}

// 1140 -> "7:00pm", for messages people read.
export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}
