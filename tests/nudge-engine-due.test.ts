// =============================================================================
// tests/nudge-engine-due.test.ts: Batch 2, tests 16 to 21 (what is "due")
//
// A behaviour is due when the parent hasn't done it yet within the frequency
// THEY chose (how often they want to DO it, not how often to be nudged).
// Dates are Singapore calendar days. A week is Monday to Sunday.
// =============================================================================

import { describe, expect, it } from "vitest";
import { isDue } from "../src/nudge-engine/due.js";
import type { Target } from "../src/nudge-engine/choices.js";

const WEDNESDAY = "2026-11-04";
const quickDaily: Target = { nudgeId: 1, category: "quick", frequency: "every_day" };
const quickEvery2: Target = { nudgeId: 2, category: "quick", frequency: "every_2_days" };
const deliberateOnce: Target = { nudgeId: 5, category: "deliberate", frequency: "once_a_week" };
const deliberateTwice: Target = { nudgeId: 5, category: "deliberate", frequency: "twice_a_week" };

describe("What's due", () => {
  // Test 16
  it("quick, every day: due if not logged today", () => {
    expect(isDue(quickDaily, ["2026-11-03"], WEDNESDAY)).toBe(true); // logged yesterday only
    expect(isDue(quickDaily, ["2026-11-04"], WEDNESDAY)).toBe(false); // logged today
  });

  // Test 17
  it("quick, every 2 days: due if not logged today or yesterday", () => {
    expect(isDue(quickEvery2, ["2026-11-03"], WEDNESDAY)).toBe(false); // yesterday
    expect(isDue(quickEvery2, ["2026-11-02"], WEDNESDAY)).toBe(true); // Monday
  });

  // Test 18
  it("deliberate: due if logged fewer times this week (Monday to Sunday) than chosen", () => {
    expect(isDue(deliberateOnce, ["2026-11-02"], WEDNESDAY)).toBe(false); // once, on Monday
    expect(isDue(deliberateTwice, ["2026-11-02"], WEDNESDAY)).toBe(true); // once of twice
    expect(isDue(deliberateTwice, ["2026-11-02", "2026-11-03"], WEDNESDAY)).toBe(false);
    // Last week's logs don't count this week (Sunday 1 November is last week).
    expect(isDue(deliberateOnce, ["2026-11-01"], WEDNESDAY)).toBe(true);
  });

  it("deliberate: a log on Sunday counts for the week that ends that Sunday", () => {
    expect(isDue(deliberateOnce, ["2026-11-08"], "2026-11-08")).toBe(false);
  });

  it("counts a behaviour logged twice on the same day as once", () => {
    expect(isDue(deliberateTwice, ["2026-11-02", "2026-11-02"], WEDNESDAY)).toBe(true);
  });

  // Test 19
  it("a behaviour with no logs yet is due", () => {
    expect(isDue(quickDaily, [], WEDNESDAY)).toBe(true);
    expect(isDue(deliberateOnce, [], WEDNESDAY)).toBe(true);
  });

  // Test 20
  it("a log for yesterday (entered today) counts for yesterday", () => {
    // The parent tells the bot today "I did this yesterday": it is stored with
    // yesterday's date, so an every-2-days behaviour is not due today.
    expect(isDue(quickEvery2, ["2026-11-03"], WEDNESDAY)).toBe(false);
    expect(isDue(quickDaily, ["2026-11-03"], WEDNESDAY)).toBe(true); // but every-day still is
  });

  // Test 21 is in tests/nudge-engine-planner.test.ts (logs of unchosen behaviours).
});
