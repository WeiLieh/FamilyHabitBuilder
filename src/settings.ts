// =============================================================================
// src/settings.ts: starting values (hypotheses) used by the Nudge engine
//
// [31 Oct] This file is the ONE place these numbers live (rule 1.4). The
// Experiments module (src/experiments/SPEC.md) will record which values each
// parent had; docs/EXPERIMENTS.md describes the experiments in plain English
// and points here. A test checks the choice limits match what was agreed.
// Later, experiments may give some parents different values. Unlocks do NOT
// change these limits: an unlock only opens more nudges to choose from.
// =============================================================================

// How many behaviours a parent may choose at a time (spec v1.1, v1.4).
export type ChoiceLimits = {
  maxQuick: number; // most quick nudges at once
  maxDeliberate: number; // most deliberate nudges at once
  minTotal: number; // fewest behaviours in total (any mix)
};

export const STARTING_CHOICE_LIMITS: ChoiceLimits = {
  maxQuick: 2,
  maxDeliberate: 1,
  minTotal: 1,
};

// Deliberate behaviours: "1 or 2 per week in total" across all of them (spec).
export const MAX_DELIBERATE_TIMES_PER_WEEK = 2;

// Fewest active examples a nudge should have (spec v1.6). Below this the
// nudge keeps working but is flagged to the owner, and the database refuses
// edits that would drop a nudge below it. The database copy of this number is
// in src/datastore/supabase/migrations/001_create_nudge_repository.sql: change both together.
export const MIN_EXAMPLES_PER_NUDGE = 3;

// ---- Nudge slots and timing (spec v1.7) --------------------------------------
// Times are minutes after midnight, Singapore time: 420 = 7:00am, 1290 = 9:30pm.

// How long each slot lasts. A nudge message is sent within its slot, never after.
export const SLOT_LENGTH_MINUTES = 30;

// Every slot a parent may pick: 7:00am, 7:30am ... 9:30pm (30 slots), on every day.
export const SLOT_STARTS: number[] = Array.from({ length: 30 }, (_, i) => 420 + i * SLOT_LENGTH_MINUTES);

// Slots on the same schedule must start at least this far apart.
export const MIN_SLOT_GAP_MINUTES = 60;

// Most slots per schedule (school days, non-school days).
export const MAX_SLOTS_PER_SCHEDULE = 3;

// Most nudge messages per parent per Singapore day: 3. A guardrail ceiling:
// an experiment may lower it, never raise it (rule 11.4).
// Replies never count. Kept as a safety net even though slots also limit it.
export const MAX_NUDGES_PER_DAY = 3;

// Slots every new parent starts with (spec v1.7, answers 10 and 13).
export const DEFAULT_SCHEDULES = {
  school: [420, 1140, 1260], // 7:00am "morning / to school", 7:00pm "dinner", 9:00pm "bedtime"
  nonSchool: [540, 750, 1140], // 9:00am "morning", 12:30pm "lunch", 7:00pm "dinner"
};

// A quick behaviour logged on each of this many days in a row is nudged only
// every other day, to give the habit room to become automatic (metric 7).
export const STREAK_DAYS_FOR_FEWER_NUDGES = 7;

// Days of the week on which deliberate behaviours may be nudged (spec v1.7,
// answer 28): Friday = planning for the weekend, Sunday = "still time today".
// 0 = Sunday, 5 = Friday.
export const DELIBERATE_NUDGE_WEEKDAYS = [5, 0];

// ---- Weekly Wrap Up (rule 3.12, decision D7, 31 Oct) ------------------------
// Once a week, on Sunday, a summary of "this week so far" plus an invitation to
// save a moment for the album. It is NOT a nudge message: it doesn't use a slot
// and doesn't count toward the 3-a-day cap. The day is fixed; the parent can
// change only the time (any slot start, 7:00am to 9:30pm) or turn it off.
// Day of the week it is sent: 0 = Sunday.
export const WEEKLY_WRAP_UP_WEEKDAY = 0;
// Every new parent starts with it on, at 8:00pm (20 x 60 = 1200 minutes).
export const DEFAULT_WEEKLY_WRAP_UP = { enabled: true, minutes: 20 * 60 };
