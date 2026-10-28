// =============================================================================
// shared/nudge-engine/due.ts: is a behaviour "due"?
//
// A behaviour is due when the parent hasn't done it yet within the frequency
// THEY chose (spec v1.7). The frequency is how often they want to DO it; we
// only remind them while it is still undone.
//   quick, every day:      due if not logged today
//   quick, every 2 days:   due if not logged today or yesterday
//   deliberate:            due if logged fewer times this week (Mon to Sun)
//                          than chosen (1 or 2)
// A behaviour logged twice on one day counts once. Logs are Singapore days.
// =============================================================================

import type { Target } from "./choices.js";
import { addDays, daysBetween, mondayOf } from "../sgt.js";

export function isDue(target: Target, logDates: string[], today: string): boolean {
  const days = new Set(logDates); // a Set keeps each day once
  switch (target.frequency) {
    case "every_day":
      return !days.has(today);
    case "every_2_days":
      return !days.has(today) && !days.has(addDays(today, -1));
    case "once_a_week":
    case "twice_a_week": {
      const wanted = target.frequency === "once_a_week" ? 1 : 2;
      const monday = mondayOf(today);
      const doneThisWeek = [...days].filter((d) => d >= monday && d <= today).length;
      return doneThisWeek < wanted;
    }
  }
}

// Days since the behaviour was last logged (0 = today), or null if never.
export function daysSinceLastLog(logDates: string[], today: string): number | null {
  const past = logDates.filter((d) => d <= today);
  if (past.length === 0) return null;
  const latest = past.reduce((a, b) => (a > b ? a : b));
  return daysBetween(latest, today);
}
