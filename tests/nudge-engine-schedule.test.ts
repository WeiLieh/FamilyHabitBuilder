// =============================================================================
// tests/nudge-engine-schedule.test.ts: Batch 2, tests 1 to 7 (slots and schedules)
//
// A parent's nudge messages go out in "slots": 30-minute blocks they choose,
// separately for school days and non-school days (spec v1.7, answers 10 to 21).
// Slot times are written as minutes after midnight, Singapore time:
// 420 = 7:00am, 1140 = 7:00pm, 1260 = 9:00pm.
// =============================================================================

import { describe, expect, it } from "vitest";
import { availableSlotStarts, checkSchedules, dayTypeFor } from "../src/nudge-engine/schedule.js";
import { DEFAULT_SCHEDULES, SLOT_STARTS } from "../src/settings.js";

const noHolidays = { publicHolidays: [], schoolHolidays: [] };

describe("Schedules: school days and non-school days (test 1)", () => {
  it("treats Monday to Friday as school days and the weekend as non-school days", () => {
    expect(dayTypeFor("2026-11-02", noHolidays)).toBe("school"); // Monday
    expect(dayTypeFor("2026-11-06", noHolidays)).toBe("school"); // Friday
    expect(dayTypeFor("2026-11-07", noHolidays)).toBe("non_school"); // Saturday
    expect(dayTypeFor("2026-11-08", noHolidays)).toBe("non_school"); // Sunday
  });

  it("treats a weekday public holiday or MOE school holiday as a non-school day", () => {
    expect(dayTypeFor("2026-11-04", { publicHolidays: ["2026-11-04"], schoolHolidays: [] })).toBe("non_school");
    expect(dayTypeFor("2026-11-04", { publicHolidays: [], schoolHolidays: ["2026-11-04"] })).toBe("non_school");
  });
});

describe("Slots (tests 2 to 7)", () => {
  // Test 2
  it("starts new parents on the agreed defaults", () => {
    expect(DEFAULT_SCHEDULES).toEqual({
      school: [420, 1140, 1260], // 7:00am, 7:00pm, 9:00pm
      nonSchool: [540, 750, 1140], // 9:00am, 12:30pm, 7:00pm
    });
    expect(checkSchedules(DEFAULT_SCHEDULES)).toEqual({ ok: true });
  });

  // Test 3
  it("offers 30 half-hour slots, from 7:00am to the last one at 9:30pm, on every day", () => {
    expect(SLOT_STARTS).toHaveLength(30);
    expect(SLOT_STARTS[0]).toBe(420); // 7:00am
    expect(SLOT_STARTS.at(-1)).toBe(1290); // 9:30pm
  });

  it("refuses a slot outside 7:00am to 9:30pm, or not on the hour or half hour", () => {
    expect(checkSchedules({ school: [390], nonSchool: [] }).ok).toBe(false); // 6:30am
    expect(checkSchedules({ school: [1320], nonSchool: [] }).ok).toBe(false); // 10:00pm
    expect(checkSchedules({ school: [425], nonSchool: [] }).ok).toBe(false); // 7:05am
  });

  // Test 4
  it("needs slots on the same schedule to start at least 1 hour apart", () => {
    expect(checkSchedules({ school: [420, 480], nonSchool: [] }).ok).toBe(true); // 7:00 and 8:00
    const tooClose = checkSchedules({ school: [420, 450], nonSchool: [] }); // 7:00 and 7:30
    expect(tooClose.ok).toBe(false);
    if (!tooClose.ok) expect(tooClose.reasons.join(" ")).toMatch(/at least 1 hour apart/i);
    // The same time on the two different schedules is fine.
    expect(checkSchedules({ school: [420], nonSchool: [420] }).ok).toBe(true);
  });

  // Test 5
  it("allows 0 to 3 slots per schedule, but at least 1 slot in total", () => {
    expect(checkSchedules({ school: [420], nonSchool: [] }).ok).toBe(true);
    expect(checkSchedules({ school: [420, 600, 780, 960], nonSchool: [] }).ok).toBe(false); // 4 slots
    const none = checkSchedules({ school: [], nonSchool: [] });
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.reasons.join(" ")).toMatch(/at least 1 nudge time.*pause/i);
  });

  // Test 6
  it("marks times already used or too close as unavailable, so the screen can grey them out", () => {
    // Editing slot 2 of the school-day defaults (7:00am, [7:00pm], 9:00pm).
    const options = availableSlotStarts([420, 1140, 1260], 1);
    const at = (start: number) => options.find((o) => o.start === start);
    expect(at(420)).toEqual({ start: 420, available: false, reason: "used" }); // slot 1
    expect(at(450)).toEqual({ start: 450, available: false, reason: "too_close" }); // 7:30am
    expect(at(480)).toEqual({ start: 480, available: true }); // 8:00am
    expect(at(1140)).toEqual({ start: 1140, available: true }); // its own current time
    expect(at(1200)).toEqual({ start: 1200, available: true }); // 8:00pm
    expect(at(1230)).toEqual({ start: 1230, available: false, reason: "too_close" }); // 8:30pm
    expect(at(1260)).toEqual({ start: 1260, available: false, reason: "used" }); // slot 3
    expect(at(1290)).toEqual({ start: 1290, available: false, reason: "too_close" }); // 9:30pm
  });
});
