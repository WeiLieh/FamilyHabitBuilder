// =============================================================================
// tests/nudge-engine-planner.test.ts: Batch 2, tests 7 to 15 and 21 to 25
//
// planNudge is the Nudge engine's "decisions" brain. Every few minutes the
// scheduler (Supabase Cron) asks it, for each parent: "should we send a nudge
// message right now, and about which behaviour?" It answers "send nudge X" or
// "don't send" with a reason. (The words of the message come later, from Claude.)
//
// Test parent: picked quick A (ID 1), then quick B (ID 2), then deliberate C
// (ID 5), all with the default slots: school days 7:00am, 7:00pm, 9:00pm;
// non-school days 9:00am, 12:30pm, 7:00pm.
// Test week: Mon 2 Nov to Sun 8 Nov 2026 (Wed = 4 Nov, Fri = 6 Nov).
// =============================================================================

import { describe, expect, it } from "vitest";
import { planNudge, type PlannerInput, type SentMessage } from "../shared/nudge-engine/planner.js";
import type { Target } from "../shared/nudge-engine/choices.js";
import { sgtInstant } from "../shared/sgt.js";
import { DEFAULT_SCHEDULES } from "../shared/settings.js";

const A: Target = { nudgeId: 1, category: "quick", frequency: "every_day" };
const B: Target = { nudgeId: 2, category: "quick", frequency: "every_day" };
const C: Target = { nudgeId: 5, category: "deliberate", frequency: "once_a_week" };

// "2026-11-04", "19:05" -> that moment in Singapore time.
function at(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return sgtInstant(date, (h ?? 0) * 60 + (m ?? 0));
}

// A nudge message already sent (or a reply, when kind is "reply").
function sent(date: string, slotStart: number, nudgeId: number, kind: SentMessage["kind"] = "nudge"): SentMessage {
  return { kind, date, slotStart, nudgeId };
}

// A normal situation; each test changes only what it is about.
function input(overrides: Partial<PlannerInput>): PlannerInput {
  return {
    now: at("2026-11-04", "19:05"), // Wednesday, inside the 7:00pm slot
    targets: [A, B, C],
    schedules: DEFAULT_SCHEDULES,
    holidays: { publicHolidays: [], schoolHolidays: [] },
    logs: [],
    messagesSent: [],
    notTodayDate: null,
    paused: false,
    slotsChangedAt: null,
    ...overrides,
  };
}

