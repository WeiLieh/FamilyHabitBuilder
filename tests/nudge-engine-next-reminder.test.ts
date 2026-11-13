// =============================================================================
// tests/nudge-engine-next-reminder.test.ts: "your next reminder is …" (rule 3.17)
//
// [2026-11-13] Sign-up screens 10 and 11 tell the parent when their next
// reminder comes. nextReminder asks the planner, slot by slot from now on,
// "would you send here?" and stops at the first yes (up to 14 days ahead,
// assuming nothing more is logged). Because it reuses the planner, the bot
// can never promise a time the planner wouldn't keep.
//
// Default slots: school days 7:00am, 7:00pm, 9:00pm; non-school days 9:00am,
// 12:30pm, 7:00pm. Test weeks: Mon 2 Nov to Tue 10 Nov 2026.
// =============================================================================

import { describe, expect, it } from "vitest";
import { nextReminder } from "../src/nudge-engine/next-reminder.js";
import type { PlannerInput } from "../src/nudge-engine/planner.js";
import type { Target } from "../src/nudge-engine/choices.js";
import { sgtInstant } from "../src/sgt.js";
import { DEFAULT_SCHEDULES } from "../src/settings.js";

const QUICK: Target = { nudgeId: 1, category: "quick", frequency: "every_2_days" };
const DELIBERATE: Target = { nudgeId: 5, category: "deliberate", frequency: "once_a_week" };

// "2026-11-04", "19:05" -> that moment in Singapore time.
function at(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return sgtInstant(date, (h ?? 0) * 60 + (m ?? 0));
}

// A parent who has just signed up (so their slots were set just now).
function justSignedUp(date: string, time: string, overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    now: at(date, time),
    targets: [QUICK],
    schedules: DEFAULT_SCHEDULES,
    holidays: { publicHolidays: [], schoolHolidays: [] },
    logs: [],
    messagesSent: [],
    notTodayDate: null,
    paused: false,
    slotsChangedAt: at(date, time),
    ...overrides,
  };
}

describe("The next reminder (rule 3.17)", () => {
  // N1
  it("is today's next slot when something is due (6:30 pm Wednesday -> today 7:00 pm)", () => {
    expect(nextReminder(justSignedUp("2026-11-04", "18:30"))).toEqual({ date: "2026-11-04", slotStart: 19 * 60, nudgeId: 1 });
  });

  // N2
  it("skips a slot that has already started (7:05 pm Wednesday -> today 9:00 pm)", () => {
    expect(nextReminder(justSignedUp("2026-11-04", "19:05"))).toEqual({ date: "2026-11-04", slotStart: 21 * 60, nudgeId: 1 });
  });

  // N3
  it("moves to tomorrow's slots, of the right kind of day (9:45 pm Friday -> Saturday 9:00 am)", () => {
    expect(nextReminder(justSignedUp("2026-11-06", "21:45"))).toEqual({ date: "2026-11-07", slotStart: 9 * 60, nudgeId: 1 });
  });

  // N4
  it("waits until the behaviour is due again after \"I've started!\" (every 2 days: Wednesday -> Friday 7:00 am)", () => {
    const input = justSignedUp("2026-11-04", "18:00", { logs: [{ nudgeId: 1, date: "2026-11-04" }] });
    expect(nextReminder(input)).toEqual({ date: "2026-11-06", slotStart: 7 * 60, nudgeId: 1 });
  });

  // N5
  it("finds Friday for someone with only a deliberate behaviour (Monday -> Friday 7:00 am)", () => {
    const input = justSignedUp("2026-11-02", "10:00", { targets: [DELIBERATE] });
    expect(nextReminder(input)).toEqual({ date: "2026-11-06", slotStart: 7 * 60, nudgeId: 5 });
  });

  // N6
  it("has no next reminder while the parent is paused", () => {
    expect(nextReminder(justSignedUp("2026-11-04", "18:30", { paused: true }))).toBeNull();
  });

  // N7
  it("has no next reminder when nothing would be sent in the next 14 days", () => {
    expect(nextReminder(justSignedUp("2026-11-04", "18:30", { targets: [] }))).toBeNull();
  });

  // N8
  it("uses non-school slots on a public holiday (9:45 pm Monday, Tuesday a holiday -> Tuesday 9:00 am)", () => {
    const input = justSignedUp("2026-11-09", "21:45", { holidays: { publicHolidays: ["2026-11-10"], schoolHolidays: [] } });
    expect(nextReminder(input)).toEqual({ date: "2026-11-10", slotStart: 9 * 60, nudgeId: 1 });
  });
});
