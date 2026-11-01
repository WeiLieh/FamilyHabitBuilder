// =============================================================================
// src/datastore/children.ts: checking a child's birth year before it is saved
//
// Rule 8.10: a parent may give each child's birth year (optional; no name).
// A year in the future, or more than 25 years ago, is refused here, in the
// saving code, as well as at sign-up (the sign-up screen only offers allowed
// years). Rule 10.4: a child outside the app's 7 to 12 range is accepted but
// flagged for Telemetry. The age limits live in src/settings.ts (rule 1.4).
// =============================================================================

import { CHILD_AGE_ACCEPTED, CHILD_AGE_TARGET } from "../settings.js";

// The answer: accepted (with the worked-out age and whether to flag it), or
// refused with a plain-English reason the bot can show the parent.
export type BirthYearCheck = { ok: true; age: number; flagged: boolean } | { ok: false; reason: string };

// birthYear: what the parent chose. today: the Singapore date, "YYYY-MM-DD".
export function checkBirthYear(birthYear: number, today: string): BirthYearCheck {
  const thisYear = Number(today.slice(0, 4)); // the year part of the date
  const earliest = thisYear - CHILD_AGE_ACCEPTED.oldest; // e.g. 2027 - 25 = 2002

  // Only whole years make sense.
  if (!Number.isInteger(birthYear)) {
    return { ok: false, reason: `Please choose a year from ${earliest} to ${thisYear}.` };
  }
  if (birthYear > thisYear) {
    return { ok: false, reason: "That year is in the future." };
  }
  if (birthYear < earliest) {
    return { ok: false, reason: `Please choose a year from ${earliest} to ${thisYear}.` };
  }

  // Age to within one year (we don't ask for the birth month, on purpose).
  const age = thisYear - birthYear;
  const flagged = age < CHILD_AGE_TARGET.youngest || age > CHILD_AGE_TARGET.oldest;
  return { ok: true, age, flagged };
}
