// =============================================================================
// tests/datastore-windows.test.ts: the time windows the database also checks
//
// [2026-11-11] Three waits have a fixed length decided by the owner:
//   - Undo: 30 seconds after a keyboard log (rule 5.8)
//   - the weekly connection question: 24 hours after it is sent (rule 5.6)
//   - "Add a moment": 24 hours after the button is tapped (rule 7.7)
// The numbers live once, in src/settings.ts (rule 1.4). The database reads the
// first two from the settings version each event carries (migration 005) and
// refuses an action if the version has none. It can't tell whether the number
// in a version is right: these tests check the values the app sends.
// [2026-11-12] Two more, read by the sign-up clean-up (migration 007, Q11): an
// unfinished sign-up draft is kept 7 days, its cut-down record 90 days.
// [2026-11-13] One more (migration 009, Q11b): the one sign-up reminder goes
// 24 hours after someone stops part-way through sign-up.
// [2026-11-14] B1-D1 (owner, 14 Nov): Undo lasts 10 minutes (600 seconds), was
// 30 seconds; the two tests that check the number were rewritten to 600.
// =============================================================================

import { describe, expect, it } from "vitest";
import {
  CONNECTION_ANSWER_WINDOW_HOURS,
  MOMENT_WINDOW_HOURS,
  SETTINGS_KEYS_THE_DATABASE_READS,
  SIGN_UP_DRAFT_KEEP_DAYS,
  SIGN_UP_REMINDER_AFTER_HOURS,
  SIGN_UP_STOPPED_KEEP_DAYS,
  UNDO_WINDOW_SECONDS,
} from "../src/settings.js";

describe("Time windows (rules 5.6, 5.8, 7.7)", () => {
  // [2026-11-14] Rewritten (B1-D1): was "gives Undo 30 seconds, …".
  it("gives Undo 10 minutes (600 seconds), and the connection question and a moment 24 hours each", () => {
    expect(UNDO_WINDOW_SECONDS).toBe(600);
    expect(CONNECTION_ANSWER_WINDOW_HOURS).toBe(24);
    expect(MOMENT_WINDOW_HOURS).toBe(24);
  });

  // [2026-11-12] New (Q11a, 11d; owner, 12 Nov).
  it("keeps an unfinished sign-up draft 7 days, and its cut-down record 90 days", () => {
    expect(SIGN_UP_DRAFT_KEEP_DAYS).toBe(7);
    expect(SIGN_UP_STOPPED_KEEP_DAYS).toBe(90);
  });

  // [2026-11-13] New (Q11b; owner, 12 Nov): one reminder, 24 hours after someone stops.
  it("sends the one sign-up reminder 24 hours after someone stops part-way", () => {
    expect(SIGN_UP_REMINDER_AFTER_HOURS).toBe(24);
  });

  // [2026-11-13] Rewritten (migration 009 reads one more window): was "names the four windows".
  // [2026-11-14] Undo's value rewritten to 600 (B1-D1).
  it("names the five windows the database checks, with the values it will find in each settings version", () => {
    expect(SETTINGS_KEYS_THE_DATABASE_READS).toEqual({
      undo_window_seconds: 600,
      connection_answer_window_hours: 24,
      sign_up_draft_keep_days: 7,
      sign_up_stopped_keep_days: 90,
      sign_up_reminder_after_hours: 24,
    });
  });
});
