// =============================================================================
// src/settings.ts: starting values (hypotheses) used by the Nudge engine
//
// [31 Oct] This file is the ONE place these numbers live (rule 1.4). The
// Experiments module (src/experiments/SPEC.md) will record which values each
// parent had; src/experiments/EXPERIMENTS.md describes the experiments in plain English
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
// change only the time (any slot start, 7:00am to 9:30pm). It has no on/off
// switch of its own (owner, 9 Nov): the one Pause switch stops it.
// Day of the week it is sent: 0 = Sunday.
export const WEEKLY_WRAP_UP_WEEKDAY = 0;
// Every new parent starts at 8:00pm (20 x 60 = 1200 minutes).
export const DEFAULT_WEEKLY_WRAP_UP = { minutes: 20 * 60 };

// ---- Moved here on 1 Nov (decision L, rule 1.4): numbers that lived in the Nudge engine ----
// Frequencies a parent can choose for a quick behaviour (value 8 in src/experiments/EXPERIMENTS.md).
export const QUICK_FREQUENCIES: readonly string[] = ["every_day", "every_2_days"];
// Frequencies for a deliberate behaviour, and how many times a week each one means.
export const DELIBERATE_FREQUENCY_TIMES_PER_WEEK: Readonly<Record<string, number>> = {
  once_a_week: 1,
  twice_a_week: 2,
};
// The floor for quick behaviours (value 9): not logged for this many days or more
// (that is, not today or yesterday) puts the behaviour first in line for a nudge.
export const QUICK_FLOOR_DAYS = 2;

// ---- Children's ages (rules 8.10 and 10.4, decided 1 Nov) ----------------------
// A birth year is accepted if the child is 0 to 25 (a year in the future, or more
// than 25 years ago, is refused). Children outside the app's 7 to 12 range are
// accepted but flagged for Telemetry, never turned away at sign-up.
export const CHILD_AGE_ACCEPTED = { youngest: 0, oldest: 25 };
export const CHILD_AGE_TARGET = { youngest: 7, oldest: 12 };


// ---- Time windows (rules 5.6, 5.8, 7.7; owner, 8 and 9 Nov; added 11 Nov) ------
// Undo: a keyboard log can be undone for this many seconds (rule 5.8).
export const UNDO_WINDOW_SECONDS = 30;
// The weekly connection question can be answered for this many hours after it
// is sent (rule 5.6). The message says "Question expires in 24 hrs".
export const CONNECTION_ANSWER_WINDOW_HOURS = 24;
// After "Add a moment from this week", the bot waits this many hours for the
// photo or line (rule 7.7). Checked by the app only: the database can't see
// the button tap.
export const MOMENT_WINDOW_HOURS = 24;
// [2026-11-12] An unfinished sign-up (rule 8.13, Q11, owner 12 Nov): after this
// many quiet days the draft is cut down to the Telegram ID and the last step,
// and its invite is released (Q11a); after this many, the cut-down record is
// deleted completely (Q11d). Read by the database's clean-up (migration 007).
export const SIGN_UP_DRAFT_KEEP_DAYS = 7;
export const SIGN_UP_STOPPED_KEEP_DAYS = 90;
// The database also checks the first two (migration 005): it reads them from
// the settings version stamped on each event, under exactly these names. So
// every settings version the app records must include this list.
export const SETTINGS_KEYS_THE_DATABASE_READS = {
  undo_window_seconds: UNDO_WINDOW_SECONDS,
  connection_answer_window_hours: CONNECTION_ANSWER_WINDOW_HOURS,
  // [2026-11-12] Read by clean_up_sign_ups (migration 007).
  sign_up_draft_keep_days: SIGN_UP_DRAFT_KEEP_DAYS,
  sign_up_stopped_keep_days: SIGN_UP_STOPPED_KEEP_DAYS,
} as const;

// ---- Thin slice 1 (owner, 11 Nov) -------------------------------------------
// The cohort every parent joins in week one (rule 11.11: a neutral label).
export const WEEK_ONE_COHORT = "cohort-1";
// The experiment stamp on every event in week one (rule 11.3).
export const WEEK_ONE_VARIANTS: readonly string[] = ["baseline"];
// The one fixed nudge of thin slice 1: Showing affection, every day at 7:00 pm
// (19 x 60 = 1140 minutes after midnight, Singapore time). Replaced by the
// parent's own picks and times in a later slice.
export const THIN_SLICE_NUDGE = { code: "SAF", slotMinute: 19 * 60 } as const;
// The wording version of the recording agreement shown at sign-up (still a draft, Q8).
export const AGREEMENT_WORDING_VERSION = "draft-2026-11-11";
