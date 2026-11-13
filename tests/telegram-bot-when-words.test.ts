// =============================================================================
// tests/telegram-bot-when-words.test.ts: how the next reminder's time is said (W2)
//
// [2026-11-13] Sign-up screens 10 and 11 say when the next reminder comes
// (rule 3.17), in the owner's agreed words (W2, 13 Nov): "today at 7:00 pm",
// "tomorrow at 9:00 am", "on Friday at 7:00 am" within a week, and
// "on Fri 20 Nov at 7:00 am" further ahead.
// =============================================================================

import { describe, expect, it } from "vitest";
import { whenWords } from "../src/telegram-bot/words.js";
import { sgtInstant } from "../src/sgt.js";

const wednesdayMorning = sgtInstant("2026-11-11", 10 * 60); // Wednesday 11 Nov 2026, 10:00 am

describe("Saying when the next reminder is (W2)", () => {
  it("N1. says today, tomorrow, the weekday within a week, or the date further ahead", () => {
    expect(whenWords(wednesdayMorning, { date: "2026-11-11", slotStart: 19 * 60 })).toBe("today at 7:00 pm");
    expect(whenWords(wednesdayMorning, { date: "2026-11-12", slotStart: 9 * 60 })).toBe("tomorrow at 9:00 am");
    expect(whenWords(wednesdayMorning, { date: "2026-11-13", slotStart: 7 * 60 })).toBe("on Friday at 7:00 am");
    expect(whenWords(wednesdayMorning, { date: "2026-11-17", slotStart: 12 * 60 + 30 })).toBe("on Tuesday at 12:30 pm");
    expect(whenWords(wednesdayMorning, { date: "2026-11-20", slotStart: 7 * 60 })).toBe("on Fri 20 Nov at 7:00 am");
  });
});
