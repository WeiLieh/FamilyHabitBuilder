// =============================================================================
// src/variable-rewards/week.ts: which week a log counts for, or that it is refused
//
// What it does: a week runs Monday to Sunday, Singapore time (rule 1.2), and is
// judged (steady week or not, rule 7.6) when it closes at midnight on Sunday.
// [2026-11-11] A log is for TODAY only (rule 5.4, owner, 9 Nov): there is no
// yesterday option. weekForLog says:
//   - counts: true, with week = the Monday of the week the log counts for, or
//   - counts: false, reason "not_today": the log is for another day, so it is
//     refused (the bot saves nothing).
// Because only today's logs are accepted, a log can never arrive for a week
// that has already closed. (The earlier "week closed" answer for a Monday log
// about Sunday was removed with the rule, CLAUDE.md rule 12.)
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
  date: string; // the Singapore day the log is for ("2026-11-08")
  loggedAt: Date; // the moment the parent actually logged it
};

export type WeekForLog = { week: string; counts: true } | { counts: false; reason: "not_today" };

export function weekForLog(log: LogTiming): WeekForLog {
  // Today, in Singapore time, at the moment the parent logged.
  const today = toSgt(log.loggedAt).date;
  // Any day but today is refused (rule 5.4).
  if (log.date !== today) return { counts: false, reason: "not_today" };
  // Today's log counts for this week: the Monday on or before today.
  return { week: mondayOf(log.date), counts: true };
}
