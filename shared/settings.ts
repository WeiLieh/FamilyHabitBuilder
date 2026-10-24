// =============================================================================
// shared/settings.ts: starting values (hypotheses) used by the Nudge engine
//
// The source of truth for these numbers is docs/EXPERIMENTS.md, under
// "Starting values". If you change a number here, change it there too (and the
// other way round). A test checks the choice limits match what was agreed.
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
// in supabase/migrations/001_create_nudge_repository.sql: change both together.
export const MIN_EXAMPLES_PER_NUDGE = 3;
