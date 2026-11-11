// =============================================================================
// tests/variable-rewards-week.test.ts: which week a log counts for (rules 5.4, 7.6)
//
// A week runs Monday to Sunday, Singapore time, and is judged (steady or not)
// when it CLOSES at midnight on Sunday (rule 7.6). [2026-11-11] Since 9 Nov a
// log is for TODAY only (rule 5.4, owner): there is no yesterday option. So a
// log for any other day is refused, and a log can never arrive for a week that
// has already closed.
//
// weekForLog answers, for one log: which week it counts for (that week's
// Monday), or that it is refused because it is not for today.
//
// [2026-11-11] The four tests about logging for yesterday (agreed tests 2 to 4
// and the London time test) were rewritten as today-only checks, with the
// owner's approval (Option A, 11 Nov): tests for a dropped rule are removed,
// not kept (CLAUDE.md rule 12). Same number of tests.
//
// Test week: Mon 2 Nov to Sun 8 Nov 2026. The next Monday is 9 Nov.
// =============================================================================

import { describe, expect, it } from "vitest";
import { weekForLog } from "../src/variable-rewards/week.js";
import { sgtInstant } from "../src/sgt.js";

// "2026-11-08", "23:59" -> that moment in Singapore time.
function at(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return sgtInstant(date, (h ?? 0) * 60 + (m ?? 0));
}

describe("Which week a log counts for (rules 5.4 and 7.6): today only, Singapore time", () => {
  // Agreed test 1
  it("counts a log made on Sunday at 11:59pm for Sunday", () => {
    expect(weekForLog({ date: "2026-11-08", loggedAt: at("2026-11-08", "23:59") })).toEqual({
      week: "2026-11-02",
      counts: true,
    });
  });

  it("refuses a log made on Monday at 12:01am for Sunday: that was yesterday", () => {
    expect(weekForLog({ date: "2026-11-08", loggedAt: at("2026-11-09", "00:01") })).toEqual({
      counts: false,
      reason: "not_today",
    });
  });

  it("refuses a log for an earlier day or a later day, even inside the same week", () => {
    // Wednesday for Monday (two days back) and Wednesday for Thursday (tomorrow).
    expect(weekForLog({ date: "2026-11-02", loggedAt: at("2026-11-04", "08:00") })).toEqual({
      counts: false,
      reason: "not_today",
    });
    expect(weekForLog({ date: "2026-11-05", loggedAt: at("2026-11-04", "08:00") })).toEqual({
      counts: false,
      reason: "not_today",
    });
  });

  it("counts a log made on Wednesday morning for Wednesday, in that week", () => {
    expect(weekForLog({ date: "2026-11-04", loggedAt: at("2026-11-04", "08:00") })).toEqual({
      week: "2026-11-02",
      counts: true,
    });
  });

  it("uses Singapore time: 4:30pm on Sunday in London is already Monday 12:30am in Singapore, so a log for Sunday is refused", () => {
    // 16:30 UTC on Sunday 8 Nov = 00:30 on Monday 9 Nov in Singapore (UTC+8).
    const result = weekForLog({ date: "2026-11-08", loggedAt: new Date("2026-11-08T16:30:00Z") });
    expect(result).toEqual({ counts: false, reason: "not_today" });
  });
});
