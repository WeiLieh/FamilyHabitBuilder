// =============================================================================
// shared/nudge-engine/choices.ts: Nudge engine guardrails on a parent's choices
//
// What it does: a parent picks which nudges to work on and how often (the app
// is user-led). This function checks those picks against the app's guardrails
// and either returns them as the parent's "targets" (ready to save in the
// Datastore) or refuses them with every reason, in plain words the Telegram
// bot can show the parent.
//
// Guardrails (spec v1.1 to v1.4, starting values in docs/EXPERIMENTS.md):
//   - up to 2 quick and up to 1 deliberate behaviour, at least 1 in total
//   - quick: every day or every 2 days
//   - deliberate: 1 or 2 times a week, and 2 times a week in total at most
//   - no duplicates, and only nudges that exist in the Nudge repository
//   - only active nudges (retired ones can't be picked)
//   - only unlocked nudges: those that start unlocked, plus any this parent has
//     unlocked. An unlock opens more of the menu; it never raises the limits.
//
// The limits are passed in (not fixed inside), so experiments and unlocks can
// give a parent different limits later without changing this code.
// =============================================================================

import type { Nudge, NudgeCategory } from "../nudge-repository.js";
import { MAX_DELIBERATE_TIMES_PER_WEEK, type ChoiceLimits } from "../settings.js";

// How often a parent wants to do a behaviour.
export type Frequency = "every_day" | "every_2_days" | "once_a_week" | "twice_a_week";

// One pick by the parent: which nudge, how often.
export type Choice = { nudgeId: number; frequency: Frequency };

// One accepted pick, with its category added, ready to save as a target.
export type Target = { nudgeId: number; category: NudgeCategory; frequency: Frequency };

// The answer is either "ok, here are the targets" or "not ok, here's why".
export type ChoiceResult = { ok: true; targets: Target[] } | { ok: false; reasons: string[] };

// Which frequencies fit which category.
const QUICK_FREQUENCIES: Frequency[] = ["every_day", "every_2_days"];
const DELIBERATE_TIMES_PER_WEEK: Partial<Record<Frequency, number>> = {
  once_a_week: 1,
  twice_a_week: 2,
};

// "1 behaviour" / "2 behaviours"
function behaviours(count: number): string {
  return count === 1 ? "1 behaviour" : `${count} behaviours`;
}

// unlockedByParent: IDs of nudges this parent has unlocked (from the Datastore).
// How a parent earns an unlock is still being decided (WIP in the backlog).
export function checkChoices(
  choices: Choice[],
  nudges: Nudge[],
  limits: ChoiceLimits,
  unlockedByParent: number[] = [],
): ChoiceResult {
  const reasons: string[] = [];

  // A quick way to look up a nudge by its ID.
  const nudgeById = new Map(nudges.map((nudge) => [nudge.id, nudge]));

  // Rule: at least the minimum number of behaviours.
  if (choices.length < limits.minTotal) {
    reasons.push(`Please choose at least ${behaviours(limits.minTotal)}.`);
  }

  const seen = new Set<number>(); // IDs already looked at, to catch duplicates
  const targets: Target[] = [];
  let quickCount = 0;
  let deliberateCount = 0;
  let deliberateTimesPerWeek = 0;

  for (const choice of choices) {
    const nudge = nudgeById.get(choice.nudgeId);

    // Rule: only nudges that exist (and passed the repository's checks).
    if (nudge === undefined) {
      reasons.push(`Nudge ${choice.nudgeId} is not available.`);
      continue;
    }

    // Rule: no duplicates. The first pick counts; repeats are refused.
    if (seen.has(nudge.id)) {
      reasons.push(`You chose "${nudge.name}" more than once.`);
      continue;
    }
    seen.add(nudge.id);

    // Rule: retired nudges can't be picked.
    if (!nudge.active) {
      reasons.push(`"${nudge.name}" is no longer available.`);
      continue;
    }

    // Rule: locked nudges can't be picked until this parent unlocks them.
    if (!nudge.startsUnlocked && !unlockedByParent.includes(nudge.id)) {
      reasons.push(`"${nudge.name}" is not unlocked yet.`);
      continue;
    }

    // Rule: the frequency must fit the category.
    if (nudge.category === "quick") {
      quickCount += 1;
      if (!QUICK_FREQUENCIES.includes(choice.frequency)) {
        reasons.push(`"${nudge.name}" can be every day or every 2 days.`);
      }
    } else {
      deliberateCount += 1;
      const timesPerWeek = DELIBERATE_TIMES_PER_WEEK[choice.frequency];
      if (timesPerWeek === undefined) {
        reasons.push(`"${nudge.name}" can be 1 or 2 times a week.`);
      } else {
        deliberateTimesPerWeek += timesPerWeek;
      }
    }

    targets.push({ nudgeId: nudge.id, category: nudge.category, frequency: choice.frequency });
  }

  // Rules on totals.
  if (quickCount > limits.maxQuick) {
    reasons.push(`You can choose up to ${limits.maxQuick} quick ${limits.maxQuick === 1 ? "behaviour" : "behaviours"}.`);
  }
  if (deliberateCount > limits.maxDeliberate) {
    reasons.push(`You can choose up to ${limits.maxDeliberate} deliberate ${limits.maxDeliberate === 1 ? "behaviour" : "behaviours"}.`);
  }
  if (deliberateTimesPerWeek > MAX_DELIBERATE_TIMES_PER_WEEK) {
    reasons.push(`Deliberate behaviours can add up to ${MAX_DELIBERATE_TIMES_PER_WEEK} times a week in total.`);
  }

  return reasons.length > 0 ? { ok: false, reasons } : { ok: true, targets };
}
