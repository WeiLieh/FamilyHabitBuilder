// =============================================================================
// shared/settings.ts: starting values (hypotheses) used by the Nudge engine
//
// The source of truth for these numbers is docs/EXPERIMENTS.md, under
// "Starting values". If you change a number here, change it there too (and the
// other way round). A test checks the choice limits match what was agreed.
// Later, experiments may give some parents different values, and unlocks may
// raise the limits for a parent who earns them.
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