describe("When a nudge message is sent (tests 8 to 15)", () => {
  // Test 8
  it("sends only during one of today's slots, and never after the slot ends", () => {
    expect(planNudge(input({ now: at("2026-11-04", "19:00") })).send).toBe(true); // slot start
    expect(planNudge(input({ now: at("2026-11-04", "19:29") })).send).toBe(true); // still inside
    expect(planNudge(input({ now: at("2026-11-04", "19:30") }))).toEqual({ send: false, reason: "no_slot_now" });
    expect(planNudge(input({ now: at("2026-11-04", "15:00") }))).toEqual({ send: false, reason: "no_slot_now" });
  });

  it("uses today's schedule: a weekday public holiday uses the non-school slots", () => {
    const holiday = { publicHolidays: ["2026-11-04"], schoolHolidays: [] };
    expect(planNudge(input({ holidays: holiday, now: at("2026-11-04", "07:05") })).send).toBe(false);
    expect(planNudge(input({ holidays: holiday, now: at("2026-11-04", "09:05") })).send).toBe(true);
  });

  // Test 9
  it("sends at most 1 nudge message per slot", () => {
    const result = planNudge(input({ messagesSent: [sent("2026-11-04", 1140, 1)] }));
    expect(result).toEqual({ send: false, reason: "slot_already_used" });
  });

  it("sends at most 3 nudge messages a day", () => {
    // 3 already today (e.g. the parent moved their slots during the day).
    const three = [sent("2026-11-04", 420, 1), sent("2026-11-04", 600, 2), sent("2026-11-04", 780, 5)];
    expect(planNudge(input({ now: at("2026-11-04", "21:05"), messagesSent: three }))).toEqual({
      send: false,
      reason: "daily_cap_reached",
    });
  });

  // Test 10
  it("never counts the parent's replies or the bot's answers toward the 3", () => {
    const chat = [1, 2, 3, 4, 5].map(() => sent("2026-11-04", 420, 1, "reply"));
    const result = planNudge(input({ messagesSent: [sent("2026-11-04", 420, 1), ...chat] }));
    expect(result).toEqual({ send: true, nudgeId: 2, slotStart: 1140 }); // A was nudged this morning
  });

  // Test 11
  it("sends nothing more that day after 'Not today', and starts again the next day", () => {
    expect(planNudge(input({ notTodayDate: "2026-11-04" }))).toEqual({ send: false, reason: "not_today" });
    expect(planNudge(input({ notTodayDate: "2026-11-03" })).send).toBe(true);
  });

  // Test 12
  it("sends nothing while the parent is paused", () => {
    expect(planNudge(input({ paused: true }))).toEqual({ send: false, reason: "paused" });
  });

  // Test 13
  it("sends nothing if no behaviour is due", () => {
    const allDone = [
      { nudgeId: 1, date: "2026-11-04" },
      { nudgeId: 2, date: "2026-11-04" },
      { nudgeId: 5, date: "2026-11-02" },
    ];
    expect(planNudge(input({ logs: allDone }))).toEqual({ send: false, reason: "nothing_due" });
  });

  // Test 14
  it("applies slot changes from the next slot, not the one already running", () => {
    const changed = at("2026-11-04", "19:10"); // changed during the 7:00pm slot
    expect(planNudge(input({ now: at("2026-11-04", "19:15"), slotsChangedAt: changed }))).toEqual({
      send: false,
      reason: "slot_changed",
    });
    expect(planNudge(input({ now: at("2026-11-04", "21:05"), slotsChangedAt: changed })).send).toBe(true);
  });

  // Test 15
  it("re-checking just before sending skips a behaviour that has just been logged", () => {
    // The sender asks planNudge again right before sending. If A was logged
    // in the meantime, the fresh answer moves on to B instead.
    const first = planNudge(input({}));
    expect(first).toEqual({ send: true, nudgeId: 1, slotStart: 1140 });
    const fresh = planNudge(input({ logs: [{ nudgeId: 1, date: "2026-11-04" }] }));
    expect(fresh).toEqual({ send: true, nudgeId: 2, slotStart: 1140 });
  });
});

