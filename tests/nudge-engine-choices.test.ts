// =============================================================================
// tests/nudge-engine-choices.test.ts: Batch 1b, guardrails on a parent's choices
//
// The parent chooses which nudges to work on and how often (user-led), within
// guardrails set by the app (spec v1.1 to v1.4). The limits are starting values
// recorded in docs/EXPERIMENTS.md and kept in src/settings.ts.
// Test-run IDs: quick nudges are 1 to 4, deliberate nudges are 5 to 9.
// Unlocked from the start: 1 to 4 (quick) and 5, 6 (deliberate). Locked: 7, 8, 9.
// An unlock opens more of the menu; it never raises how many a parent picks.
// =============================================================================

import { describe, expect, it } from "vitest";
import { checkChoices, type Choice } from "../src/nudge-engine/choices.js";
import { STARTING_CHOICE_LIMITS } from "../src/settings.js";
import { nineTestNudges, nineTestNudgesWith } from "./helpers/nudge-repository-rows.js";

const nudges = nineTestNudges();

// Helper: check choices with the normal starting limits, for a parent who has
// not unlocked anything yet (unless a list of unlocked nudge IDs is given).
function check(choices: Choice[], unlockedByParent: number[] = []) {
  return checkChoices(choices, nudges, STARTING_CHOICE_LIMITS, unlockedByParent);
}

describe("Nudge engine: starting limits", () => {
  it("match docs/EXPERIMENTS.md: up to 2 quick, up to 1 deliberate, at least 1 in total", () => {
    expect(STARTING_CHOICE_LIMITS).toEqual({ maxQuick: 2, maxDeliberate: 1, minTotal: 1 });
  });
});

describe("Nudge engine: checking a parent's choices", () => {
  // Tests 8 and 11
  it("accepts 2 quick and 1 deliberate, and returns them as the parent's targets", () => {
    const result = check([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 2, frequency: "every_2_days" },
      { nudgeId: 5, frequency: "once_a_week" },
    ]);
    expect(result).toEqual({
      ok: true,
      targets: [
        { nudgeId: 1, category: "quick", frequency: "every_day" },
        { nudgeId: 2, category: "quick", frequency: "every_2_days" },
        { nudgeId: 5, category: "deliberate", frequency: "once_a_week" },
      ],
    });
  });

  it("accepts a single behaviour of either kind (at least 1 in total, any mix)", () => {
    expect(check([{ nudgeId: 3, frequency: "every_day" }]).ok).toBe(true);
    expect(check([{ nudgeId: 6, frequency: "twice_a_week" }]).ok).toBe(true);
  });

  it("refuses an empty choice: at least 1 behaviour is needed", () => {
    const result = check([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/at least 1/i);
  });

  // Test 9: too many, duplicates, unknown nudges
  it("refuses 3 quick behaviours, saying the limit is 2", () => {
    const result = check([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 2, frequency: "every_day" },
      { nudgeId: 3, frequency: "every_day" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/up to 2 quick/i);
  });

  it("refuses 2 deliberate behaviours, saying the limit is 1", () => {
    const result = check([
      { nudgeId: 5, frequency: "once_a_week" },
      { nudgeId: 6, frequency: "once_a_week" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/up to 1 deliberate/i);
  });

  it("refuses the same behaviour chosen twice", () => {
    const result = check([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 1, frequency: "every_2_days" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/more than once/i);
  });

  it("refuses a nudge that is not in the Nudge repository", () => {
    const result = check([{ nudgeId: 99, frequency: "every_day" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/not available/i);
  });

  // Test 10: frequencies
  it("refuses a weekly frequency for a quick behaviour (quick is every day or every 2 days)", () => {
    const result = check([{ nudgeId: 1, frequency: "once_a_week" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/every day or every 2 days/i);
  });

  it("refuses a daily frequency for a deliberate behaviour (deliberate is 1 or 2 times a week)", () => {
    const result = check([{ nudgeId: 5, frequency: "every_day" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/1 or 2 times a week/i);
  });

  it("keeps deliberate behaviours to 2 times a week in total, if an experiment ever allows 2 deliberate", () => {
    // Pretend an experiment lets some parents pick 2 deliberate behaviours.
    const unlocked = { ...STARTING_CHOICE_LIMITS, maxDeliberate: 2 };
    const tooMuch = checkChoices(
      [
        { nudgeId: 5, frequency: "twice_a_week" },
        { nudgeId: 6, frequency: "once_a_week" },
      ],
      nudges,
      unlocked,
    );
    expect(tooMuch.ok).toBe(false);
    if (!tooMuch.ok) expect(tooMuch.reasons.join(" ")).toMatch(/2 times a week in total/i);

    const fine = checkChoices(
      [
        { nudgeId: 5, frequency: "once_a_week" },
        { nudgeId: 6, frequency: "once_a_week" },
      ],
      nudges,
      unlocked,
    );
    expect(fine.ok).toBe(true);
  });

  // Locked and retired nudges (spec v1.5)
  it("refuses a nudge that starts locked, if the parent has not unlocked it", () => {
    const result = check([{ nudgeId: 7, frequency: "once_a_week" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/not unlocked yet/i);
  });

  it("accepts a nudge that starts locked once the parent has unlocked it", () => {
    const result = check([{ nudgeId: 7, frequency: "once_a_week" }], [7]);
    expect(result.ok).toBe(true);
  });

  it("refuses a retired (inactive) nudge, even if the parent had unlocked it", () => {
    const withRetired = nineTestNudgesWith(2, { active: false }); // nudge 2 retired
    const result = checkChoices(
      [{ nudgeId: 2, frequency: "every_day" }],
      withRetired,
      STARTING_CHOICE_LIMITS,
      [2],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.join(" ")).toMatch(/no longer available/i);
  });

  it("does not say 'for now' about the limits (unlocks don't raise them)", () => {
    const result = check([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 2, frequency: "every_day" },
      { nudgeId: 3, frequency: "every_day" },
    ]);
    if (!result.ok) expect(result.reasons.join(" ")).not.toMatch(/for now/i);
  });

  it("gives every reason at once, so the parent can fix everything in one go", () => {
    const result = check([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 2, frequency: "every_day" },
      { nudgeId: 3, frequency: "every_day" },
      { nudgeId: 99, frequency: "every_day" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
