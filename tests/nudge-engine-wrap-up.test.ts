// =============================================================================
// tests/nudge-engine-wrap-up.test.ts: the Weekly Wrap Up (rule 3.12, decision D7)
//
// The Weekly Wrap Up is a different kind of message from a nudge message: once a
// week, on Sunday, at a time the parent can change (default 8:00pm), it sums up
// "this week so far" and invites the parent to save a moment for the album.
// planWeeklyWrapUp answers "send it now" or "don't send" with a reason. It only
// decides; it doesn't send anything or write the words.
//
// Test week: Mon 2 Nov to Sun 8 Nov 2026. The next Monday is 9 Nov.
// Test parent: default settings (on, Sunday 8:00pm), not paused, logged once
// this week (Wednesday), and has no Sunday nudge slots at all: the Wrap Up
// doesn't use slots, so it doesn't need any.
// =============================================================================

import { describe, expect, it } from "vitest";
import {
  checkWrapUpTime,
  planWeeklyWrapUp,
  type WrapUpInput,
} from "../src/nudge-engine/wrap-up.js";
import { sgtInstant } from "../src/sgt.js";
import { DEFAULT_WEEKLY_WRAP_UP, SLOT_STARTS } from "../src/settings.js";

// "2026-11-08", "20:05" -> that moment in Singapore time.
function at(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return sgtInstant(date, (h ?? 0) * 60 + (m ?? 0));
}

// A normal situation; each test changes only what it is about.
function input(overrides: Partial<WrapUpInput>): WrapUpInput {
  return {
    now: at("2026-11-08", "20:05"), // Sunday, just after the default 8:00pm
    wrapUp: DEFAULT_WEEKLY_WRAP_UP,
    paused: false,
    logs: [{ nudgeId: 1, date: "2026-11-04" }], // one log on Wednesday
    messagesSent: [],
    ...overrides,
  };
}

describe("Weekly Wrap Up: the starting settings", () => {
  it("is on by default, on Sunday at 8:00pm", () => {
    expect(DEFAULT_WEEKLY_WRAP_UP).toEqual({ enabled: true, minutes: 20 * 60 });
  });

  it("lets the parent pick any 30-minute block from 7:00am to 9:30pm, like nudge slots", () => {
    for (const start of SLOT_STARTS) expect(checkWrapUpTime(start)).toEqual({ ok: true });
    expect(checkWrapUpTime(18 * 60 + 30).ok).toBe(true); // 6:30pm
    expect(checkWrapUpTime(6 * 60 + 30).ok).toBe(false); // 6:30am: too early
    expect(checkWrapUpTime(22 * 60).ok).toBe(false); // 10:00pm: too late
    expect(checkWrapUpTime(20 * 60 + 15).ok).toBe(false); // 8:15pm: not on the half hour
  });
});

