// =============================================================================
// tests/variable-rewards-week.test.ts: when a week closes (rule 7.6, decision D5b)
//
// A week runs Monday to Sunday, Singapore time, and is judged (steady or not)
// when it CLOSES at midnight on Sunday. Parents may log late, back to yesterday
// (rule 5.4). So a log made on Monday "for yesterday" (Sunday) is saved in the
// history and the album, but it arrives after Sunday's week has closed: it
// counts toward neither that week nor the new one, and the bot's receipt must
// say so honestly.
//
// weekForLog answers, for one log: which week it belongs to (that week's
// Monday), and whether it still counts toward that week's result.
//
// Test weeks: Mon 26 Oct to Sun 1 Nov 2026, and Mon 2 Nov to Sun 8 Nov 2026.
// =============================================================================

import { describe, expect, it } from "vitest";
import { weekForLog } from "../src/variable-rewards/week.js";
import { sgtInstant } from "../src/sgt.js";

// "2026-11-08", "23:59" -> that moment in Singapore time.
function at(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return sgtInstant(date, (h ?? 0) * 60 + (m ?? 0));
}

describe("When a week closes (rule 7.6): midnight on Sunday, Singapore time", () => {
  // Agreed test 1
  it("counts a log made on Sunday at 11:59pm for Sunday", () => {
    expect(weekForLog({ date: "2026-11-08", loggedAt: at("2026-11-08", "23:59") })).toEqual({
      week: "2026-11-02",
      counts: true,
    });
  });

  // Agreed test 2
  it("saves a log made on Monday at 12:01am for Sunday, but it counts toward neither week, and the receipt says so", () => {
    const result = weekForLog({ date: "2026-11-08", loggedAt: at("2026-11-09", "00:01") });
    // It still belongs to Sunday's week (that's where the album shows it)...
    expect(result.week).toBe("2026-11-02");
    // ...but that week has closed, so it doesn't count toward its result...
    expect(result.counts).toBe(false);
    // ...and the bot is told to explain this in the receipt.
    expect(result).toEqual({ week: "2026-11-02", counts: false, reason: "week_closed" });
    // It doesn't belong to the new week (Monday 9 Nov) either.
    expect(result.week).not.toBe("2026-11-09");
  });

  // Agreed test 3
  it("counts a log made on Sunday for Saturday: the week is still open", () => {
    expect(weekForLog({ date: "2026-11-07", loggedAt: at("2026-11-08", "10:00") })).toEqual({
      week: "2026-11-02",
      counts: true,
    });
  });

  // Agreed test 4
  it("counts a log made on Wednesday for Tuesday", () => {
    expect(weekForLog({ date: "2026-11-03", loggedAt: at("2026-11-04", "08:00") })).toEqual({
      week: "2026-11-02",
      counts: true,
    });
  });

  it("uses Singapore time: 4:30pm on Sunday in London is already Monday 12:30am in Singapore", () => {
    // 16:30 UTC on Sunday 8 Nov = 00:30 on Monday 9 Nov in Singapore (UTC+8).
    const result = weekForLog({ date: "2026-11-08", loggedAt: new Date("2026-11-08T16:30:00Z") });
    expect(result).toEqual({ week: "2026-11-02", counts: false, reason: "week_closed" });
  });
});
