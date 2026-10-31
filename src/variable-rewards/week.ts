// =============================================================================
// src/variable-rewards/week.ts: which week a log belongs to, and whether it counts
//
// What it does: a week runs Monday to Sunday, Singapore time (rule 1.2), and is
// judged (steady week or not, rule 7.6) when it CLOSES at midnight on Sunday
// (decision D5b, 31 Oct). Parents may log late, back to yesterday (rule 5.4).
// So a log made on Monday "for yesterday" (Sunday) arrives after Sunday's week
// has closed. weekForLog says:
//   - week: the Monday of the week the log belongs to (where the album shows it)
//   - counts: whether it still counts toward that week's result
//   - reason "week_closed": the log is saved, but the bot's receipt must say so
//     honestly, e.g. "Saved for Sunday. Last week has closed, so it's in your
//     album but not in last week's count."
// A late log never moves into the new week either: it is about Sunday.
//
// Why it matters: a week's result must not change after the parent has seen
// it, and the parent must never be told a log counted when it didn't
// (rule 1.3, no made-up results).
//
// No clock reading inside: the moment of logging is passed in, so every
// situation can be tested exactly.
// =============================================================================

import { mondayOf, toSgt } from "../sgt.js";

export type LogTiming = {
  date: string; // the Singapore day the log is for ("2026-11-08"), today or yesterday
  loggedAt: Date; // the moment the parent actually logged it
};

export type WeekForLog =
  | { week: string; counts: true }
  | { week: string; counts: false; reason: "week_closed" };

export function weekForLog(log: LogTiming): WeekForLog {
  // The week the log is about: the Monday on or before its day.
  const week = mondayOf(log.date);
  // The week in which the parent actually logged it, in Singapore time.
  const loggedInWeek = mondayOf(toSgt(log.loggedAt).date);
  // Logged in a later week = that week closed at midnight on Sunday first.
  if (loggedInWeek !== week) return { week, counts: false, reason: "week_closed" };
  return { week, counts: true };
}