describe("Which behaviour to nudge (tests 7 and 21 to 25)", () => {
  // Test 7
  it("shares the slots between all behaviours: one behaviour per slot, then nothing", () => {
    const morning = planNudge(input({ now: at("2026-11-04", "07:05") }));
    expect(morning).toEqual({ send: true, nudgeId: 1, slotStart: 420 });
    const evening = planNudge(input({ messagesSent: [sent("2026-11-04", 420, 1)] }));
    expect(evening).toEqual({ send: true, nudgeId: 2, slotStart: 1140 });
    const night = planNudge(
      input({ now: at("2026-11-04", "21:05"), messagesSent: [sent("2026-11-04", 420, 1), sent("2026-11-04", 1140, 2)] }),
    );
    // Wednesday: the deliberate behaviour is not nudged on Wednesdays (test 25).
    expect(night).toEqual({ send: false, reason: "nothing_due" });
  });

  // Test 21
  it("ignores logs of behaviours the parent didn't choose", () => {
    const logs = [{ nudgeId: 3, date: "2026-11-04" }]; // ID 3 is not one of A, B, C
    expect(planNudge(input({ logs }))).toEqual({ send: true, nudgeId: 1, slotStart: 1140 });
  });

  // Test 22
  it("never nudges a behaviour that isn't due, and each behaviour at most once a day", () => {
    const logs = [{ nudgeId: 1, date: "2026-11-04" }]; // A done today
    expect(planNudge(input({ logs }))).toEqual({ send: true, nudgeId: 2, slotStart: 1140 });
    const bNudgedThisMorning = [sent("2026-11-04", 420, 2)];
    expect(planNudge(input({ logs, messagesSent: bNudgedThisMorning }))).toEqual({
      send: false,
      reason: "nothing_due", // B still not done, but already nudged today
    });
  });

  // Test 23
  it("puts quick behaviours below the floor (not logged for 2+ days) first", () => {
    // B was logged yesterday (due, but fine); A was last logged 3 days ago (below floor).
    const logs = [
      { nudgeId: 2, date: "2026-11-03" },
      { nudgeId: 1, date: "2026-11-01" },
    ];
    expect(planNudge(input({ targets: [B, A, C], logs }))).toEqual({ send: true, nudgeId: 1, slotStart: 1140 });
  });

  it("among quick behaviours below the floor, puts the one not logged for longest first", () => {
    const logs = [
      { nudgeId: 1, date: "2026-11-02" }, // A: 2 days ago
      { nudgeId: 2, date: "2026-10-30" }, // B: 5 days ago
    ];
    expect(planNudge(input({ logs }))).toEqual({ send: true, nudgeId: 2, slotStart: 1140 });
  });

  it("when tied, puts the behaviour the parent picked first", () => {
    expect(planNudge(input({ targets: [B, A, C] }))).toEqual({ send: true, nudgeId: 2, slotStart: 1140 });
  });

  it("puts due quick behaviours before the deliberate behaviour", () => {
    const friday = planNudge(input({ now: at("2026-11-06", "19:05") }));
    expect(friday).toEqual({ send: true, nudgeId: 1, slotStart: 1140 });
  });

  // Test 24
  it("after 7 straight days of logging, nudges a quick behaviour only if it wasn't nudged yesterday", () => {
    const sevenDays = ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"];
    const logs = [...sevenDays.map((date) => ({ nudgeId: 1, date })), { nudgeId: 2, date: "2026-11-04" }];
    const nudgedYesterday = [sent("2026-11-03", 1140, 1)];
    expect(planNudge(input({ logs, messagesSent: nudgedYesterday }))).toEqual({
      send: false,
      reason: "nothing_due", // A rests today; B done; C not on Wednesdays
    });
    expect(planNudge(input({ logs }))).toEqual({ send: true, nudgeId: 1, slotStart: 1140 });
  });

  // Test 25
  describe("deliberate behaviours: Friday (planning) and Sunday (only if still due)", () => {
    const quickDone = (date: string) => [
      { nudgeId: 1, date },
      { nudgeId: 2, date },
    ];

    it("is not nudged Monday to Thursday, or on Saturday", () => {
      for (const date of ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]) {
        expect(planNudge(input({ now: at(date, "19:05"), logs: quickDone(date) })).send).toBe(false);
      }
      expect(planNudge(input({ now: at("2026-11-07", "19:05"), logs: quickDone("2026-11-07") })).send).toBe(false);
    });

    it("is nudged on Friday", () => {
      expect(planNudge(input({ now: at("2026-11-06", "19:05"), logs: quickDone("2026-11-06") }))).toEqual({
        send: true,
        nudgeId: 5,
        slotStart: 1140,
      });
    });

    it("is nudged on Friday even when Friday is a public holiday (non-school slots)", () => {
      const holiday = { publicHolidays: ["2026-11-06"], schoolHolidays: [] };
      expect(
        planNudge(input({ holidays: holiday, now: at("2026-11-06", "12:35"), logs: quickDone("2026-11-06") })),
      ).toEqual({ send: true, nudgeId: 5, slotStart: 750 });
    });

    it("is nudged on Sunday only if still due", () => {
      const sunday = at("2026-11-08", "19:05");
      expect(planNudge(input({ now: sunday, logs: quickDone("2026-11-08") }))).toEqual({
        send: true,
        nudgeId: 5,
        slotStart: 1140,
      });
      const doneSaturday = [...quickDone("2026-11-08"), { nudgeId: 5, date: "2026-11-07" }];
      expect(planNudge(input({ now: sunday, logs: doneSaturday }))).toEqual({ send: false, reason: "nothing_due" });
    });
  });
});