describe("Weekly Wrap Up: when it is sent (rule 3.12)", () => {
  // Agreed test 1
  it("is sent on Sunday at 8:00pm by default, even with no Sunday nudge slots, if the parent logged this week", () => {
    expect(planWeeklyWrapUp(input({ now: at("2026-11-08", "20:00") }))).toEqual({ send: true });
  });

  // Agreed test 2
  it("is not sent before the chosen time on Sunday", () => {
    expect(planWeeklyWrapUp(input({ now: at("2026-11-08", "19:59") }))).toEqual({ send: false, reason: "too_early" });
  });

  it("is never sent Monday to Saturday", () => {
    for (const day of ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]) {
      expect(planWeeklyWrapUp(input({ now: at(day, "20:05") }))).toEqual({ send: false, reason: "not_sunday" });
    }
  });

  it("if the system is late, is still sent later that Sunday, but never on Monday", () => {
    expect(planWeeklyWrapUp(input({ now: at("2026-11-08", "23:59") }))).toEqual({ send: true });
    expect(planWeeklyWrapUp(input({ now: at("2026-11-09", "00:01") }))).toEqual({ send: false, reason: "not_sunday" });
  });

  // Agreed test 3
  it("uses the time the parent chose (e.g. 6:30pm)", () => {
    const wrapUp = { enabled: true, minutes: 18 * 60 + 30 };
    expect(planWeeklyWrapUp(input({ wrapUp, now: at("2026-11-08", "18:29") }))).toEqual({ send: false, reason: "too_early" });
    expect(planWeeklyWrapUp(input({ wrapUp, now: at("2026-11-08", "18:30") }))).toEqual({ send: true });
  });

  // Agreed test 5
  it("is not sent if the parent logged nothing this week (Monday to Sunday)", () => {
    expect(planWeeklyWrapUp(input({ logs: [] }))).toEqual({ send: false, reason: "nothing_logged" });
  });

  it("doesn't count a log from last Sunday: that belongs to last week", () => {
    expect(planWeeklyWrapUp(input({ logs: [{ nudgeId: 1, date: "2026-11-01" }] }))).toEqual({
      send: false,
      reason: "nothing_logged",
    });
  });

  it("counts a log from this Monday and a log made today", () => {
    expect(planWeeklyWrapUp(input({ logs: [{ nudgeId: 1, date: "2026-11-02" }] }))).toEqual({ send: true });
    expect(planWeeklyWrapUp(input({ logs: [{ nudgeId: 1, date: "2026-11-08" }] }))).toEqual({ send: true });
  });

  it("counts a log of a behaviour the parent didn't choose (it's in their album too)", () => {
    // The Wrap Up doesn't know the parent's picks at all: any log counts.
    expect(planWeeklyWrapUp(input({ logs: [{ nudgeId: 9, date: "2026-11-06" }] }))).toEqual({ send: true });
  });

  // Agreed test 6
  it("is not sent while the parent has paused (muted) the bot", () => {
    expect(planWeeklyWrapUp(input({ paused: true }))).toEqual({ send: false, reason: "paused" });
  });

  // Agreed test 7
  it("is still sent after the parent tapped 'Not today' that Sunday", () => {
    // "Not today" stops nudge messages only, so the Wrap Up never even looks at it.
    expect("notTodayDate" in input({})).toBe(false);
    expect(planWeeklyWrapUp(input({}))).toEqual({ send: true });
  });

  // Agreed test 8
  it("is never sent twice in one week, even if the parent changes the time after it was sent", () => {
    const messagesSent = [{ kind: "weekly_wrap_up" as const, date: "2026-11-08" }];
    expect(planWeeklyWrapUp(input({ messagesSent, now: at("2026-11-08", "21:00") }))).toEqual({
      send: false,
      reason: "already_sent",
    });
    // Sent at 8:00pm, then moved to 9:30pm: still not sent again.
    const moved = { enabled: true, minutes: 21 * 60 + 30 };
    expect(planWeeklyWrapUp(input({ messagesSent, wrapUp: moved, now: at("2026-11-08", "21:35") }))).toEqual({
      send: false,
      reason: "already_sent",
    });
  });

  it("last week's Wrap Up doesn't stop this week's", () => {
    const messagesSent = [{ kind: "weekly_wrap_up" as const, date: "2026-11-01" }];
    expect(planWeeklyWrapUp(input({ messagesSent }))).toEqual({ send: true });
  });

  it("nudge messages and replies sent today don't stop it", () => {
    const messagesSent = [
      { kind: "nudge" as const, date: "2026-11-08", slotStart: 540, nudgeId: 1 },
      { kind: "reply" as const, date: "2026-11-08" },
    ];
    expect(planWeeklyWrapUp(input({ messagesSent }))).toEqual({ send: true });
  });

  // Agreed test 9
  it("is not sent when the parent has turned it off", () => {
    expect(planWeeklyWrapUp(input({ wrapUp: { enabled: false, minutes: 20 * 60 } }))).toEqual({
      send: false,
      reason: "turned_off",
    });
  });
});
